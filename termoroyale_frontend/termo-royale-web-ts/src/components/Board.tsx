import { Tile, type TileSize } from "./Tile.tsx";
import type { LetterStatus } from "../types/game";

interface BoardProps {
    guesses: string[];
    results: LetterStatus[][][];
    currentGuess: string[];
    title: string;
    targetWords: string[];
    activeCol: number;
    onTileClick: (col: number) => void;
}

export function Board({
    guesses,
    results,
    currentGuess,
    title,
    targetWords,
    activeCol,
    onTileClick
}: BoardProps) {

    const rows = Array(6).fill(null);
    const gridCount = targetWords.length;
    // Termo (1) = grande, Duo (2) = médio, Quarteto (3-4+) = pequeno
    const tileSize: TileSize = gridCount >= 3 ? "sm" : gridCount === 2 ? "md" : "lg";
    const outerGap = gridCount >= 3 ? "gap-2" : "gap-3";
    const innerPad = gridCount >= 3 ? "p-1.5" : "p-2";
    const rowGap = gridCount >= 3 ? "gap-0.5 mb-0.5" : "gap-1 mb-1";

    return (
        <div className="flex flex-col items-center gap-2 p-3 bg-slate-100/90 backdrop-blur-md rounded-2xl shadow-xl border border-white">
            <h3 className="text-slate-700 font-black text-center tracking-widest text-base uppercase">
                {title}
            </h3>

            <div
                className={`grid ${outerGap} ${
                    gridCount > 1
                        ? "grid-cols-2"
                        : "grid-cols-1"
                }`}
            >
                {targetWords.map((_, gridIndex) => {

                    const solvedAtRow = guesses.findIndex((_, rIndex) =>
                        results[rIndex]?.[gridIndex]?.every(
                            s => s === "CORRECT"
                        )
                    );

                    const isGridSolved = solvedAtRow !== -1;

                    return (
                        <div
                            key={gridIndex}
                            className={`
                                ${innerPad}
                                rounded-xl
                                relative
                                transition-all
                                duration-500
                                ${
                                    isGridSolved
                                        ? "bg-green-100/50 border-2 border-green-400 shadow-lg scale-95 opacity-80"
                                        : "bg-white/40 border border-white/50"
                                }
                            `}
                        >
                            {rows.map((_, rowIndex) => {

                                const isPastRow =
                                    rowIndex < guesses.length;

                                const isCurrentRow =
                                    rowIndex === guesses.length;

                                const hideGuess =
                                    isGridSolved &&
                                    rowIndex > solvedAtRow;

                                const word = hideGuess
                                    ? Array(5).fill("")
                                    : isPastRow
                                        ? guesses[rowIndex].split("")
                                        : isCurrentRow
                                            ? currentGuess
                                            : Array(5).fill("");

                                return (
                                    <div
                                        key={rowIndex}
                                        className={`flex ${rowGap}`}
                                    >
                                        {Array(5)
                                            .fill(null)
                                            .map((_, colIndex) => {

                                                const letter =
                                                    word[colIndex] || "";

                                                let status: LetterStatus =
                                                    "EMPTY";

                                                if (hideGuess) {
                                                    status = "EMPTY";
                                                } else if (isPastRow) {
                                                    status =
                                                        results[rowIndex]?.[
                                                            gridIndex
                                                        ]?.[
                                                            colIndex
                                                        ] || "ABSENT";
                                                } else if (
                                                    isCurrentRow &&
                                                    letter !== ""
                                                ) {
                                                    status = "INITIAL";
                                                }

                                                const isActive =
                                                    isCurrentRow &&
                                                    colIndex === activeCol &&
                                                    !isGridSolved;

                                                const delay =
                                                    isPastRow &&
                                                    rowIndex ===
                                                        guesses.length - 1
                                                        ? colIndex * 150
                                                        : 0;

                                                return (
                                                    <Tile
                                                        key={colIndex}
                                                        letter={letter}
                                                        status={status}
                                                        isActive={isActive}
                                                        animationDelay={delay}
                                                        size={tileSize}
                                                        onClick={() => {
                                                            if (
                                                                isCurrentRow &&
                                                                !isGridSolved
                                                            ) {
                                                                onTileClick(
                                                                    colIndex
                                                                );
                                                            }
                                                        }}
                                                    />
                                                );
                                            })}
                                    </div>
                                );
                            })}

                            {isGridSolved && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                    <div className="bg-green-500 text-white font-black text-lg px-4 py-2 rounded-full transform -rotate-12 shadow-xl border-4 border-white">
                                        RESOLVIDO!
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}