interface HeaderProps {
    lives: number;
    timeRemaining: string;
    currentPhase: string;
}

export function Header({ lives, timeRemaining, currentPhase }: HeaderProps) {
    return (
        <div className="flex justify-between items-start w-full">
            {/* Logo e Vidas */}
            <div className="flex flex-col gap-2">
                <div className="bg-slate-900 text-white font-black text-3xl px-4 py-2 rounded-xl border-4 border-slate-700 shadow-lg transform -rotate-2">
                    TERMO<br/><span className="text-yellow-400">ROYALE</span>
                </div>
                <div className="bg-white text-slate-800 font-bold text-xl px-4 py-1 rounded-full shadow border-2 border-slate-200 flex items-center justify-center w-fit">
                    {lives} <span className="text-red-500 ml-1">❤️</span>
                </div>
            </div>

            {/* Timer */}
            <div className="bg-white rounded-full border-4 border-yellow-400 shadow-xl flex flex-col items-center justify-center w-32 h-32 text-slate-800">
                <span className="text-xs font-bold text-slate-500">TEMPO RESTANTE:</span>
                <span className="text-3xl font-black">{timeRemaining}</span>
                <span className="text-xs font-semibold uppercase">{currentPhase}</span>
            </div>
        </div>
    );
}