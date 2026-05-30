import { useState, useEffect, useMemo } from "react";
import { useGameSocket } from './hooks/useGameSocket';
import { Home } from "./components/Home.tsx";
import { Lobby } from "./components/Lobby.tsx";
import { GameArena } from "./components/GameArena.tsx";
import { VictoryScreen } from "./components/VictoryScreen.tsx";
import type { LetterStatus } from "./types/game";

const GlobalStyles = () => (
    <style>{`
    @keyframes flipTile {
        0% { transform: rotateX(-90deg) scale(1.1); opacity: 0; }
        50% { transform: rotateX(20deg) scale(1.05); opacity: 1; }
        100% { transform: rotateX(0) scale(1); opacity: 1; }
    }
    .animate-flip {
        animation: flipTile 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        opacity: 0;
    }
  `}</style>
);

export default function App() {
  const [meuNome, setMeuNome] = useState("");
  const [inLobby, setInLobby] = useState(false);

  // LÊ A URL INICIALMENTE: Se tiver /room/ID, já salva o ID
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/room/')) return path.replace('/room/', '');
    return null;
  });

  const [selectedRoomName, setSelectedRoomName] = useState<string | null>(null);
  const [selectedRoomMaxPlayers, setSelectedRoomMaxPlayers] = useState<number | null>(null);
  const [selectedRoomIsPrivate, setSelectedRoomIsPrivate] = useState<boolean | null>(null);
  const [currentGuess, setCurrentGuess] = useState<string[]>(Array(5).fill(""));
  const [activeCol, setActiveCol] = useState(0);

    const { room, isConnected, sendGuess, requestRematch, reactions, sendReaction, expireReaction } = useGameSocket(
      meuNome,
      selectedRoomId,
      selectedRoomName,
      selectedRoomMaxPlayers,
      selectedRoomIsPrivate,
      (Boolean(meuNome) && !inLobby)
    );

  // ATUALIZA A URL NO NAVEGADOR AUTOMATICAMENTE
  useEffect(() => {
    if (room?.id) {
      window.history.replaceState({}, '', `/room/${room.id}`);
    } else if (!inLobby && !selectedRoomId && meuNome) {
      window.history.replaceState({}, '', `/`);
    }
  }, [room?.id, inLobby, selectedRoomId, meuNome]);

  const myPlayer = useMemo(() => {
    if (!room || !meuNome) return undefined;
    return room.players.find(p => p.name.toLowerCase() === meuNome.toLowerCase());
  }, [room, meuNome]);

  const myGuesses = myPlayer?.guesses || [];
  const myResults = (myPlayer?.results as unknown as LetterStatus[][][]) || [];

  const keyStatuses = useMemo(() => {
    const statuses: Record<string, LetterStatus> = {};
    if (!myPlayer) return statuses;
    myGuesses.forEach((word, wordIndex) => {
      const gridsResults = myResults[wordIndex];
      if (!gridsResults) return;

      gridsResults.forEach(gridResult => {
        word.split("").forEach((letter, letterIndex) => {
          const currentStatus = gridResult[letterIndex] as LetterStatus;
          if (statuses[letter] === "CORRECT") return;
          if (statuses[letter] === "PRESENT" && currentStatus === "ABSENT") return;
          statuses[letter] = currentStatus;
        });
      });
    });
    return statuses;
  }, [myGuesses, myResults, myPlayer]);

  const handleKeyPress = (key: string) => {
    if (!myPlayer || room?.status !== "PLAYING" || !myPlayer.isAlive) return;

    const k = key.toUpperCase();

    if (k === 'ENTER') {
      const word = currentGuess.join("");
      if (word.length === 5 && !currentGuess.includes("")) {
        sendGuess(word);
      }
    } else if (k === 'DELETE' || k === 'BACKSPACE') {
      setCurrentGuess(prev => {
        const newGuess = [...prev];
        if (newGuess[activeCol] !== "") {
          newGuess[activeCol] = "";
        } else if (activeCol > 0) {
          newGuess[activeCol - 1] = "";
          setActiveCol(activeCol - 1);
        }
        return newGuess;
      });
    } else if (/^[A-Z]$/.test(k)) {
      setCurrentGuess(prev => {
        const newGuess = [...prev];
        newGuess[activeCol] = k;
        return newGuess;
      });
      if (activeCol < 4) setActiveCol(activeCol + 1);
    }
  };

  useEffect(() => {
    setCurrentGuess(Array(5).fill(""));
    setActiveCol(0);
  }, [myGuesses.length]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // SE NÃO TEM NOME, PEDE O NOME.
  // Se a pessoa entrou pelo link (selectedRoomId != null), pula o lobby!
  if (!meuNome) return (
      <><GlobalStyles />
        <Home onJoin={(n) => {
          setMeuNome(n);
          if (!selectedRoomId) setInLobby(true);
        }} />
      </>
  );

    if (inLobby) return (
      <><GlobalStyles />
      <Lobby
        playerName={meuNome}
        onJoinRoom={(id) => { setSelectedRoomId(id); setInLobby(false); }}
        onCreateRoom={(n, maxPlayers, isPrivate) => {
          setSelectedRoomName(n);
          setSelectedRoomMaxPlayers(maxPlayers);
          setSelectedRoomIsPrivate(isPrivate);
          setInLobby(false);
        }}
      /></>
    );

  if (!isConnected || !room || !myPlayer) return (
      <><GlobalStyles /><div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white font-black text-2xl animate-pulse">SINCRONIZANDO...</div></>
  );

  if (room.status === "FINISHED") {
    const resetRoomState = () => {
      setSelectedRoomId(null);
      setSelectedRoomName(null);
      setSelectedRoomMaxPlayers(null);
      setSelectedRoomIsPrivate(null);
    };
    const handleBackToLobby = () => {
      resetRoomState();
      setInLobby(true);
      window.history.replaceState({}, '', '/');
    };
    const handleRematch = () => {
      // Pede ao backend para criar (uma vez) ou recuperar a sala de revanche
      // dessa sala original. O backend devolve via /user/queue/room a nova sala
      // já com o jogador dentro, e o hook substitui `room` automaticamente.
      requestRematch(room.id);
    };
    return (
        <><GlobalStyles />
          <VictoryScreen
              room={room}
              meuNome={meuNome}
              onBackToLobby={handleBackToLobby}
              onRematch={handleRematch}
          />
        </>
    );
  }

  if (room.status === "WAITING") return (
      <><GlobalStyles />
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-sky-200 bg-cover bg-center p-4" style={{ backgroundImage: "url('/bg-stadium.jpg')" }}>
          <div className="w-full max-w-2xl bg-slate-100/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white flex flex-col gap-6 text-center">
            <div>
              <span className="bg-slate-800 text-yellow-400 font-black px-4 py-1.5 rounded-full text-xs uppercase tracking-widest shadow-inner">Aguardando Competidores</span>
              <h2 className="text-5xl font-black text-slate-800 uppercase mt-4 tracking-wide">{room.name}</h2>
              <p className="text-slate-400 font-bold text-sm mt-2">Link da Sala: <span className="text-sky-600 bg-sky-100 px-2 py-1 rounded select-all cursor-pointer">{window.location.origin}/room/{room.id}</span></p>
            </div>
            <div className="bg-slate-800 text-white rounded-3xl p-8 border-b-8 border-slate-950 shadow-inner mt-4">
              <span className="text-sm font-black uppercase text-slate-400 tracking-widest block mb-2">A partida começa em</span>
              <span className="text-7xl font-black font-mono text-green-400 tracking-wider">{formatTime(room.timeLeft)}</span>
            </div>
            <div className="text-left mt-4">
              <h3 className="text-lg font-black text-slate-700 uppercase tracking-wider mb-4">Confirmados ({room.players.length} / {room.maxPlayers})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[30vh] overflow-y-auto pr-2">
                {room.players.map(player => (
                    <div key={player.id} className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                      <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse shadow-sm" />
                      <span className="font-black text-slate-700 uppercase tracking-wide text-lg">{player.name}</span>
                      {player.name.toLowerCase() === meuNome.toLowerCase() && <span className="text-xs font-black text-white bg-sky-500 px-2 py-1 rounded-full ml-auto">VOCÊ</span>}
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div></>
  );

  return (
      <><GlobalStyles />
        <GameArena
            room={room}
            myPlayer={myPlayer}
            myGuesses={myGuesses}
            myResults={myResults}
            currentGuess={currentGuess}
            activeCol={activeCol}
            setActiveCol={setActiveCol}
            formatTime={formatTime}
            handleKeyPress={handleKeyPress}
            keyStatuses={keyStatuses}
            meuNome={meuNome}
            reactions={reactions}
            sendReaction={sendReaction}
            expireReaction={expireReaction}
        /></>
  );
}