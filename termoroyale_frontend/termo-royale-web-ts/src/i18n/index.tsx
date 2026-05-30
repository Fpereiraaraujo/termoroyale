import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "pt" | "en";

const STORAGE_KEY = "termoroyale.lang";

const dict = {
    pt: {
        // Home
        "home.title": "Identifique-se",
        "home.subtitle": "Como você será chamado na arena?",
        "home.placeholder": "Ex: Fernando_Dev",
        "home.enter": "Entrar no Lobby",

        // Stats
        "stats.games": "Jogos",
        "stats.wins": "Vitórias",
        "stats.winrate": "Win %",
        "stats.streak": "Streak",
        "stats.best": "Recorde",

        // Lobby
        "lobby.title": "Lobby Principal",
        "lobby.welcome": "Bem-vindo,",
        "lobby.create": "Criar Sala",
        "lobby.empty": "Nenhuma sala disponível no momento. Crie a sua no botão acima!",

        // RoomListItem
        "room.players": "Jogadores",
        "room.waiting": "Aguardando",
        "room.playing": "Em Jogo",
        "room.join": "Entrar",

        // CreateRoomModal
        "create.title": "Criar Sala",
        "create.name": "Nome da Sala",
        "create.namePlaceholder": "Ex: Torneio do Fernando",
        "create.players": "Quantidade de Jogadores",
        "create.visibility": "Visibilidade",
        "create.public": "Público",
        "create.private": "Privado",
        "create.confirm": "Confirmar Partida",
        "create.defaultName": "Arena Royale",

        // Waiting room
        "waiting.badge": "Aguardando Competidores",
        "waiting.link": "Link da Sala:",
        "waiting.starts": "A partida começa em",
        "waiting.confirmed": "Confirmados",
        "waiting.you": "VOCÊ",

        // Game / Arena
        "game.syncing": "SINCRONIZANDO...",
        "game.youGotIt": "Você Acertou!",
        "game.waitingQuota": "Aguardando a cota de classificados...",

        // Scoreboard
        "scoreboard.time": "Tempo",
        "scoreboard.ended": "Encerrado",
        "scoreboard.howToPlay": "Como jogar",
        "scoreboard.soundOn": "Som ligado",
        "scoreboard.soundOff": "Som desligado",

        // Rules
        "rules.title": "Como jogar",
        "rules.subtitle": "Termo Royale",
        "rules.goal.title": "Objetivo",
        "rules.goal.body": "Adivinhe a palavra de 5 letras antes dos outros. Quem resolver primeiro vence a fase.",
        "rules.colors.title": "Cores",
        "rules.colors.green": "letra certa no lugar certo,",
        "rules.colors.yellow": "letra na palavra mas em outra posição,",
        "rules.colors.gray": "letra não está.",
        "rules.phases.title": "3 Fases",
        "rules.phases.body": "R1 Termo (1 palavra) → R2 Duo (2 simultâneas) → R3 Quarteto (4 simultâneas). A cada fase as palavras ficam mais difíceis.",
        "rules.sudden.title": "Morte súbita (R3)",
        "rules.sudden.body": "Na última fase, quem erra é eliminado da rodada. Sobreviva e seja o mais rápido.",
        "rules.lives.title": "Vidas",
        "rules.lives.body": "Você tem 6 tentativas por fase. Esgotou? Vira espectador.",
        "rules.reactions.title": "Reações",
        "rules.reactions.body": "Use os emojis acima do teclado para reagir em tempo real para toda a sala.",
        "rules.close": "Bora jogar",

        // Connection
        "connection.reconnecting": "Reconectando...",

        // Event feed
        "events.solvedIn": "resolveu em",
        "events.solved": "resolveu",
        "events.eliminated": "foi eliminado",

        // Ranking
        "ranking.title": "Ranking",
        "ranking.you": "Você",
        "ranking.playing": "Jogando...",
        "ranking.out": "Fora",
        "ranking.won": "Venceu",

        // Spectator
        "spectator.eliminatedTitle": "Eliminado",
        "spectator.waitingNext": "Aguardando próxima sala.",
        "spectator.modeTitle": "Modo Espectador",
        "spectator.modeSubtitle": "Você foi eliminado — acompanhe quem ainda está na disputa",
        "spectator.aliveOne": "vivo",
        "spectator.aliveMany": "vivos",
        "spectator.solved": "Resolveu",

        // Victory
        "victory.noWinner": "Sem Vencedor",
        "victory.arenaGoat": "GOAT da Arena",
        "victory.youAreChampion": "VOCÊ É O CAMPEÃO!",
        "victory.congrats": "Parabéns ao campeão da arena",
        "victory.rounds": "Fases",
        "victory.totalTime": "Tempo Total",
        "victory.attempts": "Tentativas",
        "victory.matchWords": "Palavras da Partida",
        "victory.podium": "Pódio Final",
        "victory.hallOfFame": "Hall of Fame — Últimos 5 GOATs",
        "victory.share": "Compartilhar",
        "victory.copied": "✓ Copiado!",
        "victory.rematch": "⚔ Revanche",
        "victory.lobby": "Lobby",
        "victory.footer": "Sala #{id} · {count} competidores",
        "victory.shareText": "🐐 {name} é o GOAT do TERMO ROYALE! Jogue em {url}",
        "victory.shareTextFallback": "Alguém",
    },
    en: {
        "home.title": "Who are you?",
        "home.subtitle": "What name will you go by in the arena?",
        "home.placeholder": "E.g. Player_One",
        "home.enter": "Enter Lobby",

        "stats.games": "Games",
        "stats.wins": "Wins",
        "stats.winrate": "Win %",
        "stats.streak": "Streak",
        "stats.best": "Best",

        "lobby.title": "Main Lobby",
        "lobby.welcome": "Welcome,",
        "lobby.create": "Create Room",
        "lobby.empty": "No rooms available right now. Create yours above!",

        "room.players": "Players",
        "room.waiting": "Waiting",
        "room.playing": "Playing",
        "room.join": "Join",

        "create.title": "Create Room",
        "create.name": "Room Name",
        "create.namePlaceholder": "E.g. Friday Tournament",
        "create.players": "Number of Players",
        "create.visibility": "Visibility",
        "create.public": "Public",
        "create.private": "Private",
        "create.confirm": "Confirm Match",
        "create.defaultName": "Royale Arena",

        "waiting.badge": "Waiting for Players",
        "waiting.link": "Room link:",
        "waiting.starts": "Match starts in",
        "waiting.confirmed": "Confirmed",
        "waiting.you": "YOU",

        "game.syncing": "SYNCING...",
        "game.youGotIt": "You got it!",
        "game.waitingQuota": "Waiting for qualifier quota...",

        "scoreboard.time": "Time",
        "scoreboard.ended": "Ended",
        "scoreboard.howToPlay": "How to play",
        "scoreboard.soundOn": "Sound on",
        "scoreboard.soundOff": "Sound off",

        "rules.title": "How to play",
        "rules.subtitle": "Termo Royale",
        "rules.goal.title": "Goal",
        "rules.goal.body": "Guess the 5-letter word before others. Whoever solves it first wins the round.",
        "rules.colors.title": "Colors",
        "rules.colors.green": "right letter in the right spot,",
        "rules.colors.yellow": "letter is in the word but in another spot,",
        "rules.colors.gray": "letter is not in the word.",
        "rules.phases.title": "3 Phases",
        "rules.phases.body": "R1 Termo (1 word) → R2 Duo (2 at once) → R3 Quartet (4 at once). Words get harder each phase.",
        "rules.sudden.title": "Sudden Death (R3)",
        "rules.sudden.body": "In the final phase, whoever misses is eliminated. Survive and be the fastest.",
        "rules.lives.title": "Lives",
        "rules.lives.body": "You have 6 attempts per phase. Used them all? You become a spectator.",
        "rules.reactions.title": "Reactions",
        "rules.reactions.body": "Use the emojis above the keyboard to react in real time for the whole room.",
        "rules.close": "Let's play",

        "connection.reconnecting": "Reconnecting...",

        "events.solvedIn": "solved in",
        "events.solved": "solved",
        "events.eliminated": "was eliminated",

        "ranking.title": "Ranking",
        "ranking.you": "You",
        "ranking.playing": "Playing...",
        "ranking.out": "Out",
        "ranking.won": "Won",

        "spectator.eliminatedTitle": "Eliminated",
        "spectator.waitingNext": "Waiting for next room.",
        "spectator.modeTitle": "Spectator Mode",
        "spectator.modeSubtitle": "You were eliminated — watch who's still in the game",
        "spectator.aliveOne": "alive",
        "spectator.aliveMany": "alive",
        "spectator.solved": "Solved",

        "victory.noWinner": "No Winner",
        "victory.arenaGoat": "Arena GOAT",
        "victory.youAreChampion": "YOU ARE THE CHAMPION!",
        "victory.congrats": "Congrats to the arena champion",
        "victory.rounds": "Rounds",
        "victory.totalTime": "Total Time",
        "victory.attempts": "Attempts",
        "victory.matchWords": "Match Words",
        "victory.podium": "Final Podium",
        "victory.hallOfFame": "Hall of Fame — Last 5 GOATs",
        "victory.share": "Share",
        "victory.copied": "✓ Copied!",
        "victory.rematch": "⚔ Rematch",
        "victory.lobby": "Lobby",
        "victory.footer": "Room #{id} · {count} competitors",
        "victory.shareText": "🐐 {name} is the GOAT of TERMO ROYALE! Play at {url}",
        "victory.shareTextFallback": "Someone",
    },
} as const;

export type TranslationKey = keyof typeof dict.pt;

interface I18nCtx {
    lang: Lang;
    setLang: (l: Lang) => void;
    t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

function detectInitial(): Lang {
    try {
        const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
        if (saved === "pt" || saved === "en") return saved;
    } catch {}
    const nav = (navigator.language || "pt").toLowerCase();
    return nav.startsWith("pt") ? "pt" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Lang>(detectInitial);

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
        document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
    }, [lang]);

    const setLang = (l: Lang) => setLangState(l);

    const t = (key: TranslationKey, vars?: Record<string, string | number>): string => {
        let s = (dict[lang][key] ?? dict.pt[key] ?? key) as string;
        if (vars) {
            for (const k of Object.keys(vars)) {
                s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k]));
            }
        }
        return s;
    };

    return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
    const v = useContext(Ctx);
    if (!v) throw new Error("useI18n must be used inside I18nProvider");
    return v;
}

interface SwitcherProps {
    className?: string;
}

export function LanguageSwitcher({ className = "" }: SwitcherProps) {
    const { lang, setLang } = useI18n();
    const base = "w-9 h-9 rounded-full border-2 text-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-md";
    const active = "border-yellow-400 ring-2 ring-yellow-400/60";
    const inactive = "border-slate-600 opacity-60 hover:opacity-100";
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <button
                onClick={() => setLang("pt")}
                className={`${base} bg-slate-800 ${lang === "pt" ? active : inactive}`}
                title="Português"
                aria-label="Português"
            >🇧🇷</button>
            <button
                onClick={() => setLang("en")}
                className={`${base} bg-slate-800 ${lang === "en" ? active : inactive}`}
                title="English"
                aria-label="English"
            >🇺🇸</button>
        </div>
    );
}
