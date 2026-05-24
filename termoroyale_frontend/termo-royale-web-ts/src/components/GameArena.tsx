import { Header } from "./Header.tsx";
import { Board } from "./Board.tsx";
import { Keyboard } from "./Keyboard.tsx";
import { Ranking } from "./Ranking.tsx";
import { useEffect } from "react";
import type { Room, LetterStatus } from "../types/game";

interface GameArenaProps {
    room: Room;
    myPlayer: any;
    myGuesses: string[];
    myResults: LetterStatus[][][];
    currentGuess: string;
    formatTime: (s: number) => string;
    handleKeyPress: (key: string) => void;
    keyStatuses: Record<string, LetterStatus>;
    meuNome: string;
}

export function GameArena({
                              room,
                              myPlayer,
                              myGuesses,
                              myResults,
                              currentGuess,
                              formatTime,
                              handleKeyPress,
                              keyStatuses,
                              meuNome
                          }: GameArenaProps) {

    useEffect(() => {
        const handleKeyDownEvent = (event: KeyboardEvent) => {
            const key = event.key.toUpperCase();
            if (key === "ENTER" || key === "BACKSPACE" || key === "DELETE") {
                event.preventDefault();
                handleKeyPress(key === "BACKSPACE" ? "DELETE" : key);
            } else if (/^[A-Z]$/.test(key)) {
                event.preventDefault();
                handleKeyPress(key);
            }
        };

        window.addEventListener("keydown", handleKeyDownEvent);
        return () => window.removeEventListener("keydown", handleKeyDownEvent);
    }, [handleKeyPress]);

    return (
        <div className="h-screen w-screen flex bg-sky-200 bg-cover bg-center overflow-hidden"
             style={{ backgroundImage: "url('/bg-stadium.jpg')" }}>

            <div className="flex-1 flex flex-col justify-between p-4 relative">
                <Header
                    lives={myPlayer?.isAlive ? (room.maxAttempts - (myPlayer?.currentAttempts || 0)) : 0}
                    timeRemaining={formatTime(room.timeLeft)}
                    currentPhase={room.status === "FINISHED" ? "FINALIZADO" : `ROUND ${room.currentRound}`}
                />

                <div className="flex-1 flex items-center justify-center gap-6 w-full">
                    {myPlayer?.won ? (
                        <div className="bg-green-900/90 p-10 rounded-3xl border-4 border-green-500 text-center text-white shadow-2xl">
                            <h2 className="text-5xl font-black uppercase tracking-widest">Você Venceu!</h2>
                            <p className="mt-4 text-xl font-bold">Aguardando os outros competidores...</p>
                            <div className="mt-8 text-6xl animate-pulse">⏳</div>
                        </div>
                    ) : myPlayer?.isAlive ? (
                        <Board
                            title={room.name}
                            guesses={myGuesses}
                            results={myResults}
                            currentGuess={currentGuess}
                            targetWords={room.targetWords}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center p-10 bg-slate-800/80 backdrop-blur-lg rounded-3xl border-2 border-white/20 shadow-2xl text-white">
                            <div className="text-6xl mb-4">👻</div>
                            <h2 className="text-4xl font-black uppercase tracking-widest">Você foi eliminado!</h2>
                            <p className="text-slate-300 mt-2 font-bold">Continue assistindo para ver quem será o GOAT.</p>
                        </div>
                    )}
                </div>

                {myPlayer?.isAlive && !myPlayer?.won && (
                    <div className="w-full flex justify-center pb-4">
                        <Keyboard onKeyPress={handleKeyPress} keyStatuses={keyStatuses} />
                    </div>
                )}
            </div>

            <Ranking players={room.players} currentPlayerName={meuNome} />
        </div>
    );
}