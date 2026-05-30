import { useMemo } from "react";

const COLORS = ["#facc15", "#22c55e", "#38bdf8", "#f97316", "#ec4899", "#a855f7"];

export function Confetti({ count = 70 }: { count?: number }) {
    const pieces = useMemo(() => {
        return Array.from({ length: count }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 3,
            duration: 3 + Math.random() * 3,
            color: COLORS[i % COLORS.length],
            size: 6 + Math.random() * 8,
            rotate: Math.random() * 360,
        }));
    }, [count]);

    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {pieces.map(p => (
                <span
                    key={p.id}
                    className="absolute top-0 block animate-confetti"
                    style={{
                        left: `${p.left}%`,
                        width: `${p.size}px`,
                        height: `${p.size * 1.6}px`,
                        backgroundColor: p.color,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                        transform: `rotate(${p.rotate}deg)`,
                        borderRadius: "2px",
                    }}
                />
            ))}
        </div>
    );
}
