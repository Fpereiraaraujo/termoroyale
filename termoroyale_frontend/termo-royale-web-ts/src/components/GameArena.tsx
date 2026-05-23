import { Header } from "./Header.tsx";
import { Board } from "./Board.tsx";
import { Keyboard } from "./Keyboard.tsx";
import { Ranking } from "./Ranking.tsx";
import type { Room, LetterStatus } from "../types/game";

interface GameArenaProps {
    room: Room;
    myPlayer: any;
    myGuesses: string[];
    myResults: LetterStatus[][];
    currentGuess: string;
    formatTime: (s: number) => string;
    handleKeyPress: (key: string) => void;
    keyStatuses: Record<string, LetterStatus>;
    meuNome: string;
}

export function GameArena({ room, myPlayer, myGuesses, myResults, currentGuess, formatTime, handleKeyPress, keyStatuses, meuNome }: GameArenaProps) {
    return (
        <div className="h-screen w-screen flex bg-sky-200 bg-cover bg-center overflow-hidden" style={{ backgroundImage: "url('/bg-stadium.jpg')" }}>
            <div className="flex-1 flex flex-col justify-between p-4 relative">
                <Header
                    lives={myPlayer?.isAlive ? (room.maxAttempts - (myPlayer?.currentAttempts || 0)) : 0}
                    timeRemaining={formatTime(room.timeLeft)}
                    currentPhase={room.status === "FINISHED" ? "FINALIZADO" : `ROUND ${room.currentRound}`}
                />

                <div className="flex-1 flex items-center justify-center gap-6 w-full">
                    {myPlayer?.isAlive ? (
                        <Board
                            title={room.name}
                            guesses={myGuesses}
                            results={myResults as any}
                            currentGuess={currentGuess}
                            targetWords={room.targetWords}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center p-10 bg-slate-800/80 backdrop-blur-lg rounded-3xl border-2 border-white/20 shadow-2xl text-white">
                            <div className="text-6xl mb-4">👻</div>
                            <h2 className="text-4xl font-black uppercase tracking-widest">Você foi eliminado!</h2>
                            <p className="text-slate-300 mt-2 font-bold">Não desanime! Continue assistindo para ver quem será o GOAT.</p>
                            <div className="mt-6 px-6 py-2 bg-slate-700 rounded-full text-sm font-black uppercase tracking-widest animate-pulse">
                                Modo Espectador Ativo
                            </div>
                        </div>
                    )}
                </div>

                {myPlayer?.isAlive && (
                    <div className="w-full flex justify-center pb-4">
                        <Keyboard onKeyPress={handleKeyPress} keyStatuses={keyStatuses} />
                    </div>
                )}
            </div>
            <Ranking players={room.players} currentPlayerName={meuNome} />
        </div>
    );
}