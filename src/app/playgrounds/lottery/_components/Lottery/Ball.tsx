import { twMerge } from "tailwind-merge";

type BallVariant = "default" | "matched" | "bonus" | "bonusMatched" | "ticket";

interface BallProps {
  value: number;
  variant?: BallVariant;
  size?: "sm" | "md";
  /** Stagger index used to delay the pop-in animation. */
  popIndex?: number;
}

const variantClasses: Record<BallVariant, string> = {
  default: "bg-white text-black",
  ticket: "bg-black text-[#fffef5]",
  matched: "bg-lime-300 text-black",
  bonus: "bg-amber-200 text-black",
  bonusMatched: "bg-amber-400 text-black",
};

export function Ball({ value, variant = "default", size = "md", popIndex }: BallProps) {
  const animate = popIndex !== undefined;
  return (
    <span
      className={twMerge(
        "inline-flex items-center justify-center rounded-full border-2 border-black font-mono font-bold tabular-nums shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
        size === "md" ? "w-11 h-11 text-base" : "w-8 h-8 text-xs",
        variantClasses[variant],
        animate && "animate-[ball-pop_0.35s_ease-out_both]"
      )}
      style={animate ? { animationDelay: `${popIndex * 90}ms` } : undefined}
    >
      {value}
    </span>
  );
}
