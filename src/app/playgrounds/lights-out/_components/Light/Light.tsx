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
      disabled={!isPlaying}
      className={clsx(
        "h-16 w-16 relative overflow-hidden transition-transform",
        {
          "bg-red-500": isOn,
          "bg-gray-500": !isOn,
          "cursor-pointer active:scale-95 active:brightness-75": isPlaying,
          "cursor-default": !isPlaying,
        },
        className,
      )}
      onClick={onClick}
    >
      <div
        className={clsx(
          "absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none transition-opacity",
          {
            "active:opacity-50": isPlaying,
          },
        )}
      />
    </button>
  );
}
