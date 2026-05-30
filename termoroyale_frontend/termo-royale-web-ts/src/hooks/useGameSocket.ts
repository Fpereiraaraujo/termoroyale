import { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { Room } from '../types/game';

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
            onConnect: () => {
                setIsConnected(true);

                client.subscribe('/user/queue/room', (message) => {
                    const initialRoom = JSON.parse(message.body);
                    setRoom(initialRoom);

                    if (subscribedRoomId.current !== initialRoom.id) {
                        client.subscribe(`/topic/room/${initialRoom.id}`, (roomMsg) => {
                            setRoom(JSON.parse(roomMsg.body));
                        });
                        subscribedRoomId.current = initialRoom.id;
                    }
                });

                client.publish({
                    destination: '/app/join',
                    body: JSON.stringify({
                        playerName,
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
                setRoom(null);
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