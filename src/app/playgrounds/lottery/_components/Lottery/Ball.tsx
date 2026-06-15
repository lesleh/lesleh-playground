import { twMerge } from "tailwind-merge";
import { ballColor, INK } from "../../_lib/ballColors";

type BallSize = "sm" | "md" | "lg";

interface BallProps {
  value: number;
  size?: BallSize;
  /** Pulses a coloured halo — used for matched draw balls. */
  matched?: boolean;
  /** Drops saturation/opacity for non-winning draw balls. */
  faded?: boolean;
  /** Wraps the sphere in a gold collar for the bonus ball. */
  bonus?: boolean;
  /** Stagger index; when set the ball tumbles in on mount. */
  dropIndex?: number;
}

const sizeMap: Record<BallSize, { box: string; text: string }> = {
  sm: { box: "w-8 h-8", text: "text-[11px]" },
  md: { box: "w-12 h-12", text: "text-base" },
  lg: { box: "w-16 h-16", text: "text-2xl" },
};

export function Ball({
  value,
  size = "md",
  matched = false,
  faded = false,
  bonus = false,
  dropIndex,
}: BallProps) {
  const c = ballColor(value);
  const s = sizeMap[size];
  const dropping = dropIndex !== undefined;

  return (
    <span
      className={twMerge(
        "relative inline-grid place-items-center rounded-full select-none",
        s.box,
        bonus && "ring-2 ring-[#e9c66a] ring-offset-2 ring-offset-transparent",
        faded && "opacity-45 saturate-50",
        dropping && "animate-[ball-drop_0.6s_cubic-bezier(0.2,0.7,0.3,1.4)_both]",
        matched && "animate-[ball-glow_1.9s_ease-in-out_infinite]"
      )}
      style={{
        backgroundImage: `radial-gradient(circle at 33% 27%, ${c.from} 0%, ${c.to} 68%, ${c.to} 100%)`,
        boxShadow: matched
          ? `0 6px 16px rgba(0,0,0,0.55), 0 0 22px 3px ${c.glow}`
          : "0 6px 16px rgba(0,0,0,0.55), inset 0 -4px 8px rgba(0,0,0,0.35), inset 0 3px 6px rgba(255,255,255,0.35)",
        ["--ball-glow" as string]: c.glow,
        animationDelay: dropping ? `${dropIndex * 110}ms` : undefined,
        color: INK,
      }}
    >
      {/* specular highlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-[18%] top-[14%] h-[28%] w-[34%] rounded-full bg-white/75 blur-[2px]"
      />
      {bonus && (
        <span
          aria-hidden
          className="font-ticker absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[7px] uppercase tracking-[0.25em] text-[#e9c66a]"
        >
          bonus
        </span>
      )}
      <span className={twMerge("font-ticker relative font-bold tabular-nums", s.text)}>
        {value}
      </span>
    </span>
  );
}
