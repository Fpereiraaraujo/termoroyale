import type { Player, LetterStatus } from "../types/game";
import { useI18n } from "../i18n";

interface SpectatorBoardsProps {
    players: Player[];
    meuNome: string;
    targetWords: string[];
    maxAttempts: number;
}

const COLOR: Record<string, string> = {
    CORRECT: "bg-green-500 text-white border-green-600",
    PRESENT: "bg-yellow-500 text-white border-yellow-600",
    ABSENT: "bg-slate-400 text-white border-slate-500",
    EMPTY: "bg-slate-100 text-transparent border-slate-200",
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
    const { t } = useI18n();

    return (
        <div className={`rounded-2xl p-3 border-2 ${
            player.won
                ? "bg-green-50 border-green-400"
                : player.isAlive
                    ? "bg-white border-slate-200"
                    : "bg-red-50 border-red-300 opacity-60"
        } flex flex-col gap-2 min-w-0 shadow-sm`}>
            <div className="flex items-center justify-between gap-2">
                <span className="font-black uppercase tracking-wide text-slate-800 text-sm truncate">
                    {player.name}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 shrink-0">
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

            {player.won && (
                <span className="text-[10px] font-black uppercase tracking-widest text-green-600 text-center">
                    🏆 {t("spectator.solved")}
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
    const { t } = useI18n();
    const others = players.filter(
        p => p.name.toLowerCase() !== meuNome.toLowerCase() && (p.isAlive || p.won)
    );

    if (others.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-4xl border-2 border-slate-200 shadow-xl text-slate-700">
                <div className="text-7xl mb-4">👻</div>
                <h2 className="text-3xl font-black uppercase tracking-widest text-slate-700">
                    {t("spectator.eliminatedTitle")}
                </h2>
                <p className="text-slate-500 mt-2 font-bold text-base">{t("spectator.waitingNext")}</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl flex flex-col gap-4 px-4 py-6 bg-white rounded-4xl border-2 border-slate-200 shadow-xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-4xl">👻</span>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-widest text-slate-800">
                            {t("spectator.modeTitle")}
                        </h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                            {t("spectator.modeSubtitle")}
                        </p>
                    </div>
                </div>
                <span className="bg-slate-900 text-yellow-400 font-black px-3 py-1.5 rounded-full text-xs uppercase tracking-widest border border-slate-900">
                    {others.length} {others.length === 1 ? t("spectator.aliveOne") : t("spectator.aliveMany")}
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
