import type { Player } from "../types/game";

interface RankingProps {
    players: Player[];
    currentPlayerName: string;
}

export function Ranking({ players, currentPlayerName }: RankingProps) {
    const sortedPlayers = [...players].sort((a, b) => {
        if (a.won !== b.won) return a.won ? -1 : 1;
        return a.currentAttempts - b.currentAttempts;
    });

    const getMedalStyle = (index: number, won: boolean) => {
        if (!won) return "text-slate-400";
        if (index === 0) return "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]"; // Ouro
        if (index === 1) return "text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.8)]"; // Prata
        if (index === 2) return "text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.8)]"; // Bronze
        return "text-slate-600";
    };

    return (
        <div className="w-80 bg-slate-900/90 backdrop-blur-xl border-l border-slate-700 p-6 flex flex-col gap-4">
            <h2 className="text-white font-black text-xl uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-2 h-8 bg-sky-500 rounded-full"></span>
                Ranking
            </h2>

            <div className="flex flex-col gap-2">
                {sortedPlayers.map((player, index) => (
                    <div
                        key={player.id}
                        className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-500 ease-out border ${
                            player.name === currentPlayerName
                                ? "bg-sky-500/20 border-sky-500/50"
                                : "bg-slate-800/50 border-transparent"
                        }`}
                    >
                        {/* Número do Ranking com Estilo de Medalha */}
                        <span className={`font-black text-2xl w-8 text-center ${getMedalStyle(index, player.won)}`}>
              {index === 0 && player.won ? "👑" : `#${index + 1}`}
            </span>

                        {/* Nome do Jogador */}
                        <div className="flex-1 overflow-hidden">
                            <p className={`font-bold truncate ${player.won ? "text-white" : "text-slate-400"}`}>
                                {player.name}
                                {player.name === currentPlayerName && <span className="text-[10px] ml-2 text-sky-400 font-bold">(Você)</span>}
                            </p>
                        </div>

                        {/* Status (Morto ou Vivo) */}
                        {!player.isAlive && !player.won && (
                            <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded uppercase font-black">Fora</span>
                        )}

                        {player.won && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded uppercase font-black">WIN</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}