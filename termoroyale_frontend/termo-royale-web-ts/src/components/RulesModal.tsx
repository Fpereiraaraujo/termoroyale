import { useI18n } from "../i18n";

interface RulesModalProps {
    open: boolean;
    onClose: () => void;
}

export function RulesModal({ open, onClose }: RulesModalProps) {
    const { t } = useI18n();
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-slate-900 border-4 border-yellow-400 rounded-3xl max-w-lg w-full p-6 text-slate-100 shadow-2xl relative"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-lg flex items-center justify-center"
                    aria-label="Fechar"
                >×</button>

                <h2 className="text-2xl font-black tracking-widest uppercase text-yellow-400 mb-1">{t("rules.title")}</h2>
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-4">{t("rules.subtitle")}</p>

                <div className="flex flex-col gap-3 text-sm">
                    <Rule icon="🎯" title={t("rules.goal.title")}>
                        {t("rules.goal.body")}
                    </Rule>
                    <Rule icon="🎨" title={t("rules.colors.title")}>
                        <span className="inline-flex items-center gap-1"><Sq c="bg-green-500"/> {t("rules.colors.green")}
                        <Sq c="bg-yellow-500"/> {t("rules.colors.yellow")}
                        <Sq c="bg-slate-500"/> {t("rules.colors.gray")}</span>
                    </Rule>
                    <Rule icon="🏟️" title={t("rules.phases.title")}>
                        {t("rules.phases.body")}
                    </Rule>
                    <Rule icon="⚡" title={t("rules.sudden.title")}>
                        {t("rules.sudden.body")}
                    </Rule>
                    <Rule icon="❤" title={t("rules.lives.title")}>
                        {t("rules.lives.body")}
                    </Rule>
                    <Rule icon="👏" title={t("rules.reactions.title")}>
                        {t("rules.reactions.body")}
                    </Rule>
                </div>

                <button
                    onClick={onClose}
                    className="mt-5 w-full bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black uppercase tracking-widest py-2.5 rounded-xl transition-all active:scale-95"
                >
                    {t("rules.close")}
                </button>
            </div>
        </div>
    );
}

function Rule({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
    return (
        <div className="flex gap-3 bg-slate-800/60 border border-slate-700 rounded-xl p-3">
            <span className="text-xl shrink-0">{icon}</span>
            <div className="min-w-0">
                <div className="font-black uppercase tracking-widest text-xs text-amber-400 mb-0.5">{title}</div>
                <div className="text-slate-200 leading-snug">{children}</div>
            </div>
        </div>
    );
}

function Sq({ c }: { c: string }) {
    return <span className={`inline-block w-3 h-3 rounded-sm ${c} align-middle mx-0.5`} />;
}
