package com.fernando.termoroyale.core.usecase;

import com.fernando.termoroyale.core.domain.Player;
import com.fernando.termoroyale.core.domain.Room;
import com.fernando.termoroyale.core.port.RoomRepositoryPort;
import com.fernando.termoroyale.core.port.DictionaryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class MatchmakingUseCase {

    private final RoomRepositoryPort roomRepository;
    private final DictionaryPort dictionaryPort;
    private final SimpMessagingTemplate messagingTemplate;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);

    public Room joinOrCreateRoom(String playerName, String requestedRoomId, String requestedRoomName) {
        Room room;
        boolean isNewRoom = false;

        if (requestedRoomId != null && !requestedRoomId.trim().isEmpty()) {
            room = roomRepository.findById(requestedRoomId)
                    .orElseThrow(() -> new RuntimeException("Sala não encontrada: " + requestedRoomId));
        } else if (requestedRoomName != null && !requestedRoomName.trim().isEmpty()) {
            room = createNewRoom(null, requestedRoomName);
            isNewRoom = true;
        } else {
            room = roomRepository.findAvailableRoom().orElseGet(() -> createNewRoom(null, "Arena Pública"));
        }

        if ("PLAYING".equals(room.getStatus()) || room.getPlayers().size() >= 20) {
            throw new RuntimeException("A sala já iniciou ou está lotada!");
        }

        boolean alreadyInRoom = room.getPlayers().stream()
                .anyMatch(p -> p.getName().equalsIgnoreCase(playerName));

        if (!alreadyInRoom) {
            Player newPlayer = new Player(UUID.randomUUID().toString(), playerName, true, 0, false);
            room.addPlayer(newPlayer);
        }

        if (room.getPlayers().size() >= 20) {
            room.setStatus("PLAYING");
        }

        Room savedRoom = roomRepository.save(room);
        System.out.println("DEBUG SALA: " + savedRoom.getId() +
                " | Status: " + savedRoom.getStatus() +
                " | Tempo: " + savedRoom.getTimeLeft() +
                " | Players: " + savedRoom.getPlayers().size());

        if (isNewRoom) {
            startRoomTimer(savedRoom.getId());
        }

        return savedRoom;
    }

    private void startRoomTimer(String roomId) {
        scheduler.scheduleAtFixedRate(() -> {
            try {
                Room room = roomRepository.findById(roomId).orElse(null);


                if (room == null || !"WAITING".equals(room.getStatus())) {
                    throw new RuntimeException("Encerrando timer...");
                }

                int newTime = room.getTimeLeft() - 1;
                room.setTimeLeft(newTime);

                if (newTime <= 0) {
                    room.setStatus("PLAYING");
                }

                roomRepository.save(room);
                messagingTemplate.convertAndSend("/topic/room/" + roomId, room);

            } catch (Exception e) {
                // Isso aqui cancela o agendamento se algo der errado
                throw new RuntimeException("Timer parado", e);
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

    private Room createNewRoom(String customId, String roomName) {
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
        newRoom.setTimeLeft(180);

        newRoom.getTargetWords().add(dictionaryPort.getRandomTargetWord());




        return newRoom;
    }


}