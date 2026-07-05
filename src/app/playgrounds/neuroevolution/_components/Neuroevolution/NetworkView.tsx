"use client";

import { useMemo } from "react";
import type { Network } from "../../_lib/nn";

const W = 240;
const H = 200;
const PAD_X = 34;
const PAD_Y = 18;

const INPUT_LABELS = ["L60", "L30", "fwd", "R30", "R60", "spd"];
const OUTPUT_LABELS = ["steer", "gas"];

// Draws the leader's brain: nodes in columns, edges tinted by weight sign and
// weighted by magnitude. Positive = cyan, negative = red.
export function NetworkView({ net }: { net: Network | null }) {
  const layout = useMemo(() => (net ? buildLayout(net) : null), [net]);

  if (!layout) {
    return (
      <div className="flex h-[200px] items-center justify-center font-mono text-[11px] uppercase tracking-widest text-white/30">
        no leader yet
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Leader neural network">
      {layout.edges.map((e, i) => (
        <line
          key={i}
          x1={e.x1}
          y1={e.y1}
          x2={e.x2}
          y2={e.y2}
          stroke={e.positive ? "#38bdf8" : "#ef3d2f"}
          strokeWidth={e.width}
          strokeOpacity={e.opacity}
        />
      ))}
      {layout.nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={5} fill="#0d0d0d" stroke="#fffef5" strokeWidth={1.5} />
          {n.label && (
            <text
              x={n.labelRight ? n.x + 9 : n.x - 9}
              y={n.y + 3}
              textAnchor={n.labelRight ? "start" : "end"}
              className="fill-white/45 font-mono"
              fontSize={7}
            >
              {n.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

interface Node {
  x: number;
  y: number;
  label?: string;
  labelRight?: boolean;
}
interface Edge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  positive: boolean;
  width: number;
  opacity: number;
}

function buildLayout(net: Network) {
  // Column sizes: input layer plus each layer's output.
  const sizes = [net.layers[0].inSize, ...net.layers.map((l) => l.outSize)];
  const cols = sizes.length;
  const colX = (c: number) => PAD_X + (c / (cols - 1)) * (W - 2 * PAD_X);
  const nodeY = (count: number, i: number) =>
    count === 1 ? H / 2 : PAD_Y + (i / (count - 1)) * (H - 2 * PAD_Y);

  const nodes: Node[] = [];
  const positions: { x: number; y: number }[][] = [];
  sizes.forEach((count, c) => {
    const col: { x: number; y: number }[] = [];
    for (let i = 0; i < count; i++) {
      const x = colX(c);
      const y = nodeY(count, i);
      col.push({ x, y });
      const isInput = c === 0;
      const isOutput = c === cols - 1;
      nodes.push({
        x,
        y,
        label: isInput ? INPUT_LABELS[i] : isOutput ? OUTPUT_LABELS[i] : undefined,
        labelRight: isOutput,
      });
    }
    positions.push(col);
  });

  // Normalise edge width against the largest absolute weight in the net.
  let maxW = 0;
  for (const l of net.layers) for (const w of l.w) maxW = Math.max(maxW, Math.abs(w));
  maxW = maxW || 1;

  const edges: Edge[] = [];
  net.layers.forEach((layer, li) => {
    const from = positions[li];
    const to = positions[li + 1];
    for (let j = 0; j < layer.outSize; j++) {
      for (let i = 0; i < layer.inSize; i++) {
        const w = layer.w[j * layer.inSize + i];
        const mag = Math.abs(w) / maxW;
        edges.push({
          x1: from[i].x,
          y1: from[i].y,
          x2: to[j].x,
          y2: to[j].y,
          positive: w >= 0,
          width: 0.3 + mag * 2,
          opacity: 0.08 + mag * 0.6,
        });
      }
    }
  });

  return { nodes, edges };
}
