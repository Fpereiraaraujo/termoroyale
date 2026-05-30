import { loadStats } from "../utils/playerStats";
import { useI18n } from "../i18n";

export function PlayerStatsBadge() {
    const { t } = useI18n();
    const s = loadStats();
    if (s.games === 0) return null;
    const winRate = Math.round((s.wins / s.games) * 100);

    return (
        <div className="mt-6 bg-slate-900/80 backdrop-blur-md rounded-2xl border-2 border-slate-700 px-4 py-3 flex items-center gap-4 text-white shadow-xl">
            <Stat label={t("stats.games")} value={s.games} />
            <Divider />
            <Stat label={t("stats.wins")} value={s.wins} color="text-green-400" />
            <Divider />
            <Stat label={t("stats.winrate")} value={`${winRate}%`} color="text-yellow-400" />
            <Divider />
            <Stat label={t("stats.streak")} value={s.currentStreak} color="text-sky-400" />
            {s.bestStreak > 0 && <>
                <Divider />
                <Stat label={t("stats.best")} value={s.bestStreak} color="text-amber-400" />
            </>}
        </div>
    );
}

function Stat({ label, value, color = "" }: { label: string; value: string | number; color?: string }) {
    return (
        <div className="flex flex-col items-center">
            <span className={`text-lg font-black leading-none ${color}`}>{value}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">{label}</span>
        </div>
    );
}

function Divider() {
    return <span className="w-px h-8 bg-slate-700" />;
}
