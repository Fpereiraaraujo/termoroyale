export function playVictorySound() {
    try {
        type WindowWithAudio = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
        const w = window as WindowWithAudio;
        const Ctx = w.AudioContext || w.webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const tone = (freq: number, start: number, dur: number, type: OscillatorType = "triangle", vol = 0.18) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            const t0 = ctx.currentTime + start;
            gain.gain.setValueAtTime(0, t0);
            gain.gain.linearRampToValueAtTime(vol, t0 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
            osc.connect(gain).connect(ctx.destination);
            osc.start(t0);
            osc.stop(t0 + dur + 0.05);
        };
        // Fanfarra ascendente: C5 E5 G5 C6
        const seq = [523.25, 659.25, 783.99, 1046.5];
        seq.forEach((f, i) => tone(f, i * 0.12, 0.45));
        // Acorde final sustentado
        [523.25, 659.25, 783.99].forEach(f => tone(f, 0.62, 1.4, "sine", 0.12));
        // Aplauso (ruído branco decrescente)
        const noise = ctx.createBufferSource();
        const buf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
        }
        noise.buffer = buf;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.08, ctx.currentTime + 0.62);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
        noise.connect(noiseGain).connect(ctx.destination);
        noise.start(ctx.currentTime + 0.62);
        noise.stop(ctx.currentTime + 2.0);
    } catch {
        /* ignore */
    }
}
