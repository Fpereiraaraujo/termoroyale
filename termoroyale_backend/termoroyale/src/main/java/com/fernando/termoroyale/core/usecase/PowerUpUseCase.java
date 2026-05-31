package com.fernando.termoroyale.core.usecase;

import com.fernando.termoroyale.core.domain.Player;
import com.fernando.termoroyale.core.domain.Room;
import com.fernando.termoroyale.core.port.RoomRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.locks.Lock;

/**
 * Power-ups consumíveis pelo jogador. Hoje implementa apenas {@code Dica}:
 * revela 1 letra do alvo (grid 0) em troca de 2 tentativas. Limite de 1 uso
 * por jogador por partida.
 */
@Service
@RequiredArgsConstructor
public class PowerUpUseCase {

    private static final Logger log = LoggerFactory.getLogger(PowerUpUseCase.class);
    private static final int HINT_COST = 2;
    private static final int MAX_HINTS_PER_PLAYER = 1;

    private final RoomRepositoryPort roomRepository;
    private final RoomLockRegistry lockRegistry;
    private final SimpMessagingTemplate messagingTemplate;

    /** Resposta enviada ao jogador via {@code /user/queue/hint}. */
    public record HintResponse(int position, String letter, int remainingAttempts) {}

    public HintResponse useHint(String roomId, String playerName) {
        Lock lock = lockRegistry.lockFor(roomId);
        lock.lock();
        try {
            Room room = roomRepository.findById(roomId)
                    .orElseThrow(() -> new RuntimeException("Sala não encontrada."));

            if ("FINISHED".equals(room.getStatus()) || !"PLAYING".equals(room.getStatus())) {
                throw new RuntimeException("Power-up só pode ser usado em partida em andamento.");
            }
            Player player = room.getPlayers().stream()
                    .filter(p -> p.getName().equalsIgnoreCase(playerName))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Jogador não encontrado na sala."));

            if (!player.isAlive() || player.isWon()) {
                throw new RuntimeException("Dica indisponível agora.");
            }

            Integer used = room.getUsedHints().getOrDefault(playerName.toLowerCase(), 0);
            if (used >= MAX_HINTS_PER_PLAYER) {
                throw new RuntimeException("Você já usou sua dica nesta partida.");
            }

            int remaining = room.getMaxAttempts() - player.getCurrentAttempts();
            if (remaining <= HINT_COST) {
                throw new RuntimeException("Tentativas insuficientes para usar a dica.");
            }

            List<String> targets = room.getTargetWords();
            if (targets == null || targets.isEmpty()) {
                throw new RuntimeException("Sala sem palavra alvo.");
            }
            String target = targets.get(0).toUpperCase();

            // Posições já reveladas como CORRECT em qualquer palpite do jogador no grid 0.
            boolean[] revealed = new boolean[target.length()];
            for (List<List<String>> attempt : player.getResults()) {
                if (attempt == null || attempt.isEmpty()) continue;
                List<String> grid0 = attempt.get(0);
                for (int i = 0; i < Math.min(grid0.size(), revealed.length); i++) {
                    if ("CORRECT".equals(grid0.get(i))) revealed[i] = true;
                }
            }

            List<Integer> candidates = new ArrayList<>();
            for (int i = 0; i < target.length(); i++) if (!revealed[i]) candidates.add(i);
            if (candidates.isEmpty()) {
                throw new RuntimeException("Todas as letras dessa palavra já foram reveladas.");
            }

            int pick = candidates.get(ThreadLocalRandom.current().nextInt(candidates.size()));
            String letter = String.valueOf(target.charAt(pick));

            // Cobra o custo (consome tentativas) e marca uso.
            player.setCurrentAttempts(player.getCurrentAttempts() + HINT_COST);
            room.getUsedHints().put(playerName.toLowerCase(), used + 1);

            if (player.getCurrentAttempts() >= room.getMaxAttempts()) {
                player.setAlive(false);
            }

            roomRepository.save(room);
            messagingTemplate.convertAndSend("/topic/room/" + roomId, room);

            int newRemaining = Math.max(0, room.getMaxAttempts() - player.getCurrentAttempts());
            log.info("Player {} usou dica em {}: pos={} letra={} (restam {} tentativas)",
                    playerName, roomId, pick, letter, newRemaining);
            return new HintResponse(pick, letter, newRemaining);
        } finally {
            lock.unlock();
        }
    }
}
