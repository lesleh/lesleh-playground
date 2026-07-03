"use client";

// The classic Simon disc: a donut split into four coloured quadrants that light
// up. SVG paths give crisp, scalable, huge touch targets. Pointer events cover
// mouse and touch in one path.

const CX = 100;
const CY = 100;
const OUTER = 95;
const INNER = 36;
const GAP = 2.5; // degrees of gap between quadrants

// Annular sector path from startDeg to endDeg (SVG angles: 0 = east, clockwise).
function sector(startDeg: number, endDeg: number): string {
  const s = (startDeg * Math.PI) / 180;
  const e = (endDeg * Math.PI) / 180;
  const pt = (r: number, a: number) => [CX + r * Math.cos(a), CY + r * Math.sin(a)];
  const [x1, y1] = pt(OUTER, s);
  const [x2, y2] = pt(OUTER, e);
  const [x3, y3] = pt(INNER, e);
  const [x4, y4] = pt(INNER, s);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${x1} ${y1}`,
    `A ${OUTER} ${OUTER} 0 ${large} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${INNER} ${INNER} 0 ${large} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}

interface PadDef {
  base: string;
  lit: string;
  start: number;
  end: number;
}

// Classic layout: green top-left, red top-right, yellow bottom-left, blue
// bottom-right. Angles run clockwise from east with y pointing down.
const PADS: PadDef[] = [
  { base: "#15803d", lit: "#4ade80", start: 180, end: 270 }, // 0 green (top-left)
  { base: "#b91c1c", lit: "#f87171", start: 270, end: 360 }, // 1 red (top-right)
  { base: "#a16207", lit: "#fde047", start: 90, end: 180 }, //  2 yellow (bottom-left)
  { base: "#1d4ed8", lit: "#60a5fa", start: 0, end: 90 }, //    3 blue (bottom-right)
];

interface DiscProps {
  lit: number | null;
  onPad: (pad: number) => void;
  onRelease?: (pad: number) => void;
  disabled?: boolean;
  hub?: React.ReactNode;
}

export function Disc({ lit, onPad, onRelease, disabled = false, hub }: DiscProps) {
  return (
    <div
      className="relative aspect-square w-full max-w-[min(80vw,26rem)] select-none"
      style={{
        touchAction: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <svg
        viewBox="0 0 200 200"
        className="h-full w-full drop-shadow-2xl"
        style={{ touchAction: "none", WebkitTapHighlightColor: "transparent" }}
      >
        {PADS.map((pad, i) => {
          const isLit = lit === i;
          return (
            <path
              key={i}
              d={sector(pad.start + GAP, pad.end - GAP)}
              fill={isLit ? pad.lit : pad.base}
              stroke="#0b0b12"
              strokeWidth={2}
              onPointerDown={(e) => {
                if (disabled) return;
                e.preventDefault();
                // Capture so we reliably get pointerup on this pad (esp. touch).
                e.currentTarget.setPointerCapture?.(e.pointerId);
                onPad(i);
              }}
              onPointerUp={() => onRelease?.(i)}
              onPointerCancel={() => onRelease?.(i)}
              onPointerLeave={() => onRelease?.(i)}
              style={{
                cursor: disabled ? "default" : "pointer",
                pointerEvents: disabled ? "none" : "auto",
                filter: isLit ? "brightness(1.15)" : "brightness(0.92)",
                transition: "fill 90ms linear, filter 90ms linear",
              }}
              aria-label={["green", "red", "yellow", "blue"][i]}
            />
          );
        })}
        {/* Hub ring */}
        <circle cx={CX} cy={CY} r={INNER - 2} fill="#0b0b12" stroke="#2a2a38" strokeWidth={2} />
      </svg>

      {/* Hub content overlay (crisp HTML text). */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center">{hub}</div>
      </div>
    </div>
  );
}
