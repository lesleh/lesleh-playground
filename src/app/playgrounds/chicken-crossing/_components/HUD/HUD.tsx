"use client";

import type { Phase } from "../GameCanvas";

// A tiny pixel chicken for the lives counter.
function ChickenIcon({ dimmed = false }: { dimmed?: boolean }) {
  return (
    <svg
      viewBox="0 0 11 12"
      className="h-4 w-4"
      style={{ imageRendering: "pixelated", opacity: dimmed ? 0.2 : 1 }}
      aria-hidden
    >
      <g shapeRendering="crispEdges">
        <rect x="4" y="0" width="3" height="2" fill="#e23b3b" />
        <rect x="3" y="1" width="5" height="1" fill="#e23b3b" />
        <rect x="4" y="2" width="3" height="1" fill="#f5a623" />
        <rect x="2" y="3" width="7" height="5" fill="#fdfdfd" />
        <rect x="1" y="5" width="9" height="3" fill="#fdfdfd" />
        <rect x="3" y="5" width="1" height="1" fill="#1e1e24" />
        <rect x="7" y="5" width="1" height="1" fill="#1e1e24" />
        <rect x="3" y="10" width="1" height="2" fill="#f5a623" />
        <rect x="7" y="10" width="1" height="2" fill="#f5a623" />
      </g>
    </svg>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col leading-none">
      <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">
        {label}
      </span>
      <span className="font-mono text-lg font-bold tabular-nums text-white">{value}</span>
    </div>
  );
}

function ArcadeButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 border-2 border-[#ffd23f] bg-[#ffd23f] px-6 py-2 font-mono text-sm font-bold uppercase tracking-widest text-[#14141c] transition-transform hover:scale-105 active:scale-95"
    >
      {children}
    </button>
  );
}

const MAX_LIVES = 3;

export function HudBar({
  level,
  lives,
  score,
  best,
}: {
  level: number;
  lives: number;
  score: number;
  best: number;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-b-2 border-white/10 px-4 py-2">
      <div className="flex items-center gap-5">
        <Stat label="Level" value={level} />
        <Stat label="Score" value={score} />
        <Stat label="Best" value={best} />
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: MAX_LIVES }, (_, i) => (
          <ChickenIcon key={i} dimmed={i >= lives} />
        ))}
      </div>
    </div>
  );
}

interface OverlayProps {
  phase: Phase;
  level: number;
  lives: number;
  score: number;
  best: number;
  isNewBest: boolean;
  deathReason: "crash" | "time" | null;
  onPrimaryAction: () => void;
}

export function GameOverlay({
  phase,
  level,
  lives,
  score,
  best,
  isNewBest,
  deathReason,
  onPrimaryAction,
}: OverlayProps) {
  if (phase === "playing") return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 p-4 text-center backdrop-blur-[1px]">
      <div className="flex flex-col items-center">
        {phase === "ready" && (
          <>
            <h1 className="font-roboto-slab text-4xl font-black text-white drop-shadow-[3px_3px_0_#e23b3b] sm:text-5xl">
              FOWL PLAY
            </h1>
            <p className="mt-3 max-w-xs font-mono text-xs leading-relaxed text-white/70">
              Get the chicken across the road. Dodge the bikes. Beat the clock.
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-white/40">
              Arrows / WASD / swipe · tap to hop
            </p>
            <ArcadeButton onClick={onPrimaryAction}>Start</ArcadeButton>
          </>
        )}

        {phase === "dead" && (
          <div className="rounded bg-[#e23b3b]/90 px-6 py-3">
            <p className="font-roboto-slab text-3xl font-black text-white">
              {deathReason === "time" ? "TIME!" : "SPLAT!"}
            </p>
            <p className="mt-1 font-mono text-xs uppercase tracking-widest text-white/80">
              Lives left: {lives}
            </p>
          </div>
        )}

        {phase === "levelComplete" && (
          <>
            <p className="font-mono text-xs uppercase tracking-widest text-[#7bd66b]">
              Made it across
            </p>
            <h2 className="mt-1 font-roboto-slab text-4xl font-black text-white">
              Level {level} cleared
            </h2>
            <p className="mt-2 font-mono text-sm text-white/70">
              Score: <span className="font-bold text-white">{score}</span>
            </p>
            <ArcadeButton onClick={onPrimaryAction}>Next level</ArcadeButton>
          </>
        )}

        {phase === "gameOver" && (
          <>
            <h2 className="font-roboto-slab text-5xl font-black text-[#e23b3b] drop-shadow-[3px_3px_0_#14141c]">
              GAME OVER
            </h2>
            <p className="mt-3 font-mono text-sm text-white/70">
              Final score: <span className="font-bold text-white">{score}</span>
            </p>
            <p className="font-mono text-sm text-white/70">
              Best: <span className="font-bold text-white">{best}</span>
            </p>
            {isNewBest && (
              <p className="mt-2 font-mono text-xs font-bold uppercase tracking-widest text-[#ffd23f]">
                ★ New best ★
              </p>
            )}
            <ArcadeButton onClick={onPrimaryAction}>Play again</ArcadeButton>
          </>
        )}
      </div>
    </div>
  );
}
