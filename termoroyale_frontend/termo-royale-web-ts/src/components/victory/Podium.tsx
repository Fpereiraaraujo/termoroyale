import type { Player } from "../../types/game";
import type { PodiumEntry } from "./useVictoryData";
import { useI18n } from "../../i18n";

interface PodiumProps {
    podium: PodiumEntry[];
    meuNome: string;
}

function PodiumStep({
                        place,
                        player,
                        height,
                        color,
                        medal,
                        isMe,
                    }: {
    place: number;
    player: Player;
    height: string;
    color: string;
    medal: string;
    isMe: boolean;
}) {
    return (
        <div className="flex flex-col items-center w-1/3">
            <span className="text-2xl mb-0.5">{medal}</span>
            <span className={`font-black uppercase tracking-wide text-xs truncate max-w-full ${isMe ? "text-sky-400" : "text-slate-200"}`}>
                {player.name}
            </span>
            <div className={`mt-1.5 w-full ${height} rounded-t-xl bg-linear-to-b ${color} border-2 border-slate-700 flex items-start justify-center pt-1 shadow-inner`}>
                <span className="text-slate-900 font-black text-xl">{place}</span>
            </div>
        </div>
    );
}

export function Podium({ podium, meuNome }: PodiumProps) {
    const { t } = useI18n();
    if (podium.length === 0) return null;
    const isMe = (name: string) => name.toLowerCase() === meuNome.toLowerCase();
    return (
        <div className="mt-4 w-full max-w-lg">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center mb-2">
                {t("victory.podium")}
            </h3>
            <div className="flex items-end justify-center gap-3">
                {podium[1] && <PodiumStep place={2} player={podium[1].player} height="h-14" color="from-slate-400 to-slate-300" medal="🥈" isMe={isMe(podium[1].player.name)} />}
                {podium[0] && <PodiumStep place={1} player={podium[0].player} height="h-20" color="from-yellow-500 to-yellow-300" medal="🥇" isMe={isMe(podium[0].player.name)} />}
                {podium[2] && <PodiumStep place={3} player={podium[2].player} height="h-10" color="from-amber-700 to-amber-500" medal="🥉" isMe={isMe(podium[2].player.name)} />}
            </div>
        </div>
    );
}
