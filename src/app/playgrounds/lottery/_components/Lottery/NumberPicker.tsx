import { twMerge } from "tailwind-merge";
import { POOL_SIZE, PICK } from "../../_lib/lottery";

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
        return (
          <button
            key={n}
            type="button"
            onClick={() => onToggle(n)}
            disabled={isDisabled}
            aria-pressed={isSelected}
            className={twMerge(
              "aspect-square rounded-full border-2 border-black font-mono text-xs font-bold tabular-nums transition-transform",
              isSelected
                ? "bg-black text-[#fffef5] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                : "bg-white text-black hover:bg-lime-200",
              !isDisabled && "hover:-translate-y-0.5 active:translate-y-0",
              isDisabled && !isSelected && "opacity-30 cursor-not-allowed hover:bg-white"
            )}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
