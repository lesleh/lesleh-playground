import type { Metadata } from "next";
import { ThreeBody } from "./_components/ThreeBody";
import { isPresetId, type PresetId } from "./_lib/presets";

export const metadata: Metadata = {
  title: "Three Body Problem | Playground",
  description:
    "Three gravitating stars. Tweak masses and starting velocities to summon stable dances or chaos.",
  openGraph: {
    title: "Three Body Problem",
    description:
      "Three gravitating stars. Tweak masses and starting velocities to summon stable dances or chaos.",
  },
};

const DEFAULT_PRESET: PresetId = "figure-eight";

export default async function ThreeBodyPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string }>;
}) {
  const { preset } = await searchParams;
  const initialPreset = isPresetId(preset) ? preset : DEFAULT_PRESET;
  return (
    <div className="h-full">
      <ThreeBody initialPreset={initialPreset} />
    </div>
  );
}
