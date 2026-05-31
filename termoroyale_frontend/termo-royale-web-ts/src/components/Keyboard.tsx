import type {LetterStatus} from "../types/game";

interface KeyboardProps {
    onKeyPress: (key: string) => void;
    keyStatuses: Record<string, LetterStatus>;
}

export function Keyboard({ onKeyPress, keyStatuses }: KeyboardProps) {
    const rows = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DELETE']
    ];

    const getKeyStyle = (key: string) => {
        const status = keyStatuses[key];
        const base = "flex-1 h-12 md:h-14 rounded font-bold text-sm flex items-center justify-center m-0.5 transition-colors ";

        if (key === 'ENTER' || key === 'DELETE') return base + "bg-slate-300 hover:bg-slate-200 text-slate-700 px-4 flex-[1.5]";

        switch (status) {
            case 'CORRECT': return base + "bg-emerald-500 text-white";
            case 'PRESENT': return base + "bg-amber-500 text-white";
            case 'ABSENT': return base + "bg-slate-500 text-slate-200";
            default: return base + "bg-white hover:bg-slate-50 text-slate-700 border-b-4 border-slate-200";
        }
    };

    return (
        <div className="w-full max-w-2xl">
            {rows.map((row, i) => (
                <div key={i} className="flex justify-center mb-1">
                    {row.map(key => (
                        <button key={key} onClick={() => onKeyPress(key)} className={getKeyStyle(key)}>
                            {key === 'DELETE' ? '⌫' : key}
                        </button>
                    ))}
                </div>
            ))}
        </div>
    );
}