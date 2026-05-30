export type LetterStatus = 'CORRECT' | 'PRESENT' | 'ABSENT' | 'EMPTY' | 'INITIAL';

export interface Player {
    id: string;
    name: string;
    isAlive: boolean;
    currentAttempts: number;
    won: boolean;
    guesses: string[];
    results: LetterStatus[][][];
    solvedTimes?: Record<number, number>;
}

export interface Room {
    id: string;
    name: string;
    players: Player[];
    maxAttempts: number;
    maxPlayers: number;
    finished: boolean;
    started: boolean;
    status: 'WAITING' | 'PLAYING' | 'FINISHED';
    timeLeft: number;
    phaseDuration?: number;
    currentRound: number;
    targetWords: string[];
    roundTargets?: Record<number, string[]>;
    suddenDeath?: boolean;
    graceWindowSeconds?: number;
    rematchRoomId?: string;
}