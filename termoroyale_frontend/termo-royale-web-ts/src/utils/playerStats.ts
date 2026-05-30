const KEY = "termoroyale.stats";

export interface PlayerStats {
    games: number;
    wins: number;
    losses: number;
    currentStreak: number;
    bestStreak: number;
    fastestWinSec: number | null;
}

const DEFAULT: PlayerStats = {
    games: 0, wins: 0, losses: 0,
    currentStreak: 0, bestStreak: 0, fastestWinSec: null,
};

export function loadStats(): PlayerStats {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return { ...DEFAULT };
        return { ...DEFAULT, ...JSON.parse(raw) };
    } catch { return { ...DEFAULT }; }
}

export function recordResult(won: boolean, totalTimeSec?: number): PlayerStats {
    const s = loadStats();
    s.games += 1;
    if (won) {
        s.wins += 1;
        s.currentStreak += 1;
        if (s.currentStreak > s.bestStreak) s.bestStreak = s.currentStreak;
        if (totalTimeSec !== undefined && totalTimeSec > 0) {
            s.fastestWinSec = s.fastestWinSec === null ? totalTimeSec : Math.min(s.fastestWinSec, totalTimeSec);
        }
    } else {
        s.losses += 1;
        s.currentStreak = 0;
    }
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
    return s;
}
