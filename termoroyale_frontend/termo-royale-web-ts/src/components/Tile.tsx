import type {LetterStatus} from '../types/game';

interface TileProps {
    letter?: string;
    status?: LetterStatus;
}

export function Tile({ letter, status = 'EMPTY' }: TileProps) {
    const bgColors: Record<LetterStatus, string> = {
        CORRECT: 'bg-green-600 border-green-700 text-white',
        PRESENT: 'bg-yellow-500 border-yellow-600 text-white',
        ABSENT: 'bg-slate-600 border-slate-700 text-white', // Cinza
        EMPTY: 'bg-white border-slate-300 text-slate-800',
    };

    return (
        <div className={`w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-lg border-2 text-2xl font-black uppercase transition-all duration-200 ${bgColors[status]}`}>
            {letter}
        </div>
    );
}