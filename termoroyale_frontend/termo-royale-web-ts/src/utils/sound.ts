// Web Audio sintetizado — sem assets. Lazy AudioContext.
const MUTE_KEY = "termoroyale.muted";

let ctx: AudioContext | null = null;
let muted = (() => {
    try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; }
})();

function ensure(): AudioContext | null {
    if (muted) return null;
    if (!ctx) {
        try {
            const Ctor = window.AudioContext || (window as any).webkitAudioContext;
            ctx = new Ctor();
        } catch { return null; }
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
}

function tone(freq: number, durMs: number, type: OscillatorType = "sine", gain = 0.15, when = 0) {
    const c = ensure();
    if (!c) return;
    const start = c.currentTime + when;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + durMs / 1000);
    osc.connect(g).connect(c.destination);
    osc.start(start);
    osc.stop(start + durMs / 1000 + 0.02);
}

export const sound = {
    isMuted: () => muted,
    toggleMute: () => {
        muted = !muted;
        try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch {}
        return muted;
    },
    key: () => tone(420, 50, "square", 0.05),
    invalid: () => {
        tone(160, 120, "sawtooth", 0.18);
        tone(120, 160, "sawtooth", 0.15, 0.08);
    },
    correct: () => {
        tone(523, 90, "triangle", 0.18);
        tone(659, 110, "triangle", 0.18, 0.09);
        tone(784, 160, "triangle", 0.2, 0.20);
    },
    win: () => {
        tone(523, 120, "triangle", 0.2);
        tone(659, 120, "triangle", 0.2, 0.12);
        tone(784, 120, "triangle", 0.2, 0.24);
        tone(1046, 320, "triangle", 0.22, 0.36);
    },
    eliminate: () => {
        tone(330, 140, "sawtooth", 0.18);
        tone(220, 200, "sawtooth", 0.18, 0.12);
        tone(140, 260, "sawtooth", 0.18, 0.28);
    },
    tick: () => tone(880, 60, "square", 0.08),
};
