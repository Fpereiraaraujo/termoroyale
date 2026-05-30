import { useState, useEffect, useRef } from "react";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { RoomListItem, type RoomInfo } from "./RoomListItem.tsx";
import { CreateRoomModal } from "./CreateRoomModal.tsx";

interface LobbyProps {
    playerName: string;
    onJoinRoom: (roomId: string) => void;
    onCreateRoom: (roomName: string, maxPlayers: number, isPrivate: boolean) => void;
}

export function Lobby({ playerName, onJoinRoom, onCreateRoom }: LobbyProps) {
    const [rooms, setRooms] = useState<RoomInfo[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const stompClient = useRef<Client | null>(null);

    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws-termo'),
            connectHeaders: { user: playerName },
            onConnect: () => {
                client.subscribe('/topic/lobby', (message) => {
                    const activeRooms = JSON.parse(message.body);
                    setRooms(activeRooms);
                });

                client.publish({ destination: '/app/lobby/rooms' });
            },
        });

        client.activate();
        stompClient.current = client;

        return () => {
            client.deactivate();
        };
    }, [playerName]);

    const handleCreateRoom = (roomName: string, maxPlayers: number, isPrivate: boolean) => {
        onCreateRoom(roomName, maxPlayers, isPrivate);
    };

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-sky-200 bg-cover bg-center p-2 sm:p-4"
             style={{ backgroundImage: "url('/bg-stadium.jpg')" }}>

            <div className="w-full max-w-4xl h-[95vh] sm:h-auto bg-slate-100/90 backdrop-blur-md rounded-2xl shadow-xl border border-white flex flex-col overflow-hidden relative">

                {/* Cabeçalho Limpo e Mobile Friendly */}
                <div className="bg-slate-800 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center text-white gap-4 shrink-0">
                    <div className="text-center sm:text-left">
                        <h2 className="text-2xl sm:text-3xl font-black tracking-widest uppercase">Lobby Principal</h2>
                        <p className="text-slate-400 font-medium text-sm sm:text-base mt-1">Bem-vindo, <span className="text-yellow-400">{playerName}</span></p>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full sm:w-auto bg-green-500 hover:bg-green-400 text-white font-black px-8 py-3.5 rounded-xl uppercase tracking-widest transition-all hover:shadow-lg active:scale-95 text-sm sm:text-base"
                    >
                        Criar Sala
                    </button>
                </div>

                {/* Lista de Salas Adaptável */}
                <div className="flex-1 p-3 sm:p-6 overflow-y-auto bg-slate-100/50">
                    {rooms.length === 0 ? (
                        <div className="text-center text-slate-500 py-12 font-bold text-lg sm:text-xl px-4">
                            Nenhuma sala disponível no momento. Crie a sua no botão acima!
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2.5 sm:gap-3">
                            {rooms.map(room => (
                                <RoomListItem key={room.id} room={room} onJoin={onJoinRoom} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <CreateRoomModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCreateRoom}
            />
        </div>
    );
}