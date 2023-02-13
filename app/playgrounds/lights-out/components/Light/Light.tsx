import clsx from "clsx";

interface LightProps {
  onClick: () => void;
  isOn: boolean;
  isPlaying: boolean;
}

export function Light({ onClick, isOn, isPlaying }: LightProps) {
  return (
    <button
      className={clsx("h-16 w-16", {
        "bg-red-500": isOn,
        "bg-gray-500": !isOn,
        "cursor-pointer": isPlaying,
      })}
      onClick={onClick}
    ></button>
  );
}
