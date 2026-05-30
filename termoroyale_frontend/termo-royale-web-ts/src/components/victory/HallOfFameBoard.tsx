import type { HallEntry } from "./hallOfFameStorage";

export function HallOfFameBoard({ entries }: { entries: HallEntry[] }) {
    if (entries.length === 0) return null;
    return (
        <div className="mt-8 w-full max-w-lg">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 text-center mb-3">
                Hall of Fame — Últimos 5 GOATs
            </h3>
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 flex flex-col gap-1.5">
                {entries.map((entry, i) => (
                    <div
                        key={`${entry.roomId}-${entry.date}-${i}`}
                        className="flex items-center justify-between text-sm"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-yellow-500 font-black w-6 text-center">#{i + 1}</span>
                            <span className="text-2xl">{i === 0 ? "👑" : "🐐"}</span>
                            <span className="font-black uppercase tracking-wide text-slate-800 truncate">{entry.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 shrink-0 ml-3">
                            <span>{entry.totalTime}s</span>
                            <span>·</span>
                            <span>{new Date(entry.date).toLocaleDateString("pt-BR")}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
