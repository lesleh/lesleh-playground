import clsx from "clsx";

interface LightProps {
  onClick: () => void;
  isOn: boolean;
  isPlaying: boolean;
  className?: string;
}

export function Light({ onClick, isOn, isPlaying, className }: LightProps) {
  return (
    <button
      className={clsx(
        "h-16 w-16 relative overflow-hidden transition-transform active:scale-95 active:brightness-75",
        className,
        {
          "bg-red-500": isOn,
          "bg-gray-500": !isOn,
          "cursor-pointer": isPlaying,
        },
      )}
      onClick={onClick}
    >
      <div
        className={clsx(
          "absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none transition-opacity",
          "active:opacity-50",
        )}
      />
    </button>
  );
}
