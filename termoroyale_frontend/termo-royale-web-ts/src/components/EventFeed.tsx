import { useEffect, useRef, useState } from "react";
import type { Player } from "../types/game";
import { avatarFor } from "../utils/avatar";

interface GameEvent {
    id: number;
    icon: string;
    text: string;
    color: string;
    avatarName: string;
}

interface EventFeedProps {
    players: Player[];
    currentRound: number;
}

let nextId = 1;

export function EventFeed({ players, currentRound }: EventFeedProps) {
    const [events, setEvents] = useState<GameEvent[]>([]);
    const prevRef = useRef<Map<string, { won: boolean; alive: boolean; attempts: number }>>(new Map());

    useEffect(() => {
        const newEvents: GameEvent[] = [];
        players.forEach(p => {
            const prev = prevRef.current.get(p.id);
            const curr = { won: p.won, alive: p.isAlive, attempts: p.currentAttempts };
            if (!prev) {
                prevRef.current.set(p.id, curr);
                return;
            }

            if (!prev.won && p.won) {
                const t = p.solvedTimes?.[currentRound];
                newEvents.push({
                    id: nextId++,
                    icon: "🏆",
                    color: "border-green-400 bg-green-50",
                    text: `${p.name} resolveu${t !== undefined ? ` em ${t}s` : ""}`,
                    avatarName: p.name,
                });
            }
            if (prev.alive && !p.isAlive && !p.won) {
                newEvents.push({
                    id: nextId++,
                    icon: "💀",
                    color: "border-red-400 bg-red-50",
                    text: `${p.name} foi eliminado`,
                    avatarName: p.name,
                });
            }
            prevRef.current.set(p.id, curr);
        });

        if (newEvents.length > 0) {
            setEvents(prev => [...newEvents, ...prev].slice(0, 6));
        }
    }, [players, currentRound]);

    // Auto-expire eventos após 8s
    useEffect(() => {
        if (events.length === 0) return;
        const oldest = events[events.length - 1];
        const timer = setTimeout(() => {
            setEvents(prev => prev.filter(e => e.id !== oldest.id));
        }, 8000);
        return () => clearTimeout(timer);
    }, [events]);

    if (events.length === 0) return null;

    return (
        <div className="fixed bottom-4 left-4 z-40 flex flex-col gap-2 pointer-events-none max-w-xs">
            {events.map(ev => {
                const av = avatarFor(ev.avatarName);
                return (
                    <div
                        key={ev.id}
                        className={`flex items-center gap-2 bg-white px-3 py-2 rounded-xl border-2 ${ev.color} shadow-lg animate-event-in`}
                    >
                        <div className={`w-8 h-8 rounded-full ${av.bg} flex items-center justify-center text-white font-black text-xs shrink-0`}>
                            {av.initials}
                        </div>
                        <div className="flex items-center gap-1 min-w-0">
                            <span className="text-lg shrink-0">{ev.icon}</span>
                            <span className="text-xs font-bold text-slate-700 truncate">{ev.text}</span>
                        </div>
                    </div>
                );
            })}
            <style>{`
                @keyframes eventIn {
                    0% { transform: translateX(-100%); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
                .animate-event-in { animation: eventIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
            `}</style>
        </div>
    );
}
