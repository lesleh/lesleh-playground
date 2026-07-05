// Serialize a brain to a portable JSON file and read it back, validating with
// zod that its shape matches the current network layout.

import { z } from "zod";
import { BRAIN_SHAPE } from "./car";
import type { Network } from "./nn";

const FORMAT = "neuroevolution-brain";
const VERSION = 1;

export interface BrainMeta {
  generation?: number;
  runSeconds?: number;
}

function shapeOf(net: Network): number[] {
  return [net.layers[0]?.inSize, ...net.layers.map((l) => l.outSize)];
}

export function serializeBrain(net: Network, meta: BrainMeta = {}): string {
  return JSON.stringify(
    { format: FORMAT, version: VERSION, shape: shapeOf(net), meta, net },
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

const brainFileSchema = z
  .object({
    format: z.literal(FORMAT, { error: "Not a neuroevolution brain file" }),
    version: z.number().optional(),
    net: z.object({ layers: z.array(layerSchema).min(1) }),
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

// Parse and validate a brain file. Throws a human-readable Error on any problem.
export function parseBrain(text: string): Network {
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
  return result.data.net as Network;
}
