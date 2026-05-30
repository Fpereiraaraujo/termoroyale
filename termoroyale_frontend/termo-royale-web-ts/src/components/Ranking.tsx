import { useMemo } from "react";

interface RankingProps {
    players: any[];
    currentPlayerName: string;
    currentRound: number; // Precisamos disso para buscar o tempo da fase certa
}

export function Ranking({ players, currentPlayerName, currentRound }: RankingProps) {

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

    return (
        <div className="w-80 bg-slate-900/95 backdrop-blur-md border-l border-white/10 shadow-2xl flex flex-col text-white">
            <div className="p-6 border-b border-white/10 bg-slate-800/50">
                <h3 className="text-2xl font-black tracking-widest uppercase flex items-center gap-3">
                    <span className="w-2 h-8 bg-sky-500 rounded-full"></span>
                    Ranking
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {sortedPlayers.map((player, index) => {
                    const isMe = player.name.toLowerCase() === currentPlayerName.toLowerCase();
                    const rankClass = index === 0 ? "text-yellow-400" : index === 1 ? "text-slate-300" : index === 2 ? "text-amber-600" : "text-slate-500";
                    const solveTime = player.solvedTimes?.[currentRound];

                    return (
                        <div key={player.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isMe ? 'bg-sky-500/20 border-sky-500/50' : 'bg-slate-800/50 border-white/5'}`}>
                            <div className="flex items-center gap-4">
                                <span className={`text-2xl font-black ${rankClass}`}>#{index + 1}</span>
                                <div className="flex flex-col">
                                    <span className="font-bold text-lg truncate w-28 uppercase">
                                        {player.name}
                                    </span>
                                    {isMe && <span className="text-[10px] text-sky-400 font-black tracking-widest uppercase">Você</span>}
                                </div>
                            </div>

                            <div>
                                {player.won ? (
                                    <span className="bg-green-500/20 text-green-400 font-black px-3 py-1 rounded-lg text-xs uppercase tracking-widest border border-green-500/30">
                                        {solveTime ? `${solveTime}s` : "Venceu"}
                                    </span>
                                ) : !player.isAlive ? (
                                    <span className="bg-red-500/20 text-red-400 font-black px-3 py-1 rounded-lg text-xs uppercase tracking-widest border border-red-500/30">Fora</span>
                                ) : (
                                    <span className="bg-slate-700 text-slate-300 font-black px-3 py-1 rounded-lg text-xs uppercase tracking-widest border border-slate-600">
                                        Jogando...
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