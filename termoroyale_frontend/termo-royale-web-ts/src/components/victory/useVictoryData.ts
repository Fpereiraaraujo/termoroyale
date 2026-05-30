import { useMemo } from "react";
import type { Player, Room } from "../../types/game";

export interface PodiumEntry {
    player: Player;
    roundsWon: number;
    finalTime: number;
}

export interface WinnerStats {
    attempts: number;
    roundsWon: number;
    totalTime: number;
}

export interface PhaseInfo {
    round: number;
    words: string[];
}

export interface VictoryData {
    winner: Player | undefined;
    podium: PodiumEntry[];
    winnerStats: WinnerStats | null;
    phasesPlayed: PhaseInfo[];
}

export function useVictoryData(room: Room): VictoryData {
    const winner = useMemo<Player | undefined>(() => {
        const candidates = room.players.filter(p => p.won);
        if (candidates.length === 0) return undefined;
        return [...candidates].sort((a, b) => {
            const ta = a.solvedTimes?.[room.currentRound] ?? 99999;
            const tb = b.solvedTimes?.[room.currentRound] ?? 99999;
            return ta - tb;
        })[0];
    }, [room.players, room.currentRound]);

    const podium = useMemo<PodiumEntry[]>(() => {
        return [...room.players]
            .map(p => {
                const solvedTimes = p.solvedTimes ?? {};
                const roundsWon = Object.keys(solvedTimes).length;
                const finalTime = solvedTimes[room.currentRound] ?? 99999;
                return { player: p, roundsWon, finalTime };
            })
            .sort((a, b) => {
                if (b.roundsWon !== a.roundsWon) return b.roundsWon - a.roundsWon;
                return a.finalTime - b.finalTime;
            })
            .slice(0, 3);
    }, [room.players, room.currentRound]);

    const winnerStats = useMemo<WinnerStats | null>(() => {
        if (!winner) return null;
        const solvedTimes = winner.solvedTimes ?? {};
        const roundsWon = Object.keys(solvedTimes).length;
        const totalTime = (Object.values(solvedTimes) as number[]).reduce((s, t) => s + t, 0);
        return { attempts: winner.currentAttempts, roundsWon, totalTime };
    }, [winner]);

    const phasesPlayed = useMemo<PhaseInfo[]>(() => {
        const rt = room.roundTargets ?? {};
        const out: PhaseInfo[] = [];
        for (let r = 1; r <= room.currentRound; r++) {
            const words = rt[r];
            if (words && words.length > 0) out.push({ round: r, words });
        }
        if (out.length === 0 && room.targetWords?.length) {
            out.push({ round: room.currentRound, words: room.targetWords });
        }
        return out;
    }, [room.roundTargets, room.targetWords, room.currentRound]);

    return { winner, podium, winnerStats, phasesPlayed };
}
