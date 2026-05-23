import { useState, useEffect, useRef } from "react";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface RoomInfo {
    id: string;
    name: string;
    playersCount: number;
    maxPlayers: number;
    status: 'WAITING' | 'PLAYING';
}

interface LobbyProps {
    playerName: string;
    onJoinRoom: (roomId: string) => void;
    onCreateRoom: (roomName: string) => void;
}

export function Lobby({ playerName, onJoinRoom, onCreateRoom }: LobbyProps) {
    const [rooms, setRooms] = useState<RoomInfo[]>([]);
    const stompClient = useRef<Client | null>(null);

    useEffect(() => {
        // Conecta ao canal do lobby para ouvir as salas em tempo real
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws-termo'),
            connectHeaders: { user: playerName },
            onConnect: () => {
                console.log("Lobby conectado ao WebSocket!");

                // Se inscreve no tópico global do lobby
                client.subscribe('/topic/lobby', (message) => {
                    const activeRooms = JSON.parse(message.body);
                    setRooms(activeRooms);
                });

                // Pede a lista inicial de salas assim que conecta
                client.publish({ destination: '/app/lobby/rooms' });
            },
        });

        client.activate();
        stompClient.current = client;

        return () => {
            client.deactivate();
        };
    }, [playerName]);

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-sky-200 bg-cover bg-center p-4"
             style={{ backgroundImage: "url('/bg-stadium.jpg')" }}>

            <div className="w-full max-w-4xl bg-slate-100/90 backdrop-blur-md rounded-2xl shadow-xl border border-white flex flex-col overflow-hidden">

                {/* Cabeçalho do Lobby */}
                <div className="bg-slate-800 p-6 flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-3xl font-black tracking-widest uppercase">Lobby Principal</h2>
                        <p className="text-slate-400 font-medium">Bem-vindo, <span className="text-yellow-400">{playerName}</span></p>
                    </div>
                    <button
                        onClick={() => {
                            const roomName = prompt("Digite o nome da sua sala:");
                            if (roomName && roomName.trim().length > 0) {
                                // Passamos o nome da sala para a função de criação
                                onCreateRoom(roomName.trim());
                            }
                        }}
                        className="bg-green-500 hover:bg-green-400 text-slate-900 font-bold px-6 py-3 rounded-lg uppercase tracking-widest transition-all active:scale-95 shadow-lg"
                    >
                        + Criar Sala
                    </button>
                </div>

                {/* Lista de Salas Reais */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {rooms.length === 0 ? (
                        <div className="text-center text-slate-500 py-10 font-bold text-xl">
                            Nenhuma sala disponível no momento. Crie a sua no botão acima!
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {rooms.map(room => (
                                <div key={room.id} className="bg-white border-2 border-slate-200 rounded-xl p-4 flex justify-between items-center hover:border-sky-300 transition-colors shadow-sm">

                                    <div className="flex flex-col">
                                        {/* Agora mostra o nome real que você digitou! */}
                                        <span className="text-xl font-black text-slate-700 uppercase">{room.name}</span>
                                        <span className="text-xs font-bold text-slate-400">
                                            ID: #{room.id} • {room.playersCount} / {room.maxPlayers} Jogadores
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                                            room.status === 'WAITING' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {room.status === 'WAITING' ? 'Aguardando' : 'Em Jogo'}
                                        </span>

                                        <button
                                            onClick={() => onJoinRoom(room.id)}
                                            disabled={room.status === 'PLAYING'}
                                            className="bg-sky-500 hover:bg-sky-400 disabled:bg-slate-300 text-white font-bold px-6 py-2 rounded-lg uppercase tracking-wider transition-all active:scale-95"
                                        >
                                            Entrar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}