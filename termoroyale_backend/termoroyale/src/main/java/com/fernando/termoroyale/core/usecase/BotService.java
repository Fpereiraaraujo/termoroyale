package com.fernando.termoroyale.core.usecase;

import com.fernando.termoroyale.core.domain.Player;
import com.fernando.termoroyale.core.domain.Room;
import com.fernando.termoroyale.core.port.DictionaryPort;
import com.fernando.termoroyale.core.port.RoomRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;

/**
 * Preenche salas vazias com bots e dispara palpites lentos para dar vida à arena.
 *
 * <p>Bots não substituem jogadores reais — só entram quando faltam humanos e
 * mantêm cadência de 8-18s por palpite (longe do rate limit do GameUseCase).
 * Usam o pool amplo do dicionário, então raramente acertam de primeira.</p>
 */
@Component
@RequiredArgsConstructor
public class BotService {

    private static final Logger log = LoggerFactory.getLogger(BotService.class);

    /** Nomes-base para os bots; combinados com o prefixo "Bot ". */
    private static final List<String> BOT_NAMES = List.of(
            "Tatu", "Cobra", "Gato", "Onca", "Coruja", "Sapo", "Lula", "Zorro", "Pivete", "Quico");

    /** Não enche sala que já tenha pelo menos esse tanto de humanos. */
    private static final int MIN_HUMANS_FOR_NO_BOTS = 3;
    /** Limite de bots por sala (evita farsa total de bot-vs-bot). */
    private static final int MAX_BOTS_PER_ROOM = 2;
    private static final long MIN_GUESS_INTERVAL_MS = 8_000L;
    private static final long MAX_GUESS_INTERVAL_MS = 18_000L;

    private final RoomRepositoryPort roomRepository;
    private final DictionaryPort dictionaryPort;
    /** @Lazy para evitar ciclo Bot ↔ Game (Game não precisa de Bot, mas Spring resolve lazy). */
    @Lazy private final GameUseCase gameUseCase;

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2, r -> {
        Thread t = new Thread(r, "bot-service");
        t.setDaemon(true);
        return t;
    });

    /** roomId → futures de cada bot ativo (para cancelar limpo no fim). */
    private final ConcurrentHashMap<String, List<ScheduledFuture<?>>> roomBotFutures = new ConcurrentHashMap<>();

    /**
     * Tenta adicionar bots a uma sala em WAITING. Retorna true se adicionou pelo
     * menos um. O caller é responsável por persistir a Room.
     */
    public boolean fillRoomWithBots(Room room) {
        if (room == null) return false;
        long humans = room.getPlayers().stream().filter(p -> !p.isBot()).count();
        if (humans == 0) return false; // não cria sala só de bot
        if (humans >= MIN_HUMANS_FOR_NO_BOTS) return false;
        long existingBots = room.getPlayers().stream().filter(Player::isBot).count();
        int capacity = Math.max(0, room.getMaxPlayers() - room.getPlayers().size());
        int toAdd = (int) Math.min(MAX_BOTS_PER_ROOM - existingBots, capacity);
        if (toAdd <= 0) return false;

        List<String> usedLower = new ArrayList<>();
        for (Player p : room.getPlayers()) usedLower.add(p.getName().toLowerCase());

        int added = 0;
        List<String> shuffled = new ArrayList<>(BOT_NAMES);
        java.util.Collections.shuffle(shuffled);
        for (String base : shuffled) {
            if (added >= toAdd) break;
            String name = "Bot " + base;
            if (usedLower.contains(name.toLowerCase())) continue;
            Player bot = new Player(UUID.randomUUID().toString(), name, true, 0, false);
            bot.setBot(true);
            room.addPlayer(bot);
            usedLower.add(name.toLowerCase());
            added++;
        }
        if (added > 0) {
            log.info("BotService adicionou {} bot(s) à sala {}", added, room.getId());
        }
        return added > 0;
    }

    /** Inicia o loop de palpites para todos os bots presentes na sala. Idempotente. */
    public void startBotsForRoom(String roomId) {
        Room room = roomRepository.findById(roomId).orElse(null);
        if (room == null) return;
        List<Player> bots = room.getPlayers().stream().filter(Player::isBot).toList();
        if (bots.isEmpty()) return;

        stopBotsForRoom(roomId);
        List<ScheduledFuture<?>> futures = new ArrayList<>();
        roomBotFutures.put(roomId, futures);
        for (Player bot : bots) {
            futures.add(scheduleNextGuess(roomId, bot.getName()));
        }
        log.info("BotService iniciou loop para {} bot(s) na sala {}", bots.size(), roomId);
    }

    /** Para todos os timers de bots para a sala. Idempotente. */
    public void stopBotsForRoom(String roomId) {
        List<ScheduledFuture<?>> futures = roomBotFutures.remove(roomId);
        if (futures != null) {
            futures.forEach(f -> f.cancel(false));
        }
    }

    private ScheduledFuture<?> scheduleNextGuess(String roomId, String botName) {
        long delay = ThreadLocalRandom.current().nextLong(MIN_GUESS_INTERVAL_MS, MAX_GUESS_INTERVAL_MS + 1);
        return scheduler.schedule(() -> botTick(roomId, botName), delay, TimeUnit.MILLISECONDS);
    }

    private void botTick(String roomId, String botName) {
        try {
            Room room = roomRepository.findById(roomId).orElse(null);
            if (room == null || room.isFinished()) {
                stopBotsForRoom(roomId);
                return;
            }
            if (!"PLAYING".equals(room.getStatus())) {
                // Ainda em WAITING — tenta de novo daqui a pouco.
                scheduleAfter(roomId, botName);
                return;
            }
            Player bot = room.getPlayers().stream()
                    .filter(p -> p.getName().equalsIgnoreCase(botName))
                    .findFirst().orElse(null);
            if (bot == null || !bot.isAlive() || bot.isWon()) {
                return; // bot eliminado ou vencedor — não agenda mais
            }

            String guess = dictionaryPort.getSoloRandomWord();
            try {
                gameUseCase.processGuess(roomId, botName, guess);
            } catch (Exception e) {
                log.debug("Bot {} falhou palpite '{}' na sala {}: {}", botName, guess, roomId, e.getMessage());
            }
            scheduleAfter(roomId, botName);
        } catch (Exception e) {
            log.error("Erro no botTick {}/{}: {}", roomId, botName, e.getMessage());
        }
    }

    private void scheduleAfter(String roomId, String botName) {
        List<ScheduledFuture<?>> futures = roomBotFutures.get(roomId);
        if (futures == null) return;
        futures.add(scheduleNextGuess(roomId, botName));
    }
}
