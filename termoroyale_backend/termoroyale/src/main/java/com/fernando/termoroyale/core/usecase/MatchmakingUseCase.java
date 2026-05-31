package com.fernando.termoroyale.core.usecase;

import com.fernando.termoroyale.core.domain.Player;
import com.fernando.termoroyale.core.domain.Room;
import com.fernando.termoroyale.core.port.RoomRepositoryPort;
import com.fernando.termoroyale.core.port.DictionaryPort;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;

@Service
@RequiredArgsConstructor
public class MatchmakingUseCase {

    private static final Logger log = LoggerFactory.getLogger(MatchmakingUseCase.class);
    /** Limite de salas ativas simultâneas (proteg endo t2.micro contra abuso/OOM). */
    private static final long MAX_ACTIVE_ROOMS = 100L;

    private final RoomRepositoryPort roomRepository;
    private final DictionaryPort dictionaryPort;
    private final SimpMessagingTemplate messagingTemplate;
    private final GameUseCase gameUseCase;
    private final RoomLockRegistry lockRegistry;
    private final LobbyBroadcaster lobbyBroadcaster;
    private final ProfanityFilter profanityFilter;
    private final BotService botService;
    /** Pool compartilhado dimensionado para o t2.micro (1 vCPU). */
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2, r -> {
        Thread t = new Thread(r, "room-timer");
        t.setDaemon(true);
        return t;
    });
    /** Futures por sala para permitir cancelamento limpo (sem throw). */
    private final ConcurrentHashMap<String, ScheduledFuture<?>> roomTimers = new ConcurrentHashMap<>();

    public Room joinOrCreateRoom(String playerName, String playerId, String requestedRoomId, String requestedRoomName, Integer requestedMaxPlayers, Boolean isPrivate, String theme, String gameMode) {
        if (profanityFilter.contains(playerName)) {
            throw new RuntimeException("Nome de jogador inadequado. Escolha outro.");
        }
        if (requestedRoomName != null && profanityFilter.contains(requestedRoomName)) {
            throw new RuntimeException("Nome de sala inadequado. Escolha outro.");
        }
        Room room;
        boolean isNewRoom = false;

        if (requestedRoomId != null && !requestedRoomId.trim().isEmpty()) {
            room = roomRepository.findById(requestedRoomId)
                    .orElseThrow(() -> new RuntimeException("Sala não encontrada: " + requestedRoomId));
        } else if (requestedRoomName != null && !requestedRoomName.trim().isEmpty()) {
            if (roomRepository.countActive() >= MAX_ACTIVE_ROOMS) {
                throw new RuntimeException("Limite de salas ativas atingido. Tente novamente mais tarde.");
            }
            room = createNewRoom(null, requestedRoomName, requestedMaxPlayers, isPrivate == null ? false : isPrivate, theme, gameMode);
            isNewRoom = true;
        } else {
            room = roomRepository.findAvailableRoom().orElseGet(() -> {
                if (roomRepository.countActive() >= MAX_ACTIVE_ROOMS) {
                    throw new RuntimeException("Limite de salas ativas atingido. Tente novamente mais tarde.");
                }
                return createNewRoom(null, "Arena Pública", requestedMaxPlayers, isPrivate == null ? false : isPrivate, theme, gameMode);
            });
            if (room.getPlayers().isEmpty()) {
                isNewRoom = true;
            }
        }

        // Tenta reconectar pelo playerId primeiro (jogador que caiu e voltou)
        java.util.Optional<Player> existing = java.util.Optional.empty();
        if (playerId != null && !playerId.isBlank()) {
            existing = room.getPlayers().stream()
                    .filter(p -> playerId.equals(p.getId()))
                    .findFirst();
        }
        if (existing.isEmpty()) {
            existing = room.getPlayers().stream()
                    .filter(p -> p.getName().equalsIgnoreCase(playerName))
                    .findFirst();
        }

        if (existing.isPresent()) {
            log.info("Reconnect/rejoin do jogador {} na sala {}", playerName, room.getId());
        } else {
            if (room.getPlayers().size() >= room.getMaxPlayers()) {
                throw new RuntimeException("A sala já está lotada!");
            }
            boolean isSpectator = "PLAYING".equals(room.getStatus()) || "FINISHED".equals(room.getStatus());
            Player newPlayer = new Player(UUID.randomUUID().toString(), playerName, !isSpectator, 0, false);
            room.addPlayer(newPlayer);
        }

        if (room.getPlayers().size() >= room.getMaxPlayers() && "WAITING".equals(room.getStatus())) {
            room.setStatus("PLAYING");
            room.setStarted(true);
            if (room.getInitialPlayersCount() == 0) {
                room.setInitialPlayersCount(room.getPlayers().size());
            }
            room.setTimeLeft(room.getPhaseDuration());
            room.setPhaseStartTimestamp(System.currentTimeMillis() / 1000L);
            botService.startBotsForRoom(room.getId());
        }

        Room savedRoom = roomRepository.save(room);
        log.debug("DEBUG SALA: {} | Status: {} | Tempo: {} | Players: {}",
                savedRoom.getId(), savedRoom.getStatus(), savedRoom.getTimeLeft(), savedRoom.getPlayers().size());

        if (isNewRoom) {
            startRoomTimer(savedRoom.getId());
        }
        lobbyBroadcaster.invalidate();

        return savedRoom;
    }

    private void startRoomTimer(String roomId) {
        ScheduledFuture<?> future = scheduler.scheduleAtFixedRate(() -> {
            Lock lock = lockRegistry.lockFor(roomId);
            lock.lock();
            try {
                Room room = roomRepository.findById(roomId).orElse(null);
                if (room == null || room.isFinished()) {
                    cancelRoomTimer(roomId);
                    botService.stopBotsForRoom(roomId);
                    lockRegistry.release(roomId);
                    return;
                }

                int newTime = room.getTimeLeft() - 1;
                room.setTimeLeft(newTime);
                boolean lobbyChanged = false;

                // Preenche com bots faltando 10s para a sala em WAITING começar.
                if ("WAITING".equals(room.getStatus()) && newTime == 10) {
                    if (botService.fillRoomWithBots(room)) {
                        lobbyChanged = true;
                    }
                }

                if (newTime <= 0) {
                    if ("WAITING".equals(room.getStatus())) {
                        if (room.getInitialPlayersCount() == 0) {
                            room.setInitialPlayersCount(room.getPlayers().size());
                        }
                        room.setStatus("PLAYING");
                        room.setStarted(true);
                        room.setTimeLeft(room.getPhaseDuration());
                        room.setPhaseStartTimestamp(System.currentTimeMillis() / 1000L);
                        lobbyChanged = true;
                        botService.startBotsForRoom(roomId);
                    } else if ("PLAYING".equals(room.getStatus())) {
                        try {
                            gameUseCase.onPhaseTimeout(roomId);
                        } catch (Exception ex) {
                            log.error("Erro ao processar fim de fase: {}", ex.getMessage());
                        }
                        room = roomRepository.findById(roomId).orElse(room);
                        if (room != null && room.isFinished()) {
                            lobbyChanged = true;
                            botService.stopBotsForRoom(roomId);
                        }
                    }
                }

                if (room != null) {
                    roomRepository.save(room);
                    messagingTemplate.convertAndSend("/topic/room/" + roomId, room);
                }
                if (lobbyChanged) lobbyBroadcaster.invalidate();
            } catch (Exception e) {
                log.error("Erro no timer da sala {}: {}", roomId, e.getMessage());
            } finally {
                lock.unlock();
            }
        }, 1, 1, TimeUnit.SECONDS);

        ScheduledFuture<?> previous = roomTimers.put(roomId, future);
        if (previous != null) previous.cancel(false);
    }

    private void cancelRoomTimer(String roomId) {
        ScheduledFuture<?> f = roomTimers.remove(roomId);
        if (f != null) f.cancel(false);
    }

    public Room getRoomById(String roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Sala não encontrada: " + roomId));
    }

    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    /**
     * Cria (uma vez) ou recupera a sala de revanche derivada de uma sala finalizada
     * e insere o jogador chamador nela. O id da sala-revanche fica gravado na sala
     * original, então todos os outros jogadores que clicarem em Revanche caem na
     * mesma sala.
     */
    public Room requestRematch(String originalRoomId, String playerName, String playerId) {
        Lock lock = lockRegistry.lockFor(originalRoomId);
        lock.lock();
        String rematchRoomId;
        try {
            Room original = roomRepository.findById(originalRoomId)
                    .orElseThrow(() -> new RuntimeException("Sala original não encontrada: " + originalRoomId));

            rematchRoomId = original.getRematchRoomId();
            boolean rematchExists = rematchRoomId != null
                    && roomRepository.findById(rematchRoomId).isPresent();

            if (!rematchExists) {
                String baseName = original.getName() != null ? original.getName() : "Arena";
                String rematchName = baseName.startsWith("Revanche · ") ? baseName : "Revanche · " + baseName;
                Room rematch = createNewRoom(null, rematchName, original.getMaxPlayers(), false,
                        original.getTheme(), original.getGameMode());
                Room savedRematch = roomRepository.save(rematch);
                rematchRoomId = savedRematch.getId();
                original.setRematchRoomId(rematchRoomId);
                roomRepository.save(original);
                startRoomTimer(rematchRoomId);
                log.info("Sala de revanche {} criada a partir de {}", rematchRoomId, originalRoomId);
                // Avisa todos os jogadores ainda assistindo a sala original
                messagingTemplate.convertAndSend("/topic/room/" + originalRoomId, original);
            }
        } finally {
            lock.unlock();
        }
        return joinOrCreateRoom(playerName, playerId, rematchRoomId, null, null, null, null, null);
    }

    private static final java.util.Set<String> VALID_THEMES = java.util.Set.of("GERAL", "ANIMAIS", "COMIDA", "VERBOS");
    private static final java.util.Set<String> VALID_MODES = java.util.Set.of("ROYALE", "BLITZ");

    private Room createNewRoom(String customId, String roomName, Integer maxPlayers, boolean isPrivate, String theme, String gameMode) {
        Room newRoom = new Room();
        if (customId != null) {
            newRoom.setId(customId.toUpperCase());
        }

        if (roomName != null && !roomName.trim().isEmpty()) {
            newRoom.setName(roomName);
        } else {
            newRoom.setName("Arena Royale #" + newRoom.getId());
        }

        String normalizedTheme = (theme == null) ? "GERAL" : theme.toUpperCase();
        if (!VALID_THEMES.contains(normalizedTheme)) normalizedTheme = "GERAL";
        newRoom.setTheme(normalizedTheme);

        String normalizedMode = (gameMode == null) ? "ROYALE" : gameMode.toUpperCase();
        if (!VALID_MODES.contains(normalizedMode)) normalizedMode = "ROYALE";
        newRoom.setGameMode(normalizedMode);
        if ("BLITZ".equals(normalizedMode)) {
            newRoom.setPhaseDuration(60);
        }

        newRoom.setStatus("WAITING");
        // Lobby waiting time must remain 30 seconds
        newRoom.setTimeLeft(30);
        if (maxPlayers != null && maxPlayers > 0) newRoom.setMaxPlayers(maxPlayers);
        newRoom.getTargetWords().add(dictionaryPort.getRandomTargetWord(normalizedTheme));
        newRoom.getRoundTargets().put(1, new java.util.ArrayList<>(newRoom.getTargetWords()));

        // mark createdAt
        newRoom.setCreatedAt(System.currentTimeMillis() / 1000L);

        return newRoom;
    }
}