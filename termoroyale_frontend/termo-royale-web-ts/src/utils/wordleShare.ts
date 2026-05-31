import type { Player, Room } from "../types/game";

const EMOJI: Record<string, string> = {
    CORRECT: "🟩",
    PRESENT: "🟨",
    ABSENT: "⬛",
    EMPTY: "⬜",
    INITIAL: "⬜",
};

/**
 * Gera o "share" estilo Wordle do vencedor:
 *   🐐 TERMO ROYALE · R3
 *   Fernando venceu em 1m23s · 3 tentativas
 *   ⬛🟨⬛🟩⬛
 *   🟩🟨⬛🟩⬛
 *   🟩🟩🟩🟩🟩
 *   https://.../room/ABC123
 *
 * Usa apenas o primeiro alvo do round (fase R2/R3 têm múltiplos alvos, mas
 * 1 grid já transmite o feeling Wordle clássico).
 */
export function buildWordleShare(
    room: Room,
    winner: Player | undefined,
    durationSec: number,
    lang: "pt" | "en" = "pt"
): string {
    const url = `${window.location.origin}/spectate/${room.id}`;
    const minutes = Math.floor(durationSec / 60);
    const seconds = durationSec % 60;
    const timeStr = `${minutes}m${seconds.toString().padStart(2, "0")}s`;
    const attempts = winner?.guesses.length ?? 0;
    const name = winner?.name ?? "?";

    let grid = "";
    if (winner?.results?.length) {
        const lines: string[] = [];
        for (const perGuess of winner.results) {
            const firstWordGrid = perGuess?.[0];
            if (!firstWordGrid) continue;
            lines.push(firstWordGrid.map((s) => EMOJI[s] ?? "⬜").join(""));
        }
        grid = lines.join("\n");
    }

    const header =
        lang === "pt"
            ? `🐐 TERMO ROYALE · R${room.currentRound}\n${name} venceu em ${timeStr} · ${attempts} tentativa${attempts !== 1 ? "s" : ""}`
            : `🐐 TERMO ROYALE · R${room.currentRound}\n${name} won in ${timeStr} · ${attempts} attempt${attempts !== 1 ? "s" : ""}`;

    return grid ? `${header}\n\n${grid}\n\n${url}` : `${header}\n\n${url}`;
}
