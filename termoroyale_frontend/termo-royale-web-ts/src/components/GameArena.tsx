import { Board } from "./Board.tsx";
import { Keyboard } from "./Keyboard.tsx";
import { Ranking } from "./Ranking.tsx";
import { SpectatorBoards } from "./SpectatorBoards.tsx";
import { Scoreboard } from "./Scoreboard.tsx";
import { EventFeed } from "./EventFeed.tsx";
import { ReactionBar, ReactionLayer } from "./Reactions.tsx";
import { FloatingLetters } from "./FloatingLetters.tsx";
import { useEffect } from "react";
import type { Room, LetterStatus } from "../types/game";
import type { ReactionEvent } from "../hooks/useGameSocket";
import { useI18n } from "../i18n";

interface GameArenaProps {
    room: Room;
    myPlayer: any;
    myGuesses: string[];
    myResults: LetterStatus[][][];
    currentGuess: string[];
    activeCol: number;
    setActiveCol: (col: number) => void;
    formatTime: (s: number) => string;
    handleKeyPress: (key: string) => void;
    keyStatuses: Record<string, LetterStatus>;
    meuNome: string;
    reactions: ReactionEvent[];
    sendReaction: (emoji: string) => void;
    expireReaction: (id: number) => void;
    errorTimestamp?: number;
}

export function GameArena({
                              room,
                              myPlayer,
                              myGuesses,
                              myResults,
                              currentGuess,
                              activeCol,
                              setActiveCol,
                              formatTime,
                              handleKeyPress,
                              keyStatuses,
                              meuNome,
                              reactions,
                              sendReaction,
                              expireReaction,
                              errorTimestamp,
                          }: GameArenaProps) {
    const { t } = useI18n();

    useEffect(() => {
        const handleKeyDownEvent = (event: KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            const key = event.key.toUpperCase();

            // Bloqueia se o jogador estiver morto ou se já ganhou a rodada (aguardando)
            if (!myPlayer?.isAlive || myPlayer?.won) return;

            if (key === "ENTER" || key === "BACKSPACE" || key === "DELETE" || key === "ARROWLEFT" || key === "ARROWRIGHT") {
                event.preventDefault();
                if (key === "ARROWLEFT") {
                    setActiveCol(Math.max(0, activeCol - 1));
                } else if (key === "ARROWRIGHT") {
                    setActiveCol(Math.min(4, activeCol + 1));
                } else {
                    handleKeyPress(key === "BACKSPACE" ? "DELETE" : key);
                }
            } else if (/^[A-Z]$/.test(key)) {
                event.preventDefault();
                handleKeyPress(key);
            }
        };

        window.addEventListener("keydown", handleKeyDownEvent);
        return () => window.removeEventListener("keydown", handleKeyDownEvent);
    }, [handleKeyPress, activeCol, setActiveCol, myPlayer]);

    return (
        <div className="h-screen w-screen flex overflow-hidden bg-sky-200 bg-cover bg-center relative"
             style={{ backgroundImage: "url('/bg-stadium.jpg')" }}>

            <FloatingLetters count={14} />
            <ReactionLayer reactions={reactions} onExpire={expireReaction} />
            <EventFeed players={room.players} currentRound={room.currentRound} />

            <div className="flex-1 flex flex-col relative min-w-0">
                <Scoreboard
                    lives={myPlayer?.isAlive ? room.maxAttempts - (myPlayer?.currentAttempts || 0) : 0}
                    maxLives={room.maxAttempts}
                    timeRemaining={formatTime(room.timeLeft)}
                    secondsLeft={room.timeLeft}
                    currentRound={room.currentRound}
                    status={room.status}
                />

                <div className="flex-1 flex flex-col items-center justify-center p-2 relative min-h-0">
                    {/* Mensagem de Espera (Aparece quando won é true) */}
                    {myPlayer?.won && (
                        <div className="absolute top-10 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase shadow-2xl border-4 border-white animate-bounce text-center">
                            <h3 className="text-2xl">{t("game.youGotIt")}</h3>
                            <p className="text-sm opacity-90">{t("game.waitingQuota")}</p>
                        </div>
                    )}

                    {!myPlayer?.isAlive ? (
                        <SpectatorBoards
                            players={room.players}
                            meuNome={meuNome}
                            targetWords={room.targetWords}
                            maxAttempts={room.maxAttempts}
                        />
                    ) : (
                        <div className="w-full flex justify-center">
                            <Board
                                title={room.name}
                                guesses={myGuesses}
                                results={myResults}
                                currentGuess={currentGuess}
                                targetWords={room.targetWords}
                                activeCol={activeCol}
                                onTileClick={setActiveCol}
                                errorTimestamp={errorTimestamp}
                            />
                        </div>
                    )}
                </div>

                {myPlayer?.isAlive && !myPlayer?.won && (
                    <div className="w-full flex flex-col items-center gap-2 pb-3">
                        <ReactionBar onReact={sendReaction} />
                        <Keyboard onKeyPress={handleKeyPress} keyStatuses={keyStatuses} />
                    </div>
                )}
                {(!myPlayer?.isAlive || myPlayer?.won) && (
                    <div className="w-full flex justify-center pb-3">
                        <ReactionBar onReact={sendReaction} />
                    </div>
                )}
            </div>

            {/* Passamos o currentRound para o Ranking conseguir ordenar pelo tempo da fase atual */}
            <Ranking
                players={room.players}
                currentPlayerName={meuNome}
                currentRound={room.currentRound}
                phaseElapsed={Math.max(0, (room.phaseDuration ?? 300) - room.timeLeft)}
            />
        </div>
    );
}