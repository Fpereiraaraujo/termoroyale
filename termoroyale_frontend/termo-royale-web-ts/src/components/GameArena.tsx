import { Board } from "./Board.tsx";
import { Keyboard } from "./Keyboard.tsx";
import { Ranking } from "./Ranking.tsx";
import { SpectatorBoards } from "./SpectatorBoards.tsx";
import { Scoreboard } from "./Scoreboard.tsx";
import { EventFeed } from "./EventFeed.tsx";
import { ReactionBar, ReactionLayer } from "./Reactions.tsx";
import { FloatingLetters } from "./FloatingLetters.tsx";
import { useEffect, useRef, useState } from "react";
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
    sendHint: () => void;
    lastHint: { position: number; letter: string; remainingAttempts: number; ts: number } | null;
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
                              sendHint,
                              lastHint,
                          }: GameArenaProps) {
    const { t } = useI18n();

    // ---- Transição entre rounds: countdown 3-2-1 ----
    const prevRoundRef = useRef<number>(room.currentRound);
    const [transitionRound, setTransitionRound] = useState<number | null>(null);
    const [countdown, setCountdown] = useState(3);
    useEffect(() => {
        if (room.currentRound > prevRoundRef.current && room.status === "PLAYING") {
            prevRoundRef.current = room.currentRound;
            setTransitionRound(room.currentRound);
            setCountdown(3);
            const t1 = window.setTimeout(() => setCountdown(2), 1000);
            const t2 = window.setTimeout(() => setCountdown(1), 2000);
            const t3 = window.setTimeout(() => setTransitionRound(null), 3000);
            return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
        }
        prevRoundRef.current = room.currentRound;
    }, [room.currentRound, room.status]);

    // ---- "Quase!": detecta eliminação com melhor tentativa 4/5 ----
    const wasAliveLocalRef = useRef<boolean | undefined>(myPlayer?.isAlive);
    const [showQuase, setShowQuase] = useState(false);    useEffect(() => {
        if (!myPlayer) return;
        if (wasAliveLocalRef.current && !myPlayer.isAlive && !myPlayer.won) {
            const best = (myPlayer.results || []).reduce((max: number, perGuess: LetterStatus[][]) => {
                const grid = perGuess?.[0] || [];
                const c = grid.filter((s) => s === "CORRECT").length;
                return Math.max(max, c);
            }, 0);
            if (best >= 4) {
                setShowQuase(true);
                const t = window.setTimeout(() => setShowQuase(false), 2800);
                return () => clearTimeout(t);
            }
        }
        wasAliveLocalRef.current = myPlayer.isAlive;
    }, [myPlayer?.isAlive, myPlayer?.won]);

    // ---- Toast da Dica ----
    const lastHintTsRef = useRef<number>(0);
    const [hintToast, setHintToast] = useState<{ position: number; letter: string } | null>(null);
    useEffect(() => {
        if (!lastHint || lastHint.ts === lastHintTsRef.current) return;
        lastHintTsRef.current = lastHint.ts;
        setHintToast({ position: lastHint.position, letter: lastHint.letter });
        const id = window.setTimeout(() => setHintToast(null), 5000);
        return () => window.clearTimeout(id);
    }, [lastHint]);

    const meKey = meuNome.toLowerCase();
    const hintAlreadyUsed = (room.usedHints?.[meKey] ?? 0) >= 1;
    const attemptsRemaining = Math.max(0, room.maxAttempts - (myPlayer?.currentAttempts || 0));
    const canUseHint = !!myPlayer?.isAlive && !myPlayer?.won && !hintAlreadyUsed && attemptsRemaining > 2;

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

            {/* ===== Overlay: Transição entre rounds ===== */}
            {transitionRound !== null && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm animate-fade-in">
                    <div className="text-center px-6">
                        <div className="text-amber-400 text-sm sm:text-base font-black uppercase tracking-[0.4em] mb-3">
                            {t("game.transitionTitle", { n: transitionRound })}
                        </div>
                        <div className="text-white text-2xl sm:text-3xl font-black mb-8 uppercase">
                            {transitionRound === 2 ? t("game.transitionR2") : transitionRound === 3 ? t("game.transitionR3") : ""}
                        </div>
                        <div key={countdown} className="text-amber-400 text-[12rem] sm:text-[16rem] font-black leading-none animate-countdown">
                            {countdown}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Overlay: Quase! ===== */}
            {showQuase && (
                <div className="fixed inset-0 z-55 flex items-start justify-center pt-24 pointer-events-none">
                    <div className="bg-rose-600 text-white px-10 py-6 rounded-2xl border border-rose-400 shadow-2xl text-center animate-quase">
                        <div className="text-5xl sm:text-6xl font-black uppercase tracking-widest">
                            {t("game.quaseTitle")}
                        </div>
                        <div className="text-sm sm:text-base font-bold mt-2 opacity-95">
                            {t("game.quaseSubtitle")}
                        </div>
                    </div>
                </div>
            )}

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

                {/* Botão de Dica (power-up) — barra própria pra não brigar com o Scoreboard */}
                <div className="w-full flex justify-end px-3 pt-2 z-30">
                    <button
                        type="button"
                        onClick={() => { if (canUseHint) sendHint(); }}
                        disabled={!canUseHint}
                        title={hintAlreadyUsed ? t("powerup.hintUsed") : attemptsRemaining <= 2 ? t("powerup.hintNoAttempts") : t("powerup.hintTooltip")}
                        className={`px-3 py-1.5 rounded-lg font-black text-[11px] uppercase tracking-wider border transition-all shadow ${
                            canUseHint
                                ? "bg-amber-400 text-slate-900 border-amber-500 hover:bg-amber-300 hover:scale-105 cursor-pointer"
                                : "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-60"
                        }`}
                    >
                        💡 {t("powerup.hint")} <span className="opacity-70">(-2)</span>
                    </button>
                </div>

                {hintToast && (
                    <div className="fixed inset-0 z-55 flex items-start justify-center pt-32 pointer-events-none">
                        <div className="bg-amber-400 text-slate-900 px-10 py-6 rounded-2xl border border-amber-300 shadow-2xl text-center animate-quase">
                            <div className="text-xs font-black uppercase tracking-[0.3em] opacity-80 mb-1">
                                {t("powerup.hintReveal")}
                            </div>
                            <div className="text-3xl sm:text-4xl font-black uppercase tracking-widest">
                                {t("powerup.hintResult", { position: hintToast.position + 1, letter: hintToast.letter })}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col items-center justify-center p-2 relative min-h-0">
                    {/* Mensagem de Espera (Aparece quando won é true) */}
                    {myPlayer?.won && (
                        <div className="absolute top-10 z-50 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase shadow-xl border border-emerald-400 animate-bounce text-center">
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