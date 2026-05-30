import type { WinnerStats } from "./useVictoryData";
import { useI18n } from "../../i18n";

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="bg-slate-800 border-2 border-slate-700 rounded-xl p-2 flex flex-col items-center text-center">
            <span className="text-xl">{icon}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{label}</span>
            <span className="text-base font-black text-white">{value}</span>
        </div>
    );
}

export function StatsRow({ stats }: { stats: WinnerStats }) {
    const { t } = useI18n();
    return (
        <div className="mt-4 grid grid-cols-3 gap-2 w-full max-w-lg">
            <StatCard icon="🎯" label={t("victory.rounds")} value={`${stats.roundsWon}/3`} />
            <StatCard icon="⏱️" label={t("victory.totalTime")} value={`${stats.totalTime}s`} />
            <StatCard icon="🔤" label={t("victory.attempts")} value={`${stats.attempts}`} />
        </div>
    );
}
