import { useI18n } from "../i18n";

export interface RoomInfo {
    id: string;
    name: string;
    playersCount: number;
    maxPlayers: number;
    status: 'WAITING' | 'PLAYING';
    theme?: string;
    gameMode?: string;
}

interface RoomListItemProps {
    room: RoomInfo;
    onJoin: (roomId: string) => void;
}

const THEME_STYLES: Record<string, { label: string; cls: string; emoji: string }> = {
    GERAL:   { label: "Geral",   cls: "bg-slate-100 text-slate-600 border-slate-200",         emoji: "·"   },
    ANIMAIS: { label: "Animais", cls: "bg-emerald-50 text-emerald-700 border-emerald-200",     emoji: "🐾" },
    COMIDA:  { label: "Comida",  cls: "bg-amber-50 text-amber-700 border-amber-200",           emoji: "🍴" },
    VERBOS:  { label: "Verbos",  cls: "bg-sky-50 text-sky-700 border-sky-200",                 emoji: "✏️" },
};

export function RoomListItem({ room, onJoin }: RoomListItemProps) {
    const { t } = useI18n();
    const theme = THEME_STYLES[(room.theme || "GERAL").toUpperCase()] || THEME_STYLES.GERAL;
    const isBlitz = (room.gameMode || "ROYALE").toUpperCase() === "BLITZ";
    return (
        <div className="bg-white border-2 border-slate-200 rounded-xl p-4 flex justify-between items-center hover:border-emerald-300 transition-colors shadow-sm">
            <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl font-black text-slate-700 uppercase">{room.name}</span>
                    {isBlitz && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border bg-rose-50 text-rose-700 border-rose-200">
                            ⚡ Blitz
                        </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${theme.cls}`}>
                        {theme.emoji} {theme.label}
                    </span>
                </div>
                <span className="text-xs font-bold text-slate-400 mt-1">
                    ID: #{room.id} • {room.playersCount} / {room.maxPlayers} {t("room.players")}
                </span>
            </div>

            <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${
                    room.status === 'WAITING' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                    {room.status === 'WAITING' ? t("room.waiting") : t("room.playing")}
                </span>

                <button
                    onClick={() => onJoin(room.id)}
                    disabled={room.status === 'PLAYING'}
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold px-6 py-2 rounded-lg uppercase tracking-wider transition-all active:scale-95"
                >
                    {t("room.join")}
                </button>
            </div>
        </div>
    );
}