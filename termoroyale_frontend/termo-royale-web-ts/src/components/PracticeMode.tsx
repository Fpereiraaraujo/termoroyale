import { useCallback, useEffect, useState } from "react";
import { SoloBoard } from "./SoloBoard";
import { useI18n } from "../i18n";

const API = "http://localhost:8080";

interface PracticeModeProps {
    onBackHome: () => void;
}

export function PracticeMode({ onBackHome }: PracticeModeProps) {
    const { t } = useI18n();
    const [target, setTarget] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [seed, setSeed] = useState(0); // troca a key do SoloBoard pra resetar estado interno

    const loadNew = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/word/random`);
            const data = await res.json();
            setTarget(data.word);
            setSeed(s => s + 1);
        } catch {
            setTarget("PLANO"); // fallback
            setSeed(s => s + 1);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadNew(); }, [loadNew]);

    return (
        <div className="h-screen w-screen flex flex-col bg-sky-200 bg-cover bg-center overflow-y-auto"
             style={{ backgroundImage: "url('/bg-stadium.jpg')" }}>

            <div className="w-full p-3 flex items-center justify-between">
                <button
                    onClick={onBackHome}
                    className="bg-slate-900/85 hover:bg-slate-800 text-white font-black px-4 py-2 rounded-xl uppercase text-xs tracking-widest border-2 border-slate-700"
                >
                    ← {t("solo.backHome")}
                </button>
                <span className="bg-white text-slate-700 font-black px-4 py-2 rounded-xl uppercase text-xs tracking-widest border-2 border-slate-300 shadow">
                    {t("solo.practiceBadge")}
                </span>
            </div>

            <div className="flex-1 flex items-start justify-center py-2">
                {loading || !target ? (
                    <div className="text-slate-900 font-black text-xl animate-pulse">…</div>
                ) : (
                    <SoloBoard
                        key={seed}
                        target={target}
                        title={t("solo.practiceTitle")}
                        footer={
                            <button
                                onClick={loadNew}
                                className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-6 py-3 rounded-xl uppercase tracking-widest shadow-md border-2 border-emerald-600 active:scale-95"
                            >
                                {t("solo.newWord")}
                            </button>
                        }
                    />
                )}
            </div>
        </div>
    );
}
