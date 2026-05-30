import type { Player } from "../../types/game";
import type { PodiumEntry } from "./useVictoryData";

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
            <span className="text-3xl mb-1">{medal}</span>
            <span className={`font-black uppercase tracking-wide text-sm truncate max-w-full ${isMe ? "text-sky-300" : "text-white"}`}>
                {player.name}
            </span>
            <div className={`mt-2 w-full ${height} rounded-t-xl bg-linear-to-b ${color} border-2 border-white/20 flex items-start justify-center pt-2`}>
                <span className="text-slate-900 font-black text-2xl">{place}</span>
            </div>
        </div>
    );
}

export function Podium({ podium, meuNome }: PodiumProps) {
    if (podium.length === 0) return null;
    const isMe = (name: string) => name.toLowerCase() === meuNome.toLowerCase();
    return (
        <div className="mt-8 w-full max-w-lg">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 text-center mb-3">
                Pódio Final
            </h3>
            <div className="flex items-end justify-center gap-3">
                {podium[1] && <PodiumStep place={2} player={podium[1].player} height="h-20" color="from-slate-400 to-slate-300" medal="🥈" isMe={isMe(podium[1].player.name)} />}
                {podium[0] && <PodiumStep place={1} player={podium[0].player} height="h-28" color="from-yellow-500 to-yellow-300" medal="🥇" isMe={isMe(podium[0].player.name)} />}
                {podium[2] && <PodiumStep place={3} player={podium[2].player} height="h-16" color="from-amber-700 to-amber-500" medal="🥉" isMe={isMe(podium[2].player.name)} />}
            </div>
        </div>
    );
}
