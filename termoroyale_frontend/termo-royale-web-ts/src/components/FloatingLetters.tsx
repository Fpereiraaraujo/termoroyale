import { useMemo } from "react";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function FloatingLetters({ count = 12 }: { count?: number }) {
    const items = useMemo(() => {
        return Array.from({ length: count }).map((_, i) => ({
            letter: LETTERS[Math.floor(Math.random() * LETTERS.length)],
            left: Math.random() * 100,
            size: 40 + Math.random() * 80,
            duration: 18 + Math.random() * 22,
            delay: -Math.random() * 30,
            opacity: 0.06 + Math.random() * 0.08,
            sway: -20 + Math.random() * 40,
            key: i,
        }));
    }, [count]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {items.map(it => (
                <span
                    key={it.key}
                    className="absolute font-black text-slate-900 animate-letter-fall"
                    style={{
                        left: `${it.left}%`,
                        fontSize: `${it.size}px`,
                        opacity: it.opacity,
                        animationDuration: `${it.duration}s`,
                        animationDelay: `${it.delay}s`,
                        // @ts-expect-error CSS var for keyframes
                        "--sway": `${it.sway}px`,
                    }}
                >
                    {it.letter}
                </span>
            ))}
            <style>{`
                @keyframes letterFall {
                    0%   { transform: translateY(-15vh) translateX(0) rotate(0deg); }
                    100% { transform: translateY(115vh) translateX(var(--sway)) rotate(180deg); }
                }
                .animate-letter-fall {
                    animation-name: letterFall;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
            `}</style>
        </div>
    );
}
