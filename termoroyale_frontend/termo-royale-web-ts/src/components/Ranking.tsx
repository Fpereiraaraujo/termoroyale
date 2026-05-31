import { useEffect, useMemo, useRef, useState } from "react";
import { avatarFor } from "../utils/avatar";
import { useI18n } from "../i18n";

interface RankingProps {
    players: any[];
    currentPlayerName: string;
    currentRound: number; // Precisamos disso para buscar o tempo da fase certa
    phaseElapsed: number; // segundos decorridos na fase atual (em tempo real)
}

export function Ranking({ players, currentPlayerName, currentRound, phaseElapsed }: RankingProps) {
    const { t } = useI18n();

    const sortedPlayers = useMemo(() => {
        return [...players].sort((a, b) => {
            // 1. Quem ganhou sempre fica no topo
            if (a.won && !b.won) return -1;
            if (!a.won && b.won) return 1;

            // 2. Se ambos ganharam, o critério é o TEMPO (solvedTimes)
            if (a.won && b.won) {
                const timeA = a.solvedTimes?.[currentRound] || 99999;
                const timeB = b.solvedTimes?.[currentRound] || 99999;
                return timeA - timeB;
            }

            // 3. Status de sobrevivência
            if (!a.isAlive && b.isAlive) return 1;
            if (a.isAlive && !b.isAlive) return -1;

            return 0;
        });
    }, [players, currentRound]);

    // Flash verde quando um jogador acaba de transicionar para `won`.
    const prevWinnersRef = useRef<Set<string>>(new Set());
    const [flashing, setFlashing] = useState<Set<string>>(new Set());

    useEffect(() => {
        const currentWinners = new Set<string>(
            players.filter(p => p.won).map(p => p.id as string)
        );
        const newlyWon: string[] = [];
        currentWinners.forEach(id => {
            if (!prevWinnersRef.current.has(id)) newlyWon.push(id);
        });
        prevWinnersRef.current = currentWinners;

        if (newlyWon.length === 0) return;
        setFlashing(prev => {
            const next = new Set(prev);
            newlyWon.forEach(id => next.add(id));
            return next;
        });
        const timer = setTimeout(() => {
            setFlashing(prev => {
                const next = new Set(prev);
                newlyWon.forEach(id => next.delete(id));
                return next;
            });
        }, 1800);
        return () => clearTimeout(timer);
    }, [players]);

    return (
        <div className="w-80 bg-slate-950/90 backdrop-blur-md border-l border-slate-800 shadow-2xl flex flex-col text-white">
            <style>{`
                @keyframes wonFlash {
                    0%   { background-color: rgba(16, 185, 129, 0.55); box-shadow: 0 0 0 0 rgba(16,185,129,0.7); }
                    60%  { background-color: rgba(16, 185, 129, 0.25); box-shadow: 0 0 0 14px rgba(16,185,129,0); }
                    100% { background-color: transparent; box-shadow: 0 0 0 0 rgba(16,185,129,0); }
                }
                .won-flash { animation: wonFlash 1.8s ease-out; }
            `}</style>

            <div className="p-6 border-b border-slate-800 bg-slate-900/60">
                <h3 className="text-2xl font-black tracking-widest uppercase flex items-center gap-3">
                    <span className="w-2 h-8 bg-amber-400 rounded-full"></span>
                    {t("ranking.title")}
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {sortedPlayers.map((player, index) => {
                    const isMe = player.name.toLowerCase() === currentPlayerName.toLowerCase();
                    const rankClass = index === 0 ? "text-amber-400" : index === 1 ? "text-slate-300" : index === 2 ? "text-amber-600" : "text-slate-500";
                    const solveTime = player.solvedTimes?.[currentRound];
                    const isFlashing = flashing.has(player.id);

                    // Tempo a exibir: se ganhou usa solveTime; se ainda joga e está vivo, mostra
                    // o elapsed em tempo real da fase. Se saiu, mostra o último tempo conhecido.
                    const liveSeconds = player.won
                        ? solveTime
                        : player.isAlive
                            ? phaseElapsed
                            : undefined;

                    return (
                        <div
                            key={player.id}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                isMe ? 'bg-amber-400/15 border-amber-400/50' : 'bg-slate-800/50 border-slate-800'
                            } ${isFlashing ? 'won-flash' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className={`text-2xl font-black w-6 text-center ${rankClass}`}>#{index + 1}</span>
                                {(() => {
                                    const av = avatarFor(player.name);
                                    return (
                                        <div className={`w-10 h-10 rounded-full ${av.bg} flex items-center justify-center text-white font-black text-xs shrink-0 ring-2 ${av.ring} shadow-md`}>
                                            {av.initials}
                                        </div>
                                    );
                                })()}
                                <div className="flex flex-col">
                                    <span className="font-bold text-base truncate w-24 uppercase">
                                        {player.bot && <span className="text-[10px] mr-1 px-1 rounded bg-slate-700 text-slate-300 align-middle">🤖</span>}
                                        {player.name}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        {isMe && <span className="text-[10px] text-amber-400 font-black tracking-widest uppercase">{t("ranking.you")}</span>}
                                        {liveSeconds !== undefined && (
                                            <span className={`text-[10px] font-black tracking-widest uppercase ${
                                                player.won ? 'text-emerald-400' : 'text-slate-400'
                                            }`}>
                                                {liveSeconds}s
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                {player.won ? (
                                    <span className="bg-emerald-500/15 text-emerald-300 font-black px-3 py-1 rounded-lg text-xs uppercase tracking-widest border border-emerald-500/40">
                                        {solveTime ? `${solveTime}s` : t("ranking.won")}
                                    </span>
                                ) : !player.isAlive ? (
                                    <span className="bg-rose-500/15 text-rose-300 font-black px-3 py-1 rounded-lg text-xs uppercase tracking-widest border border-rose-500/40">{t("ranking.out")}</span>
                                ) : (
                                    <span className="bg-slate-800 text-slate-300 font-black px-3 py-1 rounded-lg text-xs uppercase tracking-widest border border-slate-700">
                                        {t("ranking.playing")}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}