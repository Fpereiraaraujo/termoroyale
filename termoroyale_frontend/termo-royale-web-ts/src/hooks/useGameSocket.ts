import { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { Room } from '../types/game';

const PLAYER_ID_KEY = (roomId: string, playerName: string) =>
    `termoroyale.playerId.${roomId}.${playerName.toLowerCase()}`;

function loadPlayerId(roomId: string | null, playerName: string): string | null {
    if (!roomId || !playerName) return null;
    try { return sessionStorage.getItem(PLAYER_ID_KEY(roomId, playerName)); } catch { return null; }
}

function savePlayerId(roomId: string, playerName: string, playerId: string) {
    try { sessionStorage.setItem(PLAYER_ID_KEY(roomId, playerName), playerId); } catch { /* ignore */ }
}

export function useGameSocket(
    playerName: string,
    selectedRoomId: string | null,
    selectedRoomName: string | null,
    selectedRoomMaxPlayers: number | null,
    selectedRoomIsPrivate: boolean | null,
    shouldConnect: boolean
) {
    const [room, setRoom] = useState<Room | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const stompClient = useRef<Client | null>(null);
    const subscribedRoomId = useRef<string | null>(null);

    useEffect(() => {
        if (!playerName || !shouldConnect) return;

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws-termo'),
            connectHeaders: { user: playerName },
            // Reconexão automática a cada 3s se a conexão cair
            reconnectDelay: 3000,
            onConnect: () => {
                setIsConnected(true);

                client.subscribe('/user/queue/room', (message) => {
                    const initialRoom: Room = JSON.parse(message.body);
                    setRoom(initialRoom);

                    // Salva o playerId desta sala localmente para reconexões futuras
                    const me = initialRoom.players.find(
                        p => p.name.toLowerCase() === playerName.toLowerCase()
                    );
                    if (me && me.id) {
                        savePlayerId(initialRoom.id, playerName, me.id);
                    }

                    if (subscribedRoomId.current !== initialRoom.id) {
                        client.subscribe(`/topic/room/${initialRoom.id}`, (roomMsg) => {
                            setRoom(JSON.parse(roomMsg.body));
                        });
                        subscribedRoomId.current = initialRoom.id;
                    }
                });

                // Envia o playerId salvo (se houver) para o backend tentar reconectar
                // ao Player existente em vez de criar um novo / virar espectador.
                client.publish({
                    destination: '/app/join',
                    body: JSON.stringify({
                        playerName,
                        playerId: loadPlayerId(selectedRoomId, playerName),
                        roomId: selectedRoomId,
                        roomName: selectedRoomName,
                        maxPlayers: selectedRoomMaxPlayers,
                        isPrivate: selectedRoomIsPrivate
                    })
                });
            },
            onDisconnect: () => {
                setIsConnected(false);
                subscribedRoomId.current = null;
                // Mantemos `room` para a UI seguir mostrando estado durante reconexão.
            },
            onWebSocketClose: () => {
                setIsConnected(false);
            },
        });

        client.activate();
        stompClient.current = client;

        return () => {
            client.deactivate();
        };
    }, [playerName, selectedRoomId, selectedRoomName, shouldConnect]);

    const sendGuess = (word: string) => {
        if (stompClient.current?.connected && room) {
            stompClient.current.publish({
                destination: '/app/guess',
                body: JSON.stringify({
                    roomId: room.id,
                    playerName: playerName,
                    word: word.toUpperCase()
                })
            });
        }
    };

    return { room, isConnected, sendGuess };
}