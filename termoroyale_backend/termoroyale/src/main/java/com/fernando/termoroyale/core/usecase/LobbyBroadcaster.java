package com.fernando.termoroyale.core.usecase;

import com.fernando.termoroyale.core.domain.Room;
import com.fernando.termoroyale.core.port.RoomRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Centraliza o broadcast da lista de salas para o lobby.
 *
 * <p>Em vez de varrer o Redis a cada subscriber ou a cada evento, agrupa
 * sinalizações de invalidação em uma janela curta (debounce) e publica o
 * snapshot uma única vez. Isso é crítico em t2.micro onde KEYS/SCAN
 * frequentes derrubariam o Redis.</p>
 */
@Component
@RequiredArgsConstructor
public class LobbyBroadcaster {

    private static final long DEBOUNCE_MS = 250L;
    private static final String LOBBY_TOPIC = "/topic/lobby";

    private final RoomRepositoryPort roomRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "lobby-broadcaster");
        t.setDaemon(true);
        return t;
    });
    private final AtomicReference<ScheduledFuture<?>> pending = new AtomicReference<>();

    /** Marca o lobby como sujo e agenda um push (debounce). */
    public void invalidate() {
        ScheduledFuture<?> previous = pending.getAndSet(scheduler.schedule(
                this::publishNow, DEBOUNCE_MS, TimeUnit.MILLISECONDS));
        if (previous != null) previous.cancel(false);
    }

    /** Publica imediatamente (usado por requisição explícita do cliente). */
    public List<RoomSummary> publishNow() {
        List<RoomSummary> snapshot = snapshot();
        messagingTemplate.convertAndSend(LOBBY_TOPIC, snapshot);
        return snapshot;
    }

    public List<RoomSummary> snapshot() {
        return roomRepository.findAll().stream()
                .map(r -> new RoomSummary(
                        r.getId(),
                        r.getName(),
                        r.getPlayers() == null ? 0 : r.getPlayers().size(),
                        r.getMaxPlayers(),
                        r.getStatus(),
                        r.getTheme() == null ? "GERAL" : r.getTheme(),
                        r.getGameMode() == null ? "ROYALE" : r.getGameMode()))
                .toList();
    }

    public record RoomSummary(String id, String name, int playersCount, int maxPlayers, String status, String theme, String gameMode) {}
}
