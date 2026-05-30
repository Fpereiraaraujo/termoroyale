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
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;

@Service
@RequiredArgsConstructor
public class MatchmakingUseCase {

    private static final Logger log = LoggerFactory.getLogger(MatchmakingUseCase.class);

    private final RoomRepositoryPort roomRepository;
    private final DictionaryPort dictionaryPort;
    private final SimpMessagingTemplate messagingTemplate;
    private final GameUseCase gameUseCase;
    private final RoomLockRegistry lockRegistry;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);

    public Room joinOrCreateRoom(String playerName, String playerId, String requestedRoomId, String requestedRoomName, Integer requestedMaxPlayers, Boolean isPrivate) {
        Room room;
        boolean isNewRoom = false;

        if (requestedRoomId != null && !requestedRoomId.trim().isEmpty()) {
            room = roomRepository.findById(requestedRoomId)
                    .orElseThrow(() -> new RuntimeException("Sala não encontrada: " + requestedRoomId));
        } else if (requestedRoomName != null && !requestedRoomName.trim().isEmpty()) {
            room = createNewRoom(null, requestedRoomName, requestedMaxPlayers, isPrivate == null ? false : isPrivate);
            isNewRoom = true;
        } else {
            room = roomRepository.findAvailableRoom().orElseGet(() -> createNewRoom(null, "Arena Pública", requestedMaxPlayers, isPrivate == null ? false : isPrivate));
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
        }

        Room savedRoom = roomRepository.save(room);
        log.debug("DEBUG SALA: {} | Status: {} | Tempo: {} | Players: {}",
                savedRoom.getId(), savedRoom.getStatus(), savedRoom.getTimeLeft(), savedRoom.getPlayers().size());

        if (isNewRoom) {
            startRoomTimer(savedRoom.getId());
        }

        return savedRoom;
    }

    private void startRoomTimer(String roomId) {
        scheduler.scheduleAtFixedRate(() -> {
            Room room = null;
            Lock lock = lockRegistry.lockFor(roomId);
            lock.lock();
            try {
                 room = roomRepository.findById(roomId).orElse(null);
                if (room == null || room.isFinished()) {
                    lockRegistry.release(roomId);
                    throw new RuntimeException("Encerrando timer...");
                }

                int newTime = room.getTimeLeft() - 1;
                room.setTimeLeft(newTime);

                if (newTime <= 0) {
                    if ("WAITING".equals(room.getStatus())) {
                        // waiting phase ended -> start playing
                        if (room.getInitialPlayersCount() == 0) {
                            room.setInitialPlayersCount(room.getPlayers().size());
                        }
                        room.setStatus("PLAYING");
                        room.setStarted(true);
                        room.setTimeLeft(room.getPhaseDuration());
                        room.setPhaseStartTimestamp(System.currentTimeMillis() / 1000L);
                        roomRepository.save(room);
                        messagingTemplate.convertAndSend("/topic/room/" + roomId, room);
                    } else if ("PLAYING".equals(room.getStatus())) {
                        // phase expired -> delegate handling to GameUseCase
                        try {
                            gameUseCase.onPhaseTimeout(roomId);
                        } catch (Exception ex) {
                            log.error("Erro ao processar fim de fase: {}", ex.getMessage());
                        }
                        // reload room for latest state
                        room = roomRepository.findById(roomId).orElse(room);
                    }
                }

                roomRepository.save(room);
                messagingTemplate.convertAndSend("/topic/room/" + roomId, room);

            } catch (Exception e) {
                throw new RuntimeException("Timer parado", e);
            } finally {
                lock.unlock();
            }
        }, 1, 1, TimeUnit.SECONDS);
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
                Room rematch = createNewRoom(null, rematchName, original.getMaxPlayers(), false);
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
        return joinOrCreateRoom(playerName, playerId, rematchRoomId, null, null, null);
    }

    private Room createNewRoom(String customId, String roomName, Integer maxPlayers, boolean isPrivate) {
        Room newRoom = new Room();
        if (customId != null) {
            newRoom.setId(customId.toUpperCase());
        }

        if (roomName != null && !roomName.trim().isEmpty()) {
            newRoom.setName(roomName);
        } else {
            newRoom.setName("Arena Royale #" + newRoom.getId());
        }

        newRoom.setStatus("WAITING");
        // Lobby waiting time must remain 30 seconds
        newRoom.setTimeLeft(30);
        if (maxPlayers != null && maxPlayers > 0) newRoom.setMaxPlayers(maxPlayers);
        newRoom.getTargetWords().add(dictionaryPort.getRandomTargetWord());
        newRoom.getRoundTargets().put(1, new java.util.ArrayList<>(newRoom.getTargetWords()));

        // mark createdAt
        newRoom.setCreatedAt(System.currentTimeMillis() / 1000L);

        return newRoom;
    }
}