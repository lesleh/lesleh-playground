export type ColorListProps = {
  colors: string[];
  onRemove?: (index: number) => void;
  onColorChange?: (index: number, color: string) => void;
  addColor?: (color: string) => void;
};

export function ColorList({
  colors,
  onRemove,
  onColorChange,
  addColor,
}: ColorListProps) {
  return (
    <div className="flex flex-wrap flex-col gap-2 mt-4 ">
      {colors.map((color, index) => (
        <div
          key={index}
          className="flex items-center rounded p-2 gap-2 border-solid border-neutral-300 border"
        >
          <input
            type="color"
            value={color}
            onChange={(e) => onColorChange?.(index, e.target.value)}
          />
          <span className="text-xs font-mono">{color}</span>
          <button
            className="ml-auto text-2xl"
            onClick={() => onRemove?.(index)}
          >
            &times;
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => addColor?.(randomColor())}
        className="btn"
      >
        Add Color
      </button>
    </div>
  );
}

function randomColor() {
  const r = Math.floor(Math.random() * 256)
    .toString(16)
    .padStart(2, "0");
  const g = Math.floor(Math.random() * 256)
    .toString(16)
    .padStart(2, "0");
  const b = Math.floor(Math.random() * 256)
    .toString(16)
    .padStart(2, "0");

  return `#${r}${g}${b}`;
}
