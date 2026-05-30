import type { HallEntry } from "./hallOfFameStorage";
import { useI18n } from "../../i18n";

export function HallOfFameBoard({ entries }: { entries: HallEntry[] }) {
    const { t, lang } = useI18n();
    if (entries.length === 0) return null;
    const locale = lang === "pt" ? "pt-BR" : "en-US";
    return (
        <div className="mt-4 w-full max-w-lg">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center mb-2">
                {t("victory.hallOfFame")}
            </h3>
            <div className="bg-slate-800 border-2 border-slate-700 rounded-xl p-2 flex flex-col gap-1">
                {entries.map((entry, i) => (
                    <div
                        key={`${entry.roomId}-${entry.date}-${i}`}
                        className="flex items-center justify-between text-xs"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-yellow-400 font-black w-5 text-center">#{i + 1}</span>
                            <span className="text-lg">{i === 0 ? "👑" : "🐐"}</span>
                            <span className="font-black uppercase tracking-wide text-slate-100 truncate">{entry.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0 ml-3">
                            <span>{entry.totalTime}s</span>
                            <span>·</span>
                            <span>{new Date(entry.date).toLocaleDateString(locale)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
