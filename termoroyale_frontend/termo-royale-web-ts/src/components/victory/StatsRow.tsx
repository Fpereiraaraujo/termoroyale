import type { WinnerStats } from "./useVictoryData";

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 flex flex-col items-center text-center">
            <span className="text-2xl">{icon}</span>
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 mt-1">{label}</span>
            <span className="text-xl font-black text-slate-800">{value}</span>
        </div>
    );
}

export function StatsRow({ stats }: { stats: WinnerStats }) {
    return (
        <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-lg">
            <StatCard icon="🎯" label="Fases" value={`${stats.roundsWon}/3`} />
            <StatCard icon="⏱️" label="Tempo Total" value={`${stats.totalTime}s`} />
            <StatCard icon="🔤" label="Tentativas" value={`${stats.attempts}`} />
        </div>
    );
}
