"use client";

import { ShapeIcon } from "../../_lib/icons";
import type { Card as CardType } from "../../_lib/game";

interface CardProps {
  card: CardType;
  disabled: boolean;
  // Whole board revealed during the memorise phase; overrides per-card state.
  preview: boolean;
  onFlip: (id: number) => void;
}

export function Card({ card, disabled, preview, onFlip }: CardProps) {
  const faceUp = preview || card.isFlipped || card.isMatched;

  return (
    <button
      type="button"
      aria-label={faceUp ? `${card.shape} card` : "hidden card"}
      disabled={disabled || faceUp}
      onClick={() => onFlip(card.id)}
      className="group relative aspect-square w-full [perspective:900px] disabled:cursor-default enabled:cursor-pointer"
    >
      <div
        className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]"
        style={{ transform: faceUp ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        {/* Back (face down) */}
        <div className="absolute inset-0 [backface-visibility:hidden]">
          <div className="flex h-full w-full items-center justify-center rounded-lg border-[3px] border-black bg-black text-[#fffef5] transition-transform duration-150 group-enabled:group-hover:-translate-y-1 group-enabled:group-hover:shadow-[0_6px_0_rgba(0,0,0,0.25)]">
            <span className="font-roboto-slab text-[clamp(1.5rem,5vw,2.5rem)] font-black leading-none opacity-90">
              ?
            </span>
          </div>
        </div>

        {/* Front (face up) */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div
            className={`flex h-full w-full items-center justify-center rounded-lg border-[3px] p-[15%] transition-colors duration-300 ${
              card.isMatched
                ? "border-[#ef3d2f] bg-[#ef3d2f] text-[#fffef5]"
                : "border-black bg-[#fffef5] text-black"
            }`}
          >
            <ShapeIcon
              shape={card.shape}
              className={`h-full w-full ${
                card.isMatched ? "animate-[matchpop_0.4s_ease-out]" : ""
              }`}
            />
          </div>
        </div>
      </div>
    </button>
  );
}
