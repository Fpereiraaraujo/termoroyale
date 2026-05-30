import type { CSSProperties } from "react";
import type { LetterStatus } from "../types/game";

interface TileProps {
    letter: string;
    status: LetterStatus;
    isActive?: boolean;
    onClick?: () => void;
    animationDelay?: number;
}

export function Tile({
    letter,
    status,
    isActive,
    onClick,
    animationDelay = 0
}: TileProps) {

    const isRevealed =
        status === "CORRECT" ||
        status === "PRESENT" ||
        status === "ABSENT";

    let bgClass =
        "bg-slate-200/50 border-slate-300 border-2 text-transparent";

    if (status === "INITIAL") {
        bgClass =
            "bg-white border-slate-400 border-2 text-slate-800 shadow-sm";
    } else if (status === "CORRECT") {
        bgClass =
            "bg-green-500 border-green-600 text-white shadow-md";
    } else if (status === "PRESENT") {
        bgClass =
            "bg-yellow-500 border-yellow-600 text-white shadow-md";
    } else if (status === "ABSENT") {
        bgClass =
            "bg-slate-600 border-slate-700 text-white shadow-inner";
    }

    const activeRing = isActive
        ? "ring-4 ring-sky-400 ring-offset-1 scale-105"
        : "";

    const flipAnimation = isRevealed
        ? "animate-flip"
        : "";

    const style: CSSProperties = isRevealed
        ? { animationDelay: `${animationDelay}ms` }
        : {};

    return (
        <div
            onClick={onClick}
            style={style}
            className={`
                w-12 h-12
                md:w-14 md:h-14

                text-2xl
                md:text-3xl

                flex items-center justify-center
                font-black
                rounded-xl
                transition-all
                duration-150
                select-none
                cursor-pointer
                uppercase

                ${bgClass}
                ${activeRing}
                ${flipAnimation}
            `}
        >
            {letter}
        </div>
    );
}