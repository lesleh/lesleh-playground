import { twMerge } from "tailwind-merge";
import { AriaRole } from "react";

interface LightProps {
  onClick: () => void;
  isOn: boolean;
  isPlaying: boolean;
  className?: string;
  role?: AriaRole;
  disabled?: boolean;
}

export function Light({ onClick, isOn, isPlaying, className }: LightProps) {
  return (
    <button
      disabled={!isPlaying}
      className={twMerge(
        "h-16 w-16 relative overflow-hidden transition-transform rounded",
        isOn && ["bg-red-500"],
        !isOn && "bg-gray-500",
        isPlaying && "cursor-pointer active:scale-95 active:brightness-75",
        !isPlaying && "cursor-default",
        className,
      )}
      onClick={onClick}
    >
      <div
        className={twMerge(
          "absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none transition-opacity",
          isPlaying && "active:opacity-50",
        )}
      />
    </button>
  );
}
