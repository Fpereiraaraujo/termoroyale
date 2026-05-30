import { useState } from "react";
import { useI18n } from "../../i18n";

interface ActionButtonsProps {
    shareText: string;
    onRematch: () => void;
    onBackToLobby: () => void;
}

export function ActionButtons({ shareText, onRematch, onBackToLobby }: ActionButtonsProps) {
    const { t } = useI18n();
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
        <div className="mt-5 flex flex-col sm:flex-row gap-2 w-full max-w-md">
            <button
                onClick={handleShare}
                className="flex-1 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 text-slate-100 font-black uppercase tracking-widest py-2.5 text-sm rounded-xl transition-all active:scale-95"
            >
                {copied ? t("victory.copied") : t("victory.share")}
            </button>
            <button
                onClick={onRematch}
                className="flex-1 bg-yellow-400 hover:bg-yellow-300 border-2 border-yellow-500 text-slate-900 font-black uppercase tracking-widest py-2.5 text-sm rounded-xl shadow-lg transition-all active:scale-95"
            >
                {t("victory.rematch")}
            </button>
            <button
                onClick={onBackToLobby}
                className="flex-1 bg-green-600 hover:bg-green-500 border-2 border-green-700 text-white font-black uppercase tracking-widest py-2.5 text-sm rounded-xl shadow-lg transition-all active:scale-95"
            >
                {t("victory.lobby")}
            </button>
        </div>
    );
}
