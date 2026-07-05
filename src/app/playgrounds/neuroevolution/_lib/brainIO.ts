// Serialize a brain to a portable JSON file and read it back, validating with
// zod that its shape matches the current network layout.

import { z } from "zod";
import { BRAIN_SHAPE } from "./car";
import type { Network } from "./nn";
import type { Track } from "./track";

const FORMAT = "neuroevolution-brain";
const VERSION = 1;

export interface BrainMeta {
  generation?: number;
  runSeconds?: number;
}

// A parsed file: the brain, plus its home track if a specialist bundled one.
export interface BrainFile {
  net: Network;
  track: Track | null;
}

function shapeOf(net: Network): number[] {
  return [net.layers[0]?.inSize, ...net.layers.map((l) => l.outSize)];
}

// A specialist may bundle the exact track geometry it was trained on, so it
// stays reproducible regardless of how track generation changes. A generalist
// passes no track.
export function serializeBrain(
  net: Network,
  meta: BrainMeta = {},
  track?: Track | null,
): string {
  return JSON.stringify(
    { format: FORMAT, version: VERSION, shape: shapeOf(net), meta, net, track: track ?? undefined },
    null,
    2,
  );
}

const layerSchema = z
  .object({
    inSize: z.number().int().positive(),
    outSize: z.number().int().positive(),
    w: z.array(z.number()),
    b: z.array(z.number()),
  })
  .refine((l) => l.w.length === l.inSize * l.outSize && l.b.length === l.outSize, {
    error: "Brain file has a malformed layer",
  });

const vec = z.object({ x: z.number(), y: z.number() });
const wall = z.object({
  ax: z.number(),
  ay: z.number(),
  bx: z.number(),
  by: z.number(),
});
// Structural check on a bundled track, so an incompatible file fails loudly.
const trackSchema = z.object({
  width: z.number(),
  height: z.number(),
  trackWidth: z.number(),
  gateSpacing: z.number(),
  centerline: z.array(vec).min(3),
  inner: z.array(vec).min(3),
  outer: z.array(vec).min(3),
  walls: z.array(wall).min(1),
  gates: z.array(wall.extend({ index: z.number() })).min(1),
  start: z.object({ x: z.number(), y: z.number(), angle: z.number() }),
});

const brainFileSchema = z
  .object({
    format: z.literal(FORMAT, { error: "Not a neuroevolution brain file" }),
    version: z.number().optional(),
    net: z.object({ layers: z.array(layerSchema).min(1) }),
    track: trackSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const shape = [
      data.net.layers[0].inSize,
      ...data.net.layers.map((l) => l.outSize),
    ];
    if (
      shape.length !== BRAIN_SHAPE.length ||
      shape.some((v, i) => v !== BRAIN_SHAPE[i])
    ) {
      ctx.addIssue({
        code: "custom",
        message: `Brain shape [${shape}] does not match this sim [${BRAIN_SHAPE}]`,
      });
    }
  });

// Parse and validate a brain file (and its bundled track, if any). Throws a
// human-readable Error on any problem.
export function parseBrain(text: string): BrainFile {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Not valid JSON");
  }

  const result = brainFileSchema.safeParse(json);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Invalid brain file");
  }
  return {
    net: result.data.net as Network,
    track: (result.data.track as Track | undefined) ?? null,
  };
}
