import { useState } from "react";

interface HomeProps {
    onJoin: (playerName: string) => void;
}

export function Home({ onJoin }: HomeProps) {
    const [name, setName] = useState("");

    const handleEnter = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim().length > 2) {
            onJoin(name.trim());
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-sky-200 bg-cover bg-center"
             style={{ backgroundImage: "url('/bg-stadium.jpg')" }}>

            {/* O Logo Idêntico ao do Jogo */}
            <div className="bg-slate-900 px-8 py-4 rounded-xl border-4 border-slate-800 shadow-2xl mb-12 transform -rotate-2">
                <h1 className="text-5xl font-black text-white tracking-widest leading-none">TERMO</h1>
                <h1 className="text-5xl font-black text-yellow-400 tracking-widest leading-none">ROYALE</h1>
            </div>

            {/* Painel Central no estilo do Board */}
            <div className="bg-slate-100/90 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white w-full max-w-md flex flex-col gap-6">
                <div className="text-center">
                    <h2 className="text-2xl font-black text-slate-700 uppercase tracking-widest">Identifique-se</h2>
                    <p className="text-slate-500 font-medium mt-1">Como você será chamado na arena?</p>
                </div>

                <form onSubmit={handleEnter} className="flex flex-col gap-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Fernando_Dev"
                        maxLength={15}
                        className="w-full text-center text-2xl font-bold text-slate-700 bg-white border-2 border-slate-300 rounded-xl p-4 focus:outline-none focus:border-green-500 transition-colors uppercase placeholder:text-slate-300 placeholder:normal-case"
                    />

                    <button
                        type="submit"
                        disabled={name.trim().length < 3}
                        className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-400 text-white font-black text-xl py-4 rounded-xl shadow-md transition-all uppercase tracking-widest mt-2 active:scale-95"
                    >
                        Entrar no Lobby
                    </button>
                </form>
            </div>
        </div>
    );
}