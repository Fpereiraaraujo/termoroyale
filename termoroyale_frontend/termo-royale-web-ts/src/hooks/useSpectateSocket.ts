import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { Room } from "../types/game";

/**
 * Hook somente leitura — assina /topic/room/{id} sem entrar como jogador.
 * Não dispara /app/join, então a sala não é alterada.
 */
export function useSpectateSocket(roomId: string | null) {
    const [room, setRoom] = useState<Room | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        if (!roomId) return;

        const client = new Client({
            webSocketFactory: () => new SockJS("http://localhost:8080/ws-termo"),
            connectHeaders: { user: `spectator-${Math.random().toString(36).slice(2, 8)}` },
            reconnectDelay: 3000,
            onConnect: () => {
                setIsConnected(true);
                client.subscribe(`/topic/room/${roomId}`, (msg) => {
                    setRoom(JSON.parse(msg.body));
                });
            },
            onWebSocketClose: () => setIsConnected(false),
            onDisconnect: () => setIsConnected(false),
        });
        client.activate();
        clientRef.current = client;
        return () => { client.deactivate(); };
    }, [roomId]);

    return { room, isConnected };
}
