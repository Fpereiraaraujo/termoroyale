import type { Player, LetterStatus } from "../types/game";

interface SpectatorBoardsProps {
    players: Player[];
    meuNome: string;
    targetWords: string[];
    maxAttempts: number;
}

const COLOR: Record<string, string> = {
    CORRECT: "bg-green-500 text-white border-green-700",
    PRESENT: "bg-yellow-500 text-white border-yellow-700",
    ABSENT: "bg-slate-700 text-slate-300 border-slate-800",
    EMPTY: "bg-slate-800/60 text-transparent border-slate-700",
};

function MiniGrid({
                      attempts,
                      gridIndex,
                      maxAttempts,
                  }: {
    attempts: LetterStatus[][][];
    gridIndex: number;
    maxAttempts: number;
}) {
    const rows = Array.from({ length: maxAttempts }).map((_, rowIdx) => {
        const attempt = attempts[rowIdx];
        const grid = attempt?.[gridIndex];
        return Array.from({ length: 5 }).map((_, colIdx) => {
            const status = (grid?.[colIdx] as string) ?? "EMPTY";
            return COLOR[status] ?? COLOR.EMPTY;
        });
    });

    return (
        <div className="grid grid-rows-6 gap-0.5">
            {rows.map((row, i) => (
                <div key={i} className="flex gap-0.5">
                    {row.map((cls, j) => (
                        <div
                            key={j}
                            className={`w-2.5 h-2.5 rounded-sm border ${cls}`}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

function SpectatorPlayerCard({
                                 player,
                                 targetWords,
                                 maxAttempts,
                             }: {
    player: Player;
    targetWords: string[];
    maxAttempts: number;
}) {
    const lastGuess = player.guesses[player.guesses.length - 1];
    const lastResults = player.results[player.results.length - 1];

    return (
        <div className={`rounded-2xl p-3 border-2 ${
            player.won
                ? "bg-green-900/40 border-green-500"
                : player.isAlive
                    ? "bg-slate-900/80 border-slate-700"
                    : "bg-red-900/30 border-red-700 opacity-60"
        } flex flex-col gap-2 min-w-0`}>
            <div className="flex items-center justify-between gap-2">
                <span className="font-black uppercase tracking-wide text-white text-sm truncate">
                    {player.name}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">
                    {player.currentAttempts}/{maxAttempts}
                </span>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
                {targetWords.map((_, gridIdx) => (
                    <MiniGrid
                        key={gridIdx}
                        attempts={player.results}
                        gridIndex={gridIdx}
                        maxAttempts={maxAttempts}
                    />
                ))}
            </div>

            {lastGuess && (
                <div className="flex gap-0.5 justify-center mt-1">
                    {lastGuess.split("").map((letter, i) => {
                        const status = (lastResults?.[0]?.[i] as string) ?? "EMPTY";
                        const cls = COLOR[status] ?? COLOR.EMPTY;
                        return (
                            <span
                                key={i}
                                className={`w-5 h-5 flex items-center justify-center text-[10px] font-black uppercase rounded ${cls}`}
                            >
                                {letter}
                            </span>
                        );
                    })}
                </div>
            )}

            {player.won && (
                <span className="text-[10px] font-black uppercase tracking-widest text-green-300 text-center">
                    🏆 Resolveu
                </span>
            )}
        </div>
    );
}

export function SpectatorBoards({
                                    players,
                                    meuNome,
                                    targetWords,
                                    maxAttempts,
                                }: SpectatorBoardsProps) {
    const others = players.filter(
        p => p.name.toLowerCase() !== meuNome.toLowerCase() && (p.isAlive || p.won)
    );

    if (others.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-900/90 backdrop-blur-xl rounded-[3rem] border-4 border-slate-700 shadow-2xl text-white">
                <div className="text-7xl mb-4">👻</div>
                <h2 className="text-3xl font-black uppercase tracking-widest text-slate-300">
                    Eliminado
                </h2>
                <p className="text-slate-400 mt-2 font-bold text-base">Aguardando próxima sala.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl flex flex-col gap-4 px-4 py-6 bg-slate-900/90 backdrop-blur-xl rounded-[2rem] border-4 border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-4xl">👻</span>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-widest text-slate-200">
                            Modo Espectador
                        </h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                            Você foi eliminado — acompanhe quem ainda está na disputa
                        </p>
                    </div>
                </div>
                <span className="bg-slate-800 text-yellow-400 font-black px-3 py-1.5 rounded-full text-xs uppercase tracking-widest border border-yellow-400/30">
                    {others.length} {others.length === 1 ? "vivo" : "vivos"}
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                {others.map(p => (
                    <SpectatorPlayerCard
                        key={p.id}
                        player={p}
                        targetWords={targetWords}
                        maxAttempts={maxAttempts}
                    />
                ))}
            </div>
        </div>
    );
}
