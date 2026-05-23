package com.fernando.termoroyale.adapters.in.websocket;

import com.fernando.termoroyale.core.domain.Room;
import com.fernando.termoroyale.core.usecase.GameUseCase;
import com.fernando.termoroyale.core.usecase.MatchmakingUseCase;
import com.fernando.termoroyale.core.exception.InvalidWordException;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class GameController {

    private final MatchmakingUseCase matchmakingUseCase;
    private final GameUseCase gameUseCase;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/lobby/rooms")
    @SendTo("/topic/lobby")
    public List<RoomListResponse> getActiveRooms() {
        return matchmakingUseCase.getAllRooms().stream()
                .map(room -> new RoomListResponse(
                        room.getId(),
                        room.getName(), // <-- Adicionamos o envio do Nome!
                        room.getPlayers().size(),
                        room.getMaxAttempts(),
                        room.isFinished() ? "PLAYING" : "WAITING"
                ))
                .toList();
    }


    @MessageMapping("/join")
    public void joinGame(@Payload JoinRequest request) {
        // A chamada tem que ter os 3 parâmetros do request:
        Room room = matchmakingUseCase.joinOrCreateRoom(
                request.playerName(),
                request.roomId(),
                request.roomName()
        );

        messagingTemplate.convertAndSendToUser(request.playerName(), "/queue/room", room);
        messagingTemplate.convertAndSend("/topic/room/" + room.getId(), room);
    }

    @MessageMapping("/guess")
    public void handleGuess(@Payload GuessRequest request) {
        try {
            gameUseCase.processGuess(request.roomId(), request.playerName(), request.word());
            Room updatedRoom = matchmakingUseCase.getRoomById(request.roomId());
            messagingTemplate.convertAndSend("/topic/room/" + request.roomId(), updatedRoom);

        } catch (InvalidWordException e) {
            messagingTemplate.convertAndSendToUser(
                    request.playerName(),
                    "/queue/errors",
                    Map.of("message", e.getMessage(), "type", "INVALID_WORD")
            );
        } catch (Exception e) {
            System.err.println("Erro no palpite: " + e.getMessage());
        }
    }

    // Records
    public record GuessRequest(String roomId, String playerName, String word) {}
    public record RoomListResponse(String id, String name, int playersCount, int maxPlayers, String status) {}
    public record JoinRequest(String playerName, String roomId, String roomName) {}
}