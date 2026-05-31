import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Board } from "./Board";
import { Keyboard } from "./Keyboard";
import type { LetterStatus } from "../types/game";
import { computeKeyStatuses, validateGuess } from "../utils/termoValidator";
import { useI18n } from "../i18n";

interface SoloState {
    guesses: string[];
    results: LetterStatus[][];
    won: boolean;
    finished: boolean;
}

interface SoloBoardProps {
    target: string;
    title: string;
    /** Se informado, o estado é persistido em localStorage com essa chave. */
    storageKey?: string;
    maxAttempts?: number;
    onFinish?: (won: boolean, attempts: number) => void;
    /** Renderiza no rodapé do board (ex.: botão "Nova palavra" no Prática). */
    footer?: React.ReactNode;
}

function loadState(key?: string): SoloState | null {
    if (!key) return null;
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw) as SoloState;
    } catch { return null; }
}
function saveState(key: string | undefined, s: SoloState) {
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(s)); } catch { /* ignore */ }
}

export function SoloBoard({ target, title, storageKey, maxAttempts = 6, onFinish, footer }: SoloBoardProps) {
    const { t } = useI18n();

    const initial = useMemo<SoloState>(() => {
        const loaded = loadState(storageKey);
        if (loaded) return loaded;
        return { guesses: [], results: [], won: false, finished: false };
    }, [storageKey]);

    const [guesses, setGuesses] = useState<string[]>(initial.guesses);
    const [results, setResults] = useState<LetterStatus[][]>(initial.results);
    const [won, setWon] = useState(initial.won);
    const [finished, setFinished] = useState(initial.finished);
    const [currentGuess, setCurrentGuess] = useState<string[]>(Array(5).fill(""));
    const [activeCol, setActiveCol] = useState(0);
    const [errorTimestamp, setErrorTimestamp] = useState(0);
    const finishedRef = useRef(false);

    const submitGuess = useCallback((word: string) => {
        if (word.length !== 5 || finished) return;
        if (guesses.includes(word)) { setErrorTimestamp(Date.now()); return; }

        const row = validateGuess(word, target);
        const allCorrect = row.every(s => s === "CORRECT");
        const newGuesses = [...guesses, word];
        const newResults = [...results, row];
        const newWon = allCorrect;
        const newFinished = allCorrect || newGuesses.length >= maxAttempts;

        setGuesses(newGuesses);
        setResults(newResults);
        setWon(newWon);
        setFinished(newFinished);
        setCurrentGuess(Array(5).fill(""));
        setActiveCol(0);

        saveState(storageKey, { guesses: newGuesses, results: newResults, won: newWon, finished: newFinished });

        if (newFinished && !finishedRef.current) {
            finishedRef.current = true;
            onFinish?.(newWon, newGuesses.length);
        }
    }, [guesses, results, target, finished, maxAttempts, storageKey, onFinish]);

    const handleKey = useCallback((rawKey: string) => {
        if (finished) return;
        const key = rawKey.toUpperCase();

        if (key === "ENTER") {
            if (currentGuess.every(c => c !== "")) submitGuess(currentGuess.join(""));
            return;
        }
        if (key === "DELETE" || key === "BACKSPACE") {
            setCurrentGuess(prev => {
                const next = [...prev];
                if (next[activeCol] !== "") next[activeCol] = "";
                else if (activeCol > 0) { next[activeCol - 1] = ""; setActiveCol(activeCol - 1); }
                return next;
            });
            return;
        }
        if (/^[A-Z]$/.test(key)) {
            setCurrentGuess(prev => {
                const next = [...prev];
                next[activeCol] = key;
                return next;
            });
            if (activeCol < 4) setActiveCol(activeCol + 1);
        }
    }, [currentGuess, activeCol, finished, submitGuess]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const key = e.key.toUpperCase();
            if (key === "ENTER" || key === "BACKSPACE" || key === "DELETE" || /^[A-Z]$/.test(key)) {
                e.preventDefault();
                handleKey(key === "BACKSPACE" ? "DELETE" : key);
            } else if (key === "ARROWLEFT") {
                e.preventDefault();
                setActiveCol(c => Math.max(0, c - 1));
            } else if (key === "ARROWRIGHT") {
                e.preventDefault();
                setActiveCol(c => Math.min(4, c + 1));
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [handleKey]);

    // Board espera results no formato [guess][grid][letter]; aqui sempre grid=0.
    const boardResults: LetterStatus[][][] = results.map(r => [r]);
    const keyStatuses = computeKeyStatuses(guesses, results);

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <Board
                title={title}
                guesses={guesses}
                results={boardResults}
                currentGuess={currentGuess}
                targetWords={[target]}
                activeCol={activeCol}
                onTileClick={setActiveCol}
                errorTimestamp={errorTimestamp}
            />

            {finished && (
                <div className={`px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-white text-center shadow-md border-2 ${won ? "bg-emerald-500 border-emerald-600" : "bg-slate-700 border-slate-800"}`}>
                    {won ? t("solo.youWon") : t("solo.youLost", { word: target })}
                </div>
            )}

            {!finished && (
                <Keyboard onKeyPress={handleKey} keyStatuses={keyStatuses} />
            )}

            {footer}
        </div>
    );
}
