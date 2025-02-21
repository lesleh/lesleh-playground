import { Graph } from "./_components";

export default async function GraphsPage({
  searchParams,
}: {
  searchParams: Promise<{ points?: string }>;
}) {
  const resolvedParams = await searchParams;
  const numPoints = resolvedParams["points"];

  return <Graph numPoints={numPoints ? Number(numPoints) : undefined} />;
}
