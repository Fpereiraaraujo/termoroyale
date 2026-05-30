import { useState } from "react";

interface ActionButtonsProps {
    shareText: string;
    onRematch: () => void;
    onBackToLobby: () => void;
}

export function ActionButtons({ shareText, onRematch, onBackToLobby }: ActionButtonsProps) {
    const [copied, setCopied] = useState(false);
    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(shareText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* ignore */
        }
    };

    return (
        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-md">
            <button
                onClick={handleShare}
                className="flex-1 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-700 font-black uppercase tracking-widest py-3 rounded-2xl transition-all active:scale-95"
            >
                {copied ? "✓ Copiado!" : "Compartilhar"}
            </button>
            <button
                onClick={onRematch}
                className="flex-1 bg-yellow-400 hover:bg-yellow-300 border-2 border-yellow-500 text-slate-900 font-black uppercase tracking-widest py-3 rounded-2xl shadow-lg transition-all active:scale-95"
            >
                ⚔ Revanche
            </button>
            <button
                onClick={onBackToLobby}
                className="flex-1 bg-green-600 hover:bg-green-500 border-2 border-green-700 text-white font-black uppercase tracking-widest py-3 rounded-2xl shadow-lg transition-all active:scale-95"
            >
                Lobby
            </button>
        </div>
    );
}
