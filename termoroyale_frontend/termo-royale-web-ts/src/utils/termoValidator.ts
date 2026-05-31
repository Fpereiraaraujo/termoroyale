import type { LetterStatus } from "../types/game";

/**
 * Replica em TypeScript do TermoValidator (Java).
 * Marca CORRECT em 1ª passagem, depois PRESENT/ABSENT respeitando contagem de letras duplicadas.
 */
export function validateGuess(guess: string, target: string): LetterStatus[] {
    const g = guess.toUpperCase();
    const t = target.toUpperCase();
    const length = t.length;
    const result: LetterStatus[] = new Array(length).fill("ABSENT");

    const counts: Record<string, number> = {};
    for (const c of t) counts[c] = (counts[c] ?? 0) + 1;

    // 1ª passagem: verde
    for (let i = 0; i < length; i++) {
        if (g[i] === t[i]) {
            result[i] = "CORRECT";
            counts[g[i]]--;
        }
    }

    // 2ª passagem: amarelo / cinza
    for (let i = 0; i < length; i++) {
        if (result[i] === "CORRECT") continue;
        const c = g[i];
        if ((counts[c] ?? 0) > 0) {
            result[i] = "PRESENT";
            counts[c]--;
        } else {
            result[i] = "ABSENT";
        }
    }
    return result;
}

/** Calcula key statuses agregados a partir de todas as tentativas (igual ao multiplayer). */
export function computeKeyStatuses(
    guesses: string[],
    results: LetterStatus[][]
): Record<string, LetterStatus> {
    const out: Record<string, LetterStatus> = {};
    guesses.forEach((word, gi) => {
        const row = results[gi];
        if (!row) return;
        word.split("").forEach((letter, li) => {
            const cur = row[li];
            if (out[letter] === "CORRECT") return;
            if (out[letter] === "PRESENT" && cur === "ABSENT") return;
            out[letter] = cur;
        });
    });
    return out;
}
