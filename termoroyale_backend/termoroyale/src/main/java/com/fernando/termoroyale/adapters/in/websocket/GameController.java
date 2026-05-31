package com.fernando.termoroyale.adapters.in.websocket;

import com.fernando.termoroyale.core.domain.Room;
import com.fernando.termoroyale.core.usecase.GameUseCase;
import com.fernando.termoroyale.core.usecase.LobbyBroadcaster;
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

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GameController.class);

    private final MatchmakingUseCase matchmakingUseCase;
    private final GameUseCase gameUseCase;
    private final com.fernando.termoroyale.core.usecase.PowerUpUseCase powerUpUseCase;
    private final SimpMessagingTemplate messagingTemplate;
    private final LobbyBroadcaster lobbyBroadcaster;

    @MessageMapping("/lobby/rooms")
    @SendTo("/topic/lobby")
    public List<LobbyBroadcaster.RoomSummary> getActiveRooms() {
        return lobbyBroadcaster.snapshot();
    }


    @MessageMapping("/join")
    public void joinGame(@Payload JoinRequest request) {
        // A chamada tem que ter os parâmetros do request:
        Room room = matchmakingUseCase.joinOrCreateRoom(
                request.playerName(),
                request.playerId(),
                request.roomId(),
                request.roomName(),
                request.maxPlayers(),
                request.isPrivate(),
                request.theme(),
                request.gameMode()
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
            log.error("Erro ao processar palpite na sala {}: {}", request.roomId(), e.getMessage());
            messagingTemplate.convertAndSendToUser(
                    request.playerName(),
                    "/queue/errors",
                    Map.of("message", e.getMessage() != null ? e.getMessage() : "Erro ao processar palpite", "type", "GUESS_ERROR")
            );
        }
    }

    @MessageMapping("/rematch")
    public void handleRematch(@Payload RematchRequest request) {
        try {
            Room rematchRoom = matchmakingUseCase.requestRematch(
                    request.originalRoomId(),
                    request.playerName(),
                    request.playerId()
            );
            messagingTemplate.convertAndSendToUser(request.playerName(), "/queue/room", rematchRoom);
            messagingTemplate.convertAndSend("/topic/room/" + rematchRoom.getId(), rematchRoom);
        } catch (Exception e) {
            log.error("Erro ao processar revanche da sala {}: {}", request.originalRoomId(), e.getMessage());
            messagingTemplate.convertAndSendToUser(
                    request.playerName(),
                    "/queue/errors",
                    Map.of("message", e.getMessage() != null ? e.getMessage() : "Erro ao iniciar revanche", "type", "REMATCH_ERROR")
            );
        }
    }

    @MessageMapping("/reaction")
    public void handleReaction(@Payload ReactionRequest request) {
        if (request.emoji() == null || request.emoji().length() > 8) return;
        messagingTemplate.convertAndSend(
                "/topic/room/" + request.roomId() + "/reactions",
                Map.of(
                        "emoji", request.emoji(),
                        "playerName", request.playerName(),
                        "timestamp", System.currentTimeMillis()
                )
        );
    }

    @MessageMapping("/hint")
    public void handleHint(@Payload HintRequest request) {
        try {
            var response = powerUpUseCase.useHint(request.roomId(), request.playerName());
            messagingTemplate.convertAndSendToUser(
                    request.playerName(), "/queue/hint", response);
        } catch (Exception e) {
            log.warn("Hint negada sala={} player={}: {}", request.roomId(), request.playerName(), e.getMessage());
            messagingTemplate.convertAndSendToUser(
                    request.playerName(),
                    "/queue/errors",
                    Map.of("message", e.getMessage() != null ? e.getMessage() : "Dica indisponível", "type", "HINT_DENIED")
            );
        }
    }

    // Records
    public record GuessRequest(String roomId, String playerName, String word) {}
    public record RoomListResponse(String id, String name, int playersCount, int maxPlayers, String status) {}
    public record JoinRequest(String playerName, String playerId, String roomId, String roomName, Integer maxPlayers, Boolean isPrivate, String theme, String gameMode) {}
    public record RematchRequest(String originalRoomId, String playerName, String playerId) {}
    public record ReactionRequest(String roomId, String playerName, String emoji) {}
    public record HintRequest(String roomId, String playerName) {}
}