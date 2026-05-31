import { useSpectateSocket } from "../hooks/useSpectateSocket";
import { SpectatorBoards } from "./SpectatorBoards";
import { Ranking } from "./Ranking";
import { useI18n } from "../i18n";

interface SpectateProps {
    roomId: string;
    onBackHome: () => void;
}

export function Spectate({ roomId, onBackHome }: SpectateProps) {
    const { t } = useI18n();
    const { room, isConnected } = useSpectateSocket(roomId);

    if (!isConnected || !room) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white font-black text-xl animate-pulse">
                {t("spectate.connecting")}
            </div>
        );
    }

    const phaseElapsed = Math.max(0, (room.phaseDuration ?? 300) - room.timeLeft);

    return (
        <div className="h-screen w-screen flex flex-col bg-sky-200 bg-cover bg-center overflow-hidden"
             style={{ backgroundImage: "url('/bg-stadium.jpg')" }}>

            <div className="w-full p-3 flex items-center justify-between bg-slate-900/70 backdrop-blur-md shrink-0">
                <button
                    onClick={onBackHome}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-black px-4 py-2 rounded-xl uppercase text-xs tracking-widest border-2 border-slate-700"
                >
                    ← {t("solo.backHome")}
                </button>
                <div className="text-white font-black uppercase tracking-widest text-sm">
                    {t("spectate.title")} · {room.name}
                </div>
                <div className="bg-red-500 text-white font-black px-3 py-2 rounded-xl uppercase text-xs tracking-widest animate-pulse">
                    {t("spectate.live")}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden min-h-0">
                <div className="flex-1 overflow-y-auto p-3">
                    <SpectatorBoards
                        players={room.players}
                        meuNome=""
                        targetWords={room.targetWords}
                        maxAttempts={room.maxAttempts}
                    />
                </div>

                <Ranking
                    players={room.players}
                    currentPlayerName=""
                    currentRound={room.currentRound}
                    phaseElapsed={phaseElapsed}
                />
            </div>
        </div>
    );
}
