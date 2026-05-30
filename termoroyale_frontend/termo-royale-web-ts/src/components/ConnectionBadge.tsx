import { useI18n } from "../i18n";

interface ConnectionBadgeProps {
    connected: boolean;
}

export function ConnectionBadge({ connected }: ConnectionBadgeProps) {
    const { t } = useI18n();
    if (connected) return null;
    return (
        <div className="fixed bottom-4 right-4 z-[90] bg-red-600 text-white px-3 py-2 rounded-xl shadow-2xl border-2 border-red-400 flex items-center gap-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span className="text-xs font-black uppercase tracking-widest">{t("connection.reconnecting")}</span>
        </div>
    );
}
