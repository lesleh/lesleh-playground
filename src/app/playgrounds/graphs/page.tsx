import { Graph } from "./_components";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Graphs | Playground",
  description: "Interactive graph visualizations using D3.js.",
  openGraph: {
    title: "Graphs",
    description: "Interactive graph visualizations using D3.js.",
  },
};


export default async function GraphsPage({
  searchParams,
}: {
  searchParams: Promise<{ points?: string }>;
}) {
  const resolvedParams = await searchParams;
  const numPoints = resolvedParams["points"];

  return <Graph numPoints={numPoints ? Number(numPoints) : undefined} />;
}
