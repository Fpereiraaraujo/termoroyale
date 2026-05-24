import { useState, useEffect, useMemo } from "react";
import { useGameSocket } from './hooks/useGameSocket';
import { Home } from "./components/Home.tsx";
import { Lobby } from "./components/Lobby.tsx";
import { GameArena } from "./components/GameArena.tsx";
import type { LetterStatus } from "./types/game";

export default function App() {
  const [meuNome, setMeuNome] = useState("");
  const [inLobby, setInLobby] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoomName, setSelectedRoomName] = useState<string | null>(null);
  const [currentGuess, setCurrentGuess] = useState("");

  const { room, isConnected, sendGuess } = useGameSocket(
      meuNome,
      selectedRoomId,
      selectedRoomName,
      (Boolean(meuNome) && !inLobby)
  );

  const myPlayer = useMemo(() => {
    if (!room || !meuNome) return undefined;
    return room.players.find(p => p.name.toLowerCase() === meuNome.toLowerCase());
  }, [room, meuNome]);

  const myGuesses = myPlayer?.guesses || [];
  const myResults = (myPlayer?.results as LetterStatus[][][]) || [];

  const keyStatuses = useMemo(() => {
    const statuses: Record<string, LetterStatus> = {};
    if (!myPlayer) return statuses;
    myGuesses.forEach((word, wordIndex) => {
      const gridsResults = myResults[wordIndex];
      if (!gridsResults) return;
      const firstGridResult = gridsResults[0];
      if (!firstGridResult) return;
      word.split("").forEach((letter, letterIndex) => {
        const currentStatus = firstGridResult[letterIndex] as LetterStatus;
        if (statuses[letter] === "CORRECT") return;
        if (statuses[letter] === "PRESENT" && currentStatus === "ABSENT") return;
        statuses[letter] = currentStatus;
      });
    });
    return statuses;
  }, [myGuesses, myResults, myPlayer]);

  const handleKeyPress = (key: string) => {
    if (!myPlayer || room?.status !== "PLAYING" || !myPlayer.isAlive) return;
    const k = key.toUpperCase();
    if (k === 'ENTER') {
      if (currentGuess.length === 5) sendGuess(currentGuess);
    } else if (k === 'DELETE' || k === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5 && /^[A-Z]$/.test(k)) {
      setCurrentGuess(prev => prev + k);
    }
  };

  useEffect(() => { setCurrentGuess(""); }, [myGuesses.length]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!meuNome) return <Home onJoin={(n) => { setMeuNome(n); setInLobby(true); }} />;

  if (inLobby) return (
      <Lobby
          playerName={meuNome}
          onJoinRoom={(id) => { setSelectedRoomId(id); setInLobby(false); }}
          onCreateRoom={(n) => { setSelectedRoomName(n); setInLobby(false); }}
      />
  );

  if (!isConnected || !room) return (
      <div className="h-screen w-screen flex items-center justify-center bg-sky-200 font-black text-2xl animate-pulse">
        CONECTANDO À ARENA...
      </div>
  );

  if (room.status === "WAITING") return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-sky-200 bg-cover bg-center p-4"
           style={{ backgroundImage: "url('/bg-stadium.jpg')" }}>
        <div className="w-full max-w-2xl bg-slate-100/90 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white flex flex-col gap-6 text-center">
          <div>
            <span className="bg-slate-800 text-yellow-400 font-black px-4 py-1.5 rounded-full text-xs uppercase tracking-widest">Aguardando Competidores</span>
            <h2 className="text-4xl font-black text-slate-700 uppercase mt-3 tracking-wide">{room.name}</h2>
            <p className="text-slate-400 font-bold text-sm mt-1">ID da Sala: #{room.id}</p>
          </div>
          <div className="bg-slate-800 text-white rounded-2xl p-6 border-b-4 border-slate-950 shadow-inner">
            <span className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-1">A partida começa em</span>
            <span className="text-6xl font-black font-mono text-green-400 tracking-wider">{formatTime(room.timeLeft)}</span>
          </div>
          <div className="text-left">
            <h3 className="text-lg font-black text-slate-700 uppercase tracking-wider mb-3">Jogadores Confirmados ({room.players.length} / 20)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[30vh] overflow-y-auto pr-2">
              {room.players.map(player => (
                  <div key={player.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-black text-slate-700 uppercase tracking-wide">{player.name}</span>
                    {player.name.toLowerCase() === meuNome.toLowerCase() && <span className="text-xs font-bold text-sky-500 ml-auto">(Você)</span>}
                  </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  );

  if (!myPlayer) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">SINCRONIZANDO...</div>;

  return (
      <GameArena
          room={room}
          myPlayer={myPlayer}
          myGuesses={myGuesses}
          myResults={myResults}
          currentGuess={currentGuess}
          formatTime={formatTime}
          handleKeyPress={handleKeyPress}
          keyStatuses={keyStatuses}
          meuNome={meuNome}
      />
  );
}