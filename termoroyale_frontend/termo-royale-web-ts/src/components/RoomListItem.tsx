export interface RoomInfo {
    id: string;
    name: string;
    playersCount: number;
    maxPlayers: number;
    status: 'WAITING' | 'PLAYING';
}

interface RoomListItemProps {
    room: RoomInfo;
    onJoin: (roomId: string) => void;
}

export function RoomListItem({ room, onJoin }: RoomListItemProps) {
    return (
        <div className="bg-white border-2 border-slate-200 rounded-xl p-4 flex justify-between items-center hover:border-sky-300 transition-colors shadow-sm">
            <div className="flex flex-col">
                <span className="text-xl font-black text-slate-700 uppercase">{room.name}</span>
                <span className="text-xs font-bold text-slate-400 mt-1">
                    ID: #{room.id} • {room.playersCount} / {room.maxPlayers} Jogadores
                </span>
            </div>

            <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                    room.status === 'WAITING' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                }`}>
                    {room.status === 'WAITING' ? 'Aguardando' : 'Em Jogo'}
                </span>

                <button
                    onClick={() => onJoin(room.id)}
                    disabled={room.status === 'PLAYING'}
                    className="bg-sky-500 hover:bg-sky-400 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold px-6 py-2 rounded-lg uppercase tracking-wider transition-all active:scale-95"
                >
                    Entrar
                </button>
            </div>
        </div>
    );
}