interface ScoreboardProps {
    lives: number;
    maxLives: number;
    timeRemaining: string;
    currentRound: number;
    status: string;
    alivePlayers: number;
    totalPlayers: number;
}

export function Scoreboard({
                               lives,
                               maxLives,
                               timeRemaining,
                               currentRound,
                               status,
                               alivePlayers,
                               totalPlayers,
                           }: ScoreboardProps) {
    const isFinished = status === "FINISHED";
    const rounds = [1, 2, 3];

    return (
        <div className="w-full bg-slate-900 border-b-4 border-yellow-400 shadow-2xl text-white px-4 py-2 flex items-center justify-between gap-4">
            {/* Logo + vidas */}
            <div className="flex items-center gap-3">
                <div className="bg-yellow-400 text-slate-900 font-black text-base px-3 py-1 rounded-md tracking-widest shadow-inner">
                    TERMO<span className="text-slate-900">·</span>ROYALE
                </div>
                <div className="flex items-center gap-1">
                    {Array.from({ length: maxLives }).map((_, i) => (
                        <span
                            key={i}
                            className={`text-base ${i < lives ? "text-red-500" : "text-slate-700"}`}
                        >
                            ❤
                        </span>
                    ))}
                </div>
            </div>

            {/* Indicador de fase R1/R2/R3 */}
            <div className="flex items-center gap-2">
                {rounds.map(r => {
                    const isPast = r < currentRound;
                    const isCurrent = r === currentRound && !isFinished;
                    return (
                        <div key={r} className="flex items-center gap-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-2 transition-all ${
                                isCurrent
                                    ? "bg-yellow-400 text-slate-900 border-yellow-200 animate-pulse shadow-lg shadow-yellow-400/50"
                                    : isPast
                                        ? "bg-green-500 text-white border-green-300"
                                        : "bg-slate-800 text-slate-500 border-slate-700"
                            }`}>
                                {isPast ? "✓" : `R${r}`}
                            </div>
                            {r < 3 && (
                                <div className={`w-4 h-0.5 ${
                                    r < currentRound ? "bg-green-500" : "bg-slate-700"
                                }`} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Cronômetro estilo LED */}
            <div className="flex flex-col items-center bg-black px-4 py-1 rounded-lg border-2 border-yellow-400 shadow-inner min-w-[110px]">
                <span className="text-[9px] font-bold text-yellow-400/70 tracking-widest uppercase leading-none">
                    {isFinished ? "Encerrado" : "Tempo"}
                </span>
                <span className="text-3xl font-mono font-black text-yellow-400 tracking-wider leading-tight" style={{ textShadow: "0 0 8px rgba(250, 204, 21, 0.6)" }}>
                    {timeRemaining}
                </span>
            </div>

            {/* Jogadores vivos */}
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Arena</span>
                <span className="text-lg font-black">
                    <span className="text-green-400">{alivePlayers}</span>
                    <span className="text-slate-500 mx-1">/</span>
                    <span className="text-slate-300">{totalPlayers}</span>
                </span>
            </div>
        </div>
    );
}
