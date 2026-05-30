export type HallEntry = {
    name: string;
    date: number;
    roomId: string;
    roomName: string;
    totalTime: number;
    attempts: number;
};

export const HOF_KEY = "termoroyale.hallOfFame";
export const HOF_MAX = 5;

export function loadHallOfFame(): HallEntry[] {
    try {
        const raw = localStorage.getItem(HOF_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.slice(0, HOF_MAX) : [];
    } catch {
        return [];
    }
}

export function pushHallOfFame(entry: HallEntry): HallEntry[] {
    const list = [
        entry,
        ...loadHallOfFame().filter(e => !(e.roomId === entry.roomId && e.name === entry.name)),
    ];
    const trimmed = list.slice(0, HOF_MAX);
    localStorage.setItem(HOF_KEY, JSON.stringify(trimmed));
    return trimmed;
}
