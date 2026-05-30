// Gera uma cor estável a partir do nome do jogador (avatar circle)
const PALETTE = [
    { bg: "bg-sky-500", ring: "ring-sky-300" },
    { bg: "bg-rose-500", ring: "ring-rose-300" },
    { bg: "bg-emerald-500", ring: "ring-emerald-300" },
    { bg: "bg-amber-500", ring: "ring-amber-300" },
    { bg: "bg-violet-500", ring: "ring-violet-300" },
    { bg: "bg-pink-500", ring: "ring-pink-300" },
    { bg: "bg-cyan-500", ring: "ring-cyan-300" },
    { bg: "bg-orange-500", ring: "ring-orange-300" },
    { bg: "bg-lime-500", ring: "ring-lime-300" },
    { bg: "bg-fuchsia-500", ring: "ring-fuchsia-300" },
];

function hash(name: string): number {
    let h = 0;
    for (let i = 0; i < name.length; i++) {
        h = ((h << 5) - h) + name.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

export function avatarFor(name: string) {
    const idx = hash(name.toLowerCase()) % PALETTE.length;
    const initials = name.slice(0, 2).toUpperCase();
    return { ...PALETTE[idx], initials };
}
