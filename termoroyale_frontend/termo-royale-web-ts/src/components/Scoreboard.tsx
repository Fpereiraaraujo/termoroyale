import { useEffect, useRef, useState } from "react";
import { sound } from "../utils/sound";
import { RulesModal } from "./RulesModal";
import { useI18n } from "../i18n";

interface ScoreboardProps {
    lives: number;
    maxLives: number;
    timeRemaining: string;
    secondsLeft: number;
    currentRound: number;
    status: string;
}

export function Scoreboard({
                               lives,
                               maxLives,
                               timeRemaining,
                               secondsLeft,
                               currentRound,
                               status,
                           }: ScoreboardProps) {
    const isFinished = status === "FINISHED";
    const rounds = [1, 2, 3];
    const [muted, setMuted] = useState(sound.isMuted());
    const [rulesOpen, setRulesOpen] = useState(false);
    const lastTickRef = useRef(0);
    const { t } = useI18n();

    useEffect(() => {
        if (isFinished || status !== "PLAYING") return;
        if (secondsLeft > 0 && secondsLeft <= 10 && secondsLeft !== lastTickRef.current) {
            lastTickRef.current = secondsLeft;
            sound.tick();
        }
    }, [secondsLeft, isFinished, status]);

    return (
        <>
        <div className="w-full bg-slate-950 border-b border-amber-400/40 shadow-xl text-white px-4 py-2 grid grid-cols-3 items-center gap-4">
            {/* Logo + vidas */}
            <div className="flex items-center gap-3 justify-self-start">
                <div className="bg-slate-900 px-3 py-1 rounded-md border border-slate-700 shadow-inner">
                    <span className="font-black text-base text-white tracking-widest">TERMO </span>
                    <span className="font-black text-base text-amber-400 tracking-widest">ROYALE</span>
                </div>
                <div className="flex items-center gap-1">
                    {Array.from({ length: maxLives }).map((_, i) => (
                        <span
                            key={i}
                            className={`text-base ${i < lives ? "text-rose-500" : "text-slate-700"}`}
                        >
                            ❤
                        </span>
                    ))}
                </div>
            </div>

            {/* Indicador de fase R1/R2/R3 (centro) */}
            <div className="flex items-center gap-2 justify-self-center">
                {rounds.map(r => {
                    const isPast = r < currentRound;
                    const isCurrent = r === currentRound && !isFinished;
                    return (
                        <div key={r} className="flex items-center gap-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border transition-all ${
                                isCurrent
                                    ? "bg-amber-400 text-slate-900 border-amber-300 animate-pulse shadow-md shadow-amber-400/30"
                                    : isPast
                                        ? "bg-emerald-500 text-white border-emerald-400"
                                        : "bg-slate-800 text-slate-500 border-slate-700"
                            }`}>
                                {isPast ? "✓" : `R${r}`}
                            </div>
                            {r < 3 && (
                                <div className={`w-4 h-0.5 ${
                                    r < currentRound ? "bg-emerald-500" : "bg-slate-700"
                                }`} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Cronômetro estilo LED (direita) */}
            <div className="flex items-center gap-2 justify-self-end">
                <button
                    onClick={() => setRulesOpen(true)}
                    className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-black text-base shadow-inner"
                    title={t("scoreboard.howToPlay")}
                >?</button>
                <button
                    onClick={() => setMuted(sound.toggleMute())}
                    className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-base shadow-inner"
                    title={muted ? t("scoreboard.soundOff") : t("scoreboard.soundOn")}
                >{muted ? "🔇" : "🔊"}</button>
                <div className="flex flex-col items-center bg-slate-900 px-4 py-1 rounded-lg border border-amber-400/60 shadow-inner min-w-[110px]">
                    <span className="text-[9px] font-bold text-amber-400/70 tracking-widest uppercase leading-none">
                        {isFinished ? t("scoreboard.ended") : t("scoreboard.time")}
                    </span>
                    <span className="text-3xl font-mono font-black text-amber-400 tracking-wider leading-tight">
                        {timeRemaining}
                    </span>
                </div>
            </div>
        </div>
        <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
        </>
    );
}
