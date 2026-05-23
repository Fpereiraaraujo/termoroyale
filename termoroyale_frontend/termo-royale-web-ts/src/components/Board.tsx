import { Tile } from "./Tile.tsx";
import type { LetterStatus } from "../types/game";

interface BoardProps {
    guesses: string[];
    results: LetterStatus[][];
    currentGuess: string;
    title: string;
    targetWords: string[];
}

export function Board({ guesses, currentGuess, title, targetWords }: BoardProps) {
    const rows = Array(6).fill(null);

    return (
        <div className="flex flex-col items-center gap-6 p-6 bg-slate-100/90 backdrop-blur-md rounded-2xl shadow-xl border border-white">
            <h3 className="text-slate-700 font-black text-center tracking-widest text-2xl uppercase">{title}</h3>

            {/* O grid se ajusta automaticamente: 1, 2 ou 4 colunas */}
            <div className={`grid gap-4 ${targetWords.length > 2 ? 'grid-cols-2' : targetWords.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {targetWords.map((_target, gridIndex) => (
                    <div key={gridIndex} className="bg-white/40 p-3 rounded-xl border border-white/50">
                        {rows.map((_, rowIndex) => {
                            const isPastRow = rowIndex < guesses.length;
                            const isCurrentRow = rowIndex === guesses.length;
                            const word = isPastRow ? guesses[rowIndex] : (isCurrentRow ? currentGuess : "");

                            return (
                                <div key={rowIndex} className="flex gap-1.5 mb-1.5">
                                    {Array(5).fill(null).map((_, colIndex) => {
                                        const letter = word[colIndex] || "";

                                        // A LÓGICA DO DUO/QUARTETO:
                                        // O status aqui deve considerar a targetWord específica deste grid!
                                        // Para isso, você precisará de uma função de validação no front ou que o backend
                                        // retorne resultados separados por grid.
                                        const status = isPastRow ? 'ABSENT' : 'EMPTY';

                                        return <Tile key={colIndex} letter={letter} status={status} />;
                                    })}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}