"use client";

// The "trees" demo is a tree of nested React server/client components, not a
// fractal. Preview the matryoshka of alternating server (blue) / client (red)
// boxes that the page actually renders.
const LAYERS = [
  { kind: "server", border: "#2563eb", bg: "#dbeafe" },
  { kind: "client", border: "#dc2626", bg: "#fee2e2" },
  { kind: "server", border: "#2563eb", bg: "#dbeafe" },
  { kind: "client", border: "#dc2626", bg: "#fee2e2" },
] as const;

function Nest({ depth }: { depth: number }) {
  if (depth >= LAYERS.length) return null;
  const layer = LAYERS[depth];
  return (
    <div
      className="rounded-md border-2 p-2.5"
      style={{ borderColor: layer.border, backgroundColor: layer.bg }}
    >
      <span
        className="font-mono text-[8px] font-semibold uppercase tracking-wider"
        style={{ color: layer.border }}
      >
        {layer.kind}
      </span>
      {depth + 1 < LAYERS.length && (
        <div className="mt-1.5">
          <Nest depth={depth + 1} />
        </div>
      )}
    </div>
  );
}

export function TreesPreview() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white p-4">
      <div className="w-full max-w-[220px]">
        <Nest depth={0} />
      </div>
    </div>
  );
}
