import { useCallback, useEffect, useMemo, useState } from "react";
import { SoloBoard } from "./SoloBoard";
import { useI18n } from "../i18n";

const API = "http://localhost:8080";
const NAME_KEY = "termoroyale.playerName";

interface DailyChallengeProps { onBackHome: () => void; }
interface DailyData { date: string; word: string; }
interface LbEntry { playerName: string; attempts: number; timeSeconds: number; timestamp: number; }
interface Leaderboard { date: string; firstSolver: LbEntry | null; top: LbEntry[]; yourEntry?: LbEntry; }

function fmtTime(s: number): string {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}m${r.toString().padStart(2, "0")}s`;
}

export function DailyChallenge({ onBackHome }: DailyChallengeProps) {
    const { t } = useI18n();
    const [daily, setDaily] = useState<DailyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [name, setName] = useState<string>(() => {
        try { return localStorage.getItem(NAME_KEY) ?? ""; } catch { return ""; }
    });

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API}/api/word/daily`);
                if (!res.ok) throw new Error("HTTP " + res.status);
                const data: DailyData = await res.json();
                setDaily(data);
            } catch (e) { setErr(String(e)); }
            finally { setLoading(false); }
        })();
    }, []);

    useEffect(() => {
        if (!daily) return;
        try {
            const startKey = `termoroyale.daily.start.${daily.date}`;
            if (!localStorage.getItem(startKey)) {
                localStorage.setItem(startKey, String(Date.now()));
            }
        } catch { /* ignore */ }
    }, [daily]);

    const refreshLeaderboard = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/daily/leaderboard`);
            if (!res.ok) return;
            const data: Leaderboard = await res.json();
            setLeaderboard(data);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { refreshLeaderboard(); }, [refreshLeaderboard]);

    const storageKey = daily ? `termoroyale.daily.${daily.date}` : undefined;
    const submittedKey = daily ? `termoroyale.daily.submitted.${daily.date}` : undefined;

    const handleFinish = useCallback(async (won: boolean, attempts: number) => {
        if (!won || !daily) return;
        const trimmed = name.trim();
        if (trimmed.length < 2) return;
        if (submittedKey && localStorage.getItem(submittedKey)) return;

        const startKey = `termoroyale.daily.start.${daily.date}`;
        let startMs = Number(localStorage.getItem(startKey) || "0");
        if (!startMs) startMs = Date.now();
        const timeSeconds = Math.max(1, Math.round((Date.now() - startMs) / 1000));

        try {
            setSubmitting(true);
            const res = await fetch(`${API}/api/daily/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playerName: trimmed, attempts, timeSeconds }),
            });
            if (res.ok) {
                const data: Leaderboard = await res.json();
                setLeaderboard(data);
                if (submittedKey) localStorage.setItem(submittedKey, "1");
            }
        } catch { /* ignore */ }
        finally { setSubmitting(false); }
    }, [daily, name, submittedKey]);

    const saveName = (raw: string) => {
        const v = raw.slice(0, 15);
        setName(v);
        try { localStorage.setItem(NAME_KEY, v.trim()); } catch { /* ignore */ }
    };

    const nameMissing = name.trim().length < 2;
    const myKey = name.trim().toLowerCase();
    const myEntry = useMemo(() => {
        if (!leaderboard || !myKey) return null;
        return leaderboard.top.find(e => e.playerName.toLowerCase() === myKey) ?? null;
    }, [leaderboard, myKey]);

    return (
        <div className="min-h-screen w-screen flex flex-col bg-sky-200 bg-cover bg-center overflow-y-auto"
             style={{ backgroundImage: "url('/bg-stadium.jpg')" }}>

            <div className="w-full p-3 flex items-center justify-between">
                <button
                    onClick={onBackHome}
                    className="bg-slate-900/85 hover:bg-slate-800 text-white font-black px-4 py-2 rounded-xl uppercase text-xs tracking-widest border-2 border-slate-700"
                >
                    ← {t("solo.backHome")}
                </button>
                <span className="bg-slate-900 text-amber-400 font-black px-4 py-2 rounded-xl uppercase text-xs tracking-widest border-2 border-slate-800 shadow">
                    {t("solo.dailyBadge")} {daily?.date ? `· ${daily.date}` : ""}
                </span>
            </div>

            <div className="flex-1 flex flex-col items-center gap-4 py-2 px-3">
                {loading ? (
                    <div className="text-slate-900 font-black text-xl animate-pulse">…</div>
                ) : err || !daily ? (
                    <div className="bg-rose-50 text-rose-700 border-2 border-rose-200 px-6 py-4 rounded-2xl font-bold">
                        {t("solo.dailyError")}
                    </div>
                ) : (
                    <>
                        <SoloBoard
                            target={daily.word}
                            title={t("solo.dailyTitle")}
                            storageKey={storageKey}
                            onFinish={handleFinish}
                        />

                        {nameMissing && (
                            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 max-w-md w-full text-center">
                                <p className="text-slate-700 font-bold text-sm mb-2">
                                    {t("daily.nameNeeded")}
                                </p>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => saveName(e.target.value)}
                                    placeholder={t("home.placeholder")}
                                    maxLength={15}
                                    className="w-full text-center text-lg font-bold text-slate-700 bg-white border-2 border-slate-300 rounded-xl p-2 uppercase placeholder:text-slate-300 placeholder:normal-case focus:outline-none focus:border-amber-500"
                                />
                            </div>
                        )}

                        <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-2xl p-4 max-w-md w-full shadow-lg">
                            <h3 className="text-slate-800 font-black uppercase tracking-widest text-sm text-center mb-3">
                                🏆 {t("daily.todayRanking")}
                            </h3>

                            {leaderboard?.firstSolver ? (
                                <div className="bg-amber-400 text-slate-900 rounded-xl px-3 py-2 mb-3 text-center font-black text-sm shadow-inner border border-amber-500">
                                    {t("daily.firstSolver")}:{" "}
                                    <span className="uppercase tracking-wider">{leaderboard.firstSolver.playerName}</span>
                                    {" "}({leaderboard.firstSolver.attempts}/6 · {fmtTime(leaderboard.firstSolver.timeSeconds)})
                                </div>
                            ) : (
                                <div className="text-slate-500 italic text-center text-sm mb-3">
                                    {t("daily.noneYet")}
                                </div>
                            )}

                            {leaderboard?.top && leaderboard.top.length > 0 && (
                                <div className="flex flex-col gap-1.5">
                                    {leaderboard.top.map((e, i) => {
                                        const isMe = !!myKey && e.playerName.toLowerCase() === myKey;
                                        return (
                                            <div
                                                key={`${e.playerName}-${i}`}
                                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold border ${
                                                    isMe
                                                        ? "bg-amber-50 border-amber-300 text-slate-800"
                                                        : "bg-slate-50 border-slate-200 text-slate-700"
                                                }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="font-black w-6 text-slate-400 text-xs">#{i + 1}</span>
                                                    <span className="uppercase tracking-wide">{e.playerName}</span>
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {e.attempts}/6 · {fmtTime(e.timeSeconds)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {submitting && (
                                <div className="text-center text-xs text-slate-500 font-bold mt-2 animate-pulse">
                                    {t("daily.submitting")}
                                </div>
                            )}
                            {myEntry && !submitting && (
                                <div className="text-center text-xs text-emerald-700 font-bold mt-2">
                                    ✓ {t("daily.submitted")}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
