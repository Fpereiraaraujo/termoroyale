import { useEffect, useState } from "react";

export interface FloatingReaction {
    id: number;
    emoji: string;
    playerName: string;
    x: number; // 0–100 (%)
}

interface ReactionLayerProps {
    reactions: FloatingReaction[];
    onExpire: (id: number) => void;
}

export function ReactionLayer({ reactions, onExpire }: ReactionLayerProps) {
    useEffect(() => {
        if (reactions.length === 0) return;
        const timers = reactions.map(r => setTimeout(() => onExpire(r.id), 2500));
        return () => timers.forEach(clearTimeout);
    }, [reactions, onExpire]);

    return (
        <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
            {reactions.map(r => (
                <div
                    key={r.id}
                    className="absolute bottom-0 text-5xl animate-float-up flex flex-col items-center"
                    style={{ left: `${r.x}%` }}
                >
                    <span className="drop-shadow-lg">{r.emoji}</span>
                    <span className="text-[10px] font-black text-white bg-slate-900/80 px-2 py-0.5 rounded-full uppercase tracking-widest mt-1">
                        {r.playerName}
                    </span>
                </div>
            ))}
            <style>{`
                @keyframes floatUp {
                    0%   { transform: translateY(0) scale(0.5); opacity: 0; }
                    20%  { transform: translateY(-100px) scale(1.2); opacity: 1; }
                    100% { transform: translateY(-80vh) scale(1); opacity: 0; }
                }
                .animate-float-up { animation: floatUp 2.5s ease-out forwards; }
            `}</style>
        </div>
    );
}

interface ReactionBarProps {
    onReact: (emoji: string) => void;
}

const EMOJIS = ["👏", "🔥", "😱", "🐐", "💪", "😂"];

export function ReactionBar({ onReact }: ReactionBarProps) {
    const [cooldown, setCooldown] = useState(false);
    const handle = (emoji: string) => {
        if (cooldown) return;
        onReact(emoji);
        setCooldown(true);
        setTimeout(() => setCooldown(false), 600);
    };

    return (
        <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2 py-1.5 rounded-full border-2 border-slate-700 shadow-xl">
            {EMOJIS.map(e => (
                <button
                    key={e}
                    onClick={() => handle(e)}
                    disabled={cooldown}
                    className={`text-xl w-9 h-9 rounded-full hover:bg-slate-800 active:scale-90 transition-all ${cooldown ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                    {e}
                </button>
            ))}
        </div>
    );
}
