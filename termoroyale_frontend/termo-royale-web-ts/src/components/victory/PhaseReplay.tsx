import type { PhaseInfo } from "./useVictoryData";

export function PhaseReplay({ phases }: { phases: PhaseInfo[] }) {
    if (phases.length === 0) return null;
    return (
        <div className="mt-6 w-full max-w-lg">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 text-center mb-3">
                Palavras da Partida
            </h3>
            <div className="flex flex-col gap-2">
                {phases.map(phase => (
                    <div key={phase.round} className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-3">
                        <div className="flex items-center gap-3">
                            <span className="bg-slate-900 text-yellow-400 font-black px-2 py-0.5 rounded-md text-[10px] tracking-widest">
                                R{phase.round}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {phase.words.map((w, i) => (
                                    <span
                                        key={i}
                                        className="bg-green-500 text-white font-mono font-black px-2 py-1 rounded-md text-sm tracking-widest border border-green-600"
                                    >
                                        {w}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
