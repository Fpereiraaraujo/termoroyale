import type { PhaseInfo } from "./useVictoryData";
import { useI18n } from "../../i18n";

export function PhaseReplay({ phases }: { phases: PhaseInfo[] }) {
    const { t } = useI18n();
    if (phases.length === 0) return null;
    return (
        <div className="mt-4 w-full max-w-lg">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center mb-2">
                {t("victory.matchWords")}
            </h3>
            <div className="flex flex-col gap-1.5">
                {phases.map(phase => (
                    <div key={phase.round} className="bg-slate-800 border-2 border-slate-700 rounded-xl p-2">
                        <div className="flex items-center gap-2">
                            <span className="bg-slate-950 text-yellow-400 font-black px-2 py-0.5 rounded-md text-[10px] tracking-widest">
                                R{phase.round}
                            </span>
                            <div className="flex flex-wrap gap-1">
                                {phase.words.map((w, i) => (
                                    <span
                                        key={i}
                                        className="bg-green-500 text-white font-mono font-black px-2 py-0.5 rounded-md text-xs tracking-widest border border-green-600"
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
