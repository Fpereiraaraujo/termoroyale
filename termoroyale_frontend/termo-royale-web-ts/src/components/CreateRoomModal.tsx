import { useState } from "react";
import { useI18n } from "../i18n";

export type RoomTheme = "GERAL" | "ANIMAIS" | "COMIDA" | "VERBOS";
export type GameMode = "ROYALE" | "BLITZ";

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (roomName: string, maxPlayers: number, isPrivate: boolean, theme: RoomTheme, gameMode: GameMode) => void;
}

const THEMES: { key: RoomTheme; emoji: string; labelKey: "theme.general" | "theme.animals" | "theme.food" | "theme.verbs" }[] = [
    { key: "GERAL",   emoji: "🎯", labelKey: "theme.general" },
    { key: "ANIMAIS", emoji: "🐾", labelKey: "theme.animals" },
    { key: "COMIDA",  emoji: "🍴", labelKey: "theme.food" },
    { key: "VERBOS",  emoji: "✏️", labelKey: "theme.verbs" },
];

export function CreateRoomModal({ isOpen, onClose, onCreate }: CreateRoomModalProps) {
    const [roomName, setRoomName] = useState("");
    const [maxPlayers, setMaxPlayers] = useState(20);
    const [isPrivate, setIsPrivate] = useState(false);
    const [theme, setTheme] = useState<RoomTheme>("GERAL");
    const [gameMode, setGameMode] = useState<GameMode>("ROYALE");
    const { t } = useI18n();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">

                <div className="bg-slate-800 p-5 sm:p-6 text-center relative shrink-0">
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-widest">{t("create.title")}</h3>
                    <button
                        onClick={onClose}
                        className="absolute top-5 sm:top-6 right-5 sm:right-6 text-slate-400 hover:text-white font-black transition-colors p-1"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 sm:p-8 flex flex-col gap-5 sm:gap-6 overflow-y-auto">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t("create.name")}</label>
                        <input
                            type="text"
                            autoFocus
                            value={roomName}
                            placeholder={t("create.namePlaceholder")}
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm sm:text-base placeholder:font-normal placeholder:text-slate-400"
                            onChange={(e) => setRoomName(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t("create.players")}</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="2"
                                max="30"
                                value={maxPlayers}
                                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                                className="flex-1 accent-emerald-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-black px-3 sm:px-4 py-2 rounded-lg w-14 sm:w-16 text-center text-sm sm:text-base">
                                {maxPlayers}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t("create.visibility")}</label>
                        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                            <button
                                onClick={() => setIsPrivate(false)}
                                className={`flex-1 py-2.5 sm:py-3 rounded-lg font-black text-xs sm:text-sm uppercase tracking-wider transition-all ${!isPrivate ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {t("create.public")}
                            </button>
                            <button
                                onClick={() => setIsPrivate(true)}
                                className={`flex-1 py-2.5 sm:py-3 rounded-lg font-black text-xs sm:text-sm uppercase tracking-wider transition-all ${isPrivate ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {t("create.private")}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t("create.mode")}</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setGameMode("ROYALE")}
                                className={`py-3 rounded-lg font-black text-xs uppercase tracking-wider transition-all border-2 flex flex-col items-center ${gameMode === "ROYALE" ? "bg-slate-900 text-amber-400 border-slate-900 shadow-md" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-white"}`}
                            >
                                <span className="text-lg leading-none mb-1">👑</span>
                                <span>{t("mode.royale")}</span>
                                <span className="text-[9px] font-bold opacity-70 normal-case tracking-normal mt-0.5">{t("mode.royaleHint")}</span>
                            </button>
                            <button
                                onClick={() => setGameMode("BLITZ")}
                                className={`py-3 rounded-lg font-black text-xs uppercase tracking-wider transition-all border-2 flex flex-col items-center ${gameMode === "BLITZ" ? "bg-rose-600 text-white border-rose-700 shadow-md" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-white"}`}
                            >
                                <span className="text-lg leading-none mb-1">⚡</span>
                                <span>{t("mode.blitz")}</span>
                                <span className="text-[9px] font-bold opacity-70 normal-case tracking-normal mt-0.5">{t("mode.blitzHint")}</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t("create.theme")}</label>
                        <div className="grid grid-cols-2 gap-2">
                            {THEMES.map(th => (
                                <button
                                    key={th.key}
                                    onClick={() => setTheme(th.key)}
                                    className={`py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all border-2 ${theme === th.key ? "bg-slate-900 text-amber-400 border-slate-900 shadow-md" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-white"}`}
                                >
                                    <span className="mr-1">{th.emoji}</span>{t(th.labelKey)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            const finalName = roomName.trim() || `${t("create.defaultName")} #${Math.floor(Math.random() * 1000)}`;
                            onCreate(finalName, maxPlayers, isPrivate, theme, gameMode);
                            onClose();
                        }}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black px-6 py-3.5 sm:py-4 rounded-xl uppercase tracking-widest transition-all hover:shadow-lg active:scale-95 text-sm sm:text-base mt-2 shrink-0 shadow-md"
                    >
                        {t("create.confirm")}
                    </button>
                </div>
            </div>
        </div>
    );
}