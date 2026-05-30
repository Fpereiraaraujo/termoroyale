import { useState } from "react";

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (roomName: string, maxPlayers: number, isPrivate: boolean) => void;
}

export function CreateRoomModal({ isOpen, onClose, onCreate }: CreateRoomModalProps) {
    const [roomName, setRoomName] = useState("");
    const [maxPlayers, setMaxPlayers] = useState(20);
    const [isPrivate, setIsPrivate] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border-t-2 sm:border-2 border-white max-h-[90vh] flex flex-col">

                <div className="bg-slate-800 p-5 sm:p-6 text-center relative shrink-0">
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-widest">Criar Sala</h3>
                    <button
                        onClick={onClose}
                        className="absolute top-5 sm:top-6 right-5 sm:right-6 text-slate-400 hover:text-white font-black transition-colors p-1"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 sm:p-8 flex flex-col gap-5 sm:gap-6 overflow-y-auto">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nome da Sala</label>
                        <input
                            type="text"
                            autoFocus
                            value={roomName}
                            placeholder="Ex: Torneio do Fernando"
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white transition-all text-sm sm:text-base placeholder:font-normal placeholder:text-slate-400"
                            onChange={(e) => setRoomName(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Quantidade de Jogadores</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="2"
                                max="30"
                                value={maxPlayers}
                                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                                className="flex-1 accent-sky-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="bg-sky-100 text-sky-700 font-black px-3 sm:px-4 py-2 rounded-lg w-14 sm:w-16 text-center text-sm sm:text-base">
                                {maxPlayers}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Visibilidade</label>
                        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                            <button
                                onClick={() => setIsPrivate(false)}
                                className={`flex-1 py-2.5 sm:py-3 rounded-lg font-black text-xs sm:text-sm uppercase tracking-wider transition-all ${!isPrivate ? 'bg-white text-sky-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Público
                            </button>
                            <button
                                onClick={() => setIsPrivate(true)}
                                className={`flex-1 py-2.5 sm:py-3 rounded-lg font-black text-xs sm:text-sm uppercase tracking-wider transition-all ${isPrivate ? 'bg-white text-sky-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Privado
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            const finalName = roomName.trim() || `Arena Royale #${Math.floor(Math.random() * 1000)}`;
                            onCreate(finalName, maxPlayers, isPrivate);
                            onClose();
                        }}
                        className="w-full bg-green-500 hover:bg-green-400 text-white font-black px-6 py-3.5 sm:py-4 rounded-xl uppercase tracking-widest transition-all hover:shadow-lg active:scale-95 text-sm sm:text-base mt-2 shrink-0 shadow-md"
                    >
                        Confirmar Partida
                    </button>
                </div>
            </div>
        </div>
    );
}