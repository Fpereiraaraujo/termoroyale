import { useEffect, useRef, useState } from "react";
import type { Room } from "../types/game";
import { VictoryAnimations } from "./victory/VictoryAnimations";
import { Confetti } from "./victory/Confetti";
import { WinnerHeader } from "./victory/WinnerHeader";
import { StatsRow } from "./victory/StatsRow";
import { PhaseReplay } from "./victory/PhaseReplay";
import { Podium } from "./victory/Podium";
import { HallOfFameBoard } from "./victory/HallOfFameBoard";
import { ActionButtons } from "./victory/ActionButtons";
import { useVictoryData } from "./victory/useVictoryData";
import { playVictorySound } from "./victory/sound";
import { loadHallOfFame, pushHallOfFame, type HallEntry } from "./victory/hallOfFameStorage";

interface VictoryScreenProps {
    room: Room;
    meuNome: string;
    onBackToLobby: () => void;
    onRematch: () => void;
}

export function VictoryScreen({ room, meuNome, onBackToLobby, onRematch }: VictoryScreenProps) {
    const { winner, podium, winnerStats, phasesPlayed } = useVictoryData(room);
    const euVenci = winner?.name.toLowerCase() === meuNome.toLowerCase();

    // Som — uma vez
    const soundPlayedRef = useRef(false);
    useEffect(() => {
        if (soundPlayedRef.current) return;
        soundPlayedRef.current = true;
        playVictorySound();
    }, []);

    // Hall of Fame — grava uma vez ao montar com vencedor
    const [hallOfFame, setHallOfFame] = useState<HallEntry[]>(() => loadHallOfFame());
    const savedRef = useRef(false);
    useEffect(() => {
        if (savedRef.current || !winner || !winnerStats) return;
        savedRef.current = true;
        setHallOfFame(pushHallOfFame({
            name: winner.name,
            date: Date.now(),
            roomId: room.id,
            roomName: room.name,
            totalTime: winnerStats.totalTime,
            attempts: winnerStats.attempts,
        }));
    }, [winner, winnerStats, room.id, room.name]);

    const shareUrl = `${window.location.origin}/room/${room.id}`;
    const shareText = `🐐 ${winner?.name ?? "Alguém"} é o GOAT do TERMO ROYALE! Jogue em ${shareUrl}`;

    return (
        <>
            <VictoryAnimations />
            <div
                className="relative h-screen w-screen overflow-y-auto bg-sky-200 bg-cover bg-center flex items-start justify-center p-4 py-10"
                style={{ backgroundImage: "url('/bg-stadium.jpg')" }}
            >
                <Confetti />

                <div className="relative w-full max-w-3xl bg-slate-900/95 backdrop-blur-xl rounded-[2.5rem] border-4 border-yellow-400 shadow-[0_0_60px_rgba(250,204,21,0.35)] p-8 md:p-12 flex flex-col items-center text-white">
                    <WinnerHeader
                        winnerName={winner?.name}
                        euVenci={euVenci}
                        hasWinner={Boolean(winner)}
                    />

                    {winnerStats && <StatsRow stats={winnerStats} />}
                    <PhaseReplay phases={phasesPlayed} />
                    <Podium podium={podium} meuNome={meuNome} />
                    <HallOfFameBoard entries={hallOfFame} />

                    <ActionButtons
                        shareText={shareText}
                        onRematch={onRematch}
                        onBackToLobby={onBackToLobby}
                    />

                    <p className="mt-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        Sala #{room.id} · {room.players.length} competidores
                    </p>
                </div>
            </div>
        </>
    );
}
