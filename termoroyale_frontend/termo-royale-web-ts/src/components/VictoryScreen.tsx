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
import { useI18n } from "../i18n";
import { buildWordleShare } from "../utils/wordleShare";

interface VictoryScreenProps {
    room: Room;
    meuNome: string;
    onBackToLobby: () => void;
    onRematch: () => void;
}

export function VictoryScreen({ room, meuNome, onBackToLobby, onRematch }: VictoryScreenProps) {
    const { winner, podium, winnerStats, phasesPlayed } = useVictoryData(room);
    const euVenci = winner?.name.toLowerCase() === meuNome.toLowerCase();
    const { t, lang } = useI18n();

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

    const shareText = buildWordleShare(room, winner, winnerStats?.totalTime ?? 0, lang);

    return (
        <>
            <VictoryAnimations />
            <div
                className="relative h-screen w-screen overflow-y-auto bg-sky-200 bg-cover bg-center flex items-start justify-center p-3 py-4"
                style={{ backgroundImage: "url('/bg-stadium.jpg')" }}
            >
                <Confetti />

                <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl border-2 border-amber-400/70 shadow-2xl p-5 md:p-6 flex flex-col items-center text-slate-200">
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

                    <p className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        {t("victory.footer", { id: room.id, count: room.players.length })}
                    </p>
                </div>
            </div>
        </>
    );
}
