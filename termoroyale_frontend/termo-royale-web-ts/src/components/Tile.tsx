import type { CSSProperties } from "react";
import type { LetterStatus } from "../types/game";

export type TileSize = "sm" | "md" | "lg";

interface TileProps {
    letter: string;
    status: LetterStatus;
    isActive?: boolean;
    onClick?: () => void;
    animationDelay?: number;
    size?: TileSize;
}

const SIZE_CLASSES: Record<TileSize, string> = {
    sm: "w-8 h-8 md:w-9 md:h-9 text-lg md:text-xl rounded-md",
    md: "w-10 h-10 md:w-11 md:h-11 text-xl md:text-2xl rounded-lg",
    lg: "w-12 h-12 md:w-14 md:h-14 text-2xl md:text-3xl rounded-xl",
};

export function Tile({
    letter,
    status,
    isActive,
    onClick,
    animationDelay = 0,
    size = "lg"
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
            "bg-emerald-500 border-emerald-600 text-white shadow-md";
    } else if (status === "PRESENT") {
        bgClass =
            "bg-amber-500 border-amber-600 text-white shadow-md";
    } else if (status === "ABSENT") {
        bgClass =
            "bg-slate-500 border-slate-600 text-white shadow-inner";
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
                ${SIZE_CLASSES[size]}

                flex items-center justify-center
                font-black
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