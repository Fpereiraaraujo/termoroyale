export type LetterStatus = 'CORRECT' | 'PRESENT' | 'ABSENT' | 'EMPTY';

export interface Player {
    id: string;
    name: string;
    isAlive: boolean;
    currentAttempts: number;
    won: boolean;
    guesses: string[];
    results: LetterStatus[][];
}

export interface Room {
    id: string;
    name: string;
    players: Player[];
    maxAttempts: number;
    finished: boolean;
    started: boolean;
    status: 'WAITING' | 'PLAYING' | 'FINISHED';
    timeLeft: number;
    currentRound: number;
    targetWords: string[];
}