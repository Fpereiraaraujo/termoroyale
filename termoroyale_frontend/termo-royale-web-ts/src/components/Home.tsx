import { useState } from "react";
import { useI18n, LanguageSwitcher } from "../i18n";

interface HomeProps {
    onJoin: (playerName: string) => void;
    onPractice: () => void;
    onDaily: () => void;
}

export function Home({ onJoin, onPractice, onDaily }: HomeProps) {
    const [name, setName] = useState("");
    const { t } = useI18n();

    const handleEnter = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (trimmed.length > 2) {
            try { localStorage.setItem("termoroyale.playerName", trimmed); } catch { /* ignore */ }
            onJoin(trimmed);
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-sky-200 bg-cover bg-center"
             style={{ backgroundImage: "url('/bg-stadium.jpg')" }}>

            <div className="absolute top-4 right-4">
                <LanguageSwitcher />
            </div>

            {/* O Logo Idêntico ao do Jogo */}
            <div className="bg-slate-900 px-8 py-4 rounded-xl border-4 border-slate-800 shadow-2xl mb-8 transform -rotate-2">
                <h1 className="text-5xl font-black text-white tracking-widest leading-none">TERMO</h1>
                <h1 className="text-5xl font-black text-amber-400 tracking-widest leading-none">ROYALE</h1>
            </div>

            {/* Painel Central no estilo do Board */}
            <div className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-slate-200 w-full max-w-md flex flex-col gap-6">
                <div className="text-center">
                    <h2 className="text-2xl font-black text-slate-700 uppercase tracking-widest">{t("home.title")}</h2>
                    <p className="text-slate-500 font-medium mt-1">{t("home.subtitle")}</p>
                </div>

                <form onSubmit={handleEnter} className="flex flex-col gap-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("home.placeholder")}
                        maxLength={15}
                        className="w-full text-center text-2xl font-bold text-slate-700 bg-white border-2 border-slate-300 rounded-xl p-4 focus:outline-none focus:border-emerald-500 transition-colors uppercase placeholder:text-slate-300 placeholder:normal-case"
                    />

                    <button
                        type="submit"
                        disabled={name.trim().length < 3}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-300 disabled:text-slate-500 text-white font-black text-xl py-4 rounded-xl shadow-md transition-all uppercase tracking-widest active:scale-95"
                    >
                        {t("home.enter")}
                    </button>
                </form>

                <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 h-px bg-slate-300" />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t("home.or")}</span>
                    <div className="flex-1 h-px bg-slate-300" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onPractice}
                        className="bg-white hover:bg-slate-50 text-slate-700 font-black py-3 rounded-xl shadow-md transition-all uppercase tracking-widest text-sm active:scale-95 border-2 border-slate-300 hover:border-slate-400"
                    >
                        {t("home.practice")}
                    </button>
                    <button
                        type="button"
                        onClick={onDaily}
                        className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-black py-3 rounded-xl shadow-md transition-all uppercase tracking-widest text-sm active:scale-95 border-2 border-slate-800"
                    >
                        {t("home.daily")}
                    </button>
                </div>
            </div>
        </div>
    );
}