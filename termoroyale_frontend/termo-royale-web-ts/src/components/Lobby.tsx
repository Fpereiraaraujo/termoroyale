import { useState, useEffect, useRef, useMemo } from "react";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { RoomListItem, type RoomInfo } from "./RoomListItem.tsx";
import { CreateRoomModal, type RoomTheme, type GameMode } from "./CreateRoomModal.tsx";
import { useI18n, LanguageSwitcher } from "../i18n";

interface LobbyProps {
    playerName: string;
    onJoinRoom: (roomId: string) => void;
    onCreateRoom: (roomName: string, maxPlayers: number, isPrivate: boolean, theme: RoomTheme, gameMode: GameMode) => void;
}

const PAGE_SIZE = 8;

export function Lobby({ playerName, onJoinRoom, onCreateRoom }: LobbyProps) {
    const [rooms, setRooms] = useState<RoomInfo[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const { t } = useI18n();

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

    const handleCreateRoom = (roomName: string, maxPlayers: number, isPrivate: boolean, theme: RoomTheme, gameMode: GameMode) => {
        onCreateRoom(roomName, maxPlayers, isPrivate, theme, gameMode);
    };

    // Filtro + ordenação (WAITING primeiro, depois mais cheia primeiro)
    const filteredRooms = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = q
            ? rooms.filter(r =>
                  r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
              )
            : rooms.slice();
        list.sort((a, b) => {
            if (a.status !== b.status) return a.status === "WAITING" ? -1 : 1;
            return b.playersCount - a.playersCount;
        });
        return list;
    }, [rooms, search]);

    const totalPages = Math.max(1, Math.ceil(filteredRooms.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const pageRooms = filteredRooms.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    // Reseta página quando a busca muda
    useEffect(() => { setPage(1); }, [search]);

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-sky-200 bg-cover bg-center p-2 sm:p-4"
             style={{ backgroundImage: "url('/bg-stadium.jpg')" }}>

            <div className="fixed top-4 right-4 z-50">
                <LanguageSwitcher />
            </div>

            <div className="w-full max-w-4xl h-[95vh] sm:h-auto bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden relative">

                <div className="bg-slate-800 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center text-white gap-4 shrink-0">
                    <div className="text-center sm:text-left">
                        <h2 className="text-2xl sm:text-3xl font-black tracking-widest uppercase">{t("lobby.title")}</h2>
                        <p className="text-slate-400 font-medium text-sm sm:text-base mt-1">{t("lobby.welcome")} <span className="text-amber-400">{playerName}</span></p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-white font-black px-8 py-3.5 rounded-xl uppercase tracking-widest transition-all hover:shadow-lg active:scale-95 text-sm sm:text-base"
                        >
                            {t("lobby.create")}
                        </button>
                    </div>
                </div>

                {/* Barra de busca */}
                <div className="px-3 sm:px-6 pt-3 sm:pt-4 pb-2 bg-slate-50 shrink-0">
                    <div className="relative">
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={t("lobby.searchPlaceholder")}
                            className="w-full bg-white border-2 border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500 placeholder:font-normal placeholder:text-slate-400"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">🔍</span>
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-lg font-black"
                                aria-label="clear"
                            >×</button>
                        )}
                    </div>
                </div>

                {/* Lista de Salas */}
                <div className="flex-1 px-3 sm:px-6 pb-3 sm:pb-4 overflow-y-auto bg-slate-50">
                    {filteredRooms.length === 0 ? (
                        <div className="text-center text-slate-500 py-12 font-bold text-lg sm:text-xl px-4">
                            {search ? t("lobby.noResults") : t("lobby.empty")}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2.5 sm:gap-3">
                            {pageRooms.map(room => (
                                <RoomListItem key={room.id} room={room} onJoin={onJoinRoom} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Paginação */}
                {filteredRooms.length > PAGE_SIZE && (
                    <div className="px-3 sm:px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={safePage === 1}
                            className="bg-slate-800 disabled:bg-slate-300 text-white font-black px-4 py-2 rounded-lg uppercase text-xs tracking-widest hover:bg-slate-700 active:scale-95 transition-all"
                        >
                            ‹ {t("lobby.prev")}
                        </button>
                        <span className="text-xs sm:text-sm font-black text-slate-600 tracking-widest uppercase">
                            {t("lobby.pageOf", { current: safePage, total: totalPages })}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={safePage === totalPages}
                            className="bg-slate-800 disabled:bg-slate-300 text-white font-black px-4 py-2 rounded-lg uppercase text-xs tracking-widest hover:bg-slate-700 active:scale-95 transition-all"
                        >
                            {t("lobby.next")} ›
                        </button>
                    </div>
                )}
            </div>

            <CreateRoomModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCreateRoom}
            />
        </div>
    );
}