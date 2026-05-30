import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../../i18n";

interface WinnerHeaderProps {
    winnerName: string | undefined;
    euVenci: boolean;
    hasWinner: boolean;
}

const ICONS = ["🎉", "🏆", "👑", "🐐", "✨"];

export function WinnerHeader({ winnerName, euVenci, hasWinner }: WinnerHeaderProps) {
    const { t } = useI18n();
    const icons = useMemo(() => ICONS, []);
    const [floatIcon, setFloatIcon] = useState(0);
    useEffect(() => {
        const i = setInterval(() => setFloatIcon(v => (v + 1) % icons.length), 800);
        return () => clearInterval(i);
    }, [icons.length]);

    return (
        <>
            {/* Logo flutuante */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 px-5 py-2 rounded-xl border-4 border-yellow-400 shadow-xl transform -rotate-2">
                <span className="text-lg font-black text-white tracking-widest">TERMO </span>
                <span className="text-lg font-black text-yellow-400 tracking-widest">ROYALE</span>
            </div>

            {/* Coroa + Cabra */}
            <div className="flex items-end gap-3 mt-2">
                <span className="text-5xl crown-float drop-shadow-lg">👑</span>
                <span className="text-6xl goat-bounce drop-shadow-lg">🐐</span>
                <span className="text-5xl crown-float drop-shadow-lg" style={{ animationDelay: "0.4s" }}>👑</span>
            </div>

            <span className="mt-3 bg-yellow-400 text-slate-900 font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.3em] shadow-inner">
                {t("victory.arenaGoat")} {icons[floatIcon]}
            </span>

            <h1 className="mt-2 text-4xl md:text-5xl font-black uppercase tracking-wider text-yellow-400 gold-pulse text-center wrap-break-word max-w-full">
                {winnerName ?? t("victory.noWinner")}
            </h1>

            {euVenci && (
                <p className="mt-1 text-lg font-black uppercase tracking-widest text-green-400">
                    {t("victory.youAreChampion")}
                </p>
            )}
            {!euVenci && hasWinner && (
                <p className="mt-1 text-sm font-bold uppercase tracking-widest text-slate-400">
                    {t("victory.congrats")}
                </p>
            )}
        </>
    );
}
