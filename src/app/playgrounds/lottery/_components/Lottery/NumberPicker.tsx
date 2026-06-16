import { twMerge } from "tailwind-merge";
import { POOL_SIZE, PICK } from "../../_lib/lottery";
import { ballColor, INK } from "../../_lib/ballColors";

interface NumberPickerProps {
  ticket: number[];
  onToggle: (n: number) => void;
  disabled?: boolean;
}

const NUMBERS = Array.from({ length: POOL_SIZE }, (_, i) => i + 1);

export function NumberPicker({ ticket, onToggle, disabled }: NumberPickerProps) {
  const selected = new Set(ticket);
  const full = ticket.length >= PICK;

  return (
    <div className="grid grid-cols-10 gap-1.5">
      {NUMBERS.map((n) => {
        const isSelected = selected.has(n);
        const isDisabled = disabled || (full && !isSelected);
        const c = ballColor(n);
        return (
          <button
            key={n}
            type="button"
            onClick={() => onToggle(n)}
            disabled={isDisabled}
            aria-pressed={isSelected}
            className={twMerge(
              "font-ticker relative grid aspect-square place-items-center rounded-full text-[11px] font-medium tabular-nums transition-all duration-150",
              isSelected
                ? "scale-105 font-bold"
                : "border border-[#f3e9d2]/12 text-[#f3e9d2]/45 hover:-translate-y-0.5 hover:border-[#f3e9d2]/40 hover:text-[#f3e9d2]",
              isDisabled && !isSelected && "cursor-not-allowed opacity-25 hover:translate-y-0 hover:border-[#f3e9d2]/12 hover:text-[#f3e9d2]/45"
            )}
            style={
              isSelected
                ? {
                    backgroundImage: `radial-gradient(circle at 34% 28%, ${c.from} 0%, ${c.to} 70%)`,
                    color: INK,
                    boxShadow: `0 2px 8px rgba(0,0,0,0.5), 0 0 12px 1px ${c.glow}`,
                  }
                : undefined
            }
          >
            {isSelected && (
              <span
                aria-hidden
                className="pointer-events-none absolute left-[20%] top-[16%] h-[26%] w-[30%] rounded-full bg-white/70 blur-[1.5px]"
              />
            )}
            <span className="relative">{n}</span>
          </button>
        );
      })}
    </div>
  );
}
