import { Box } from "./_components/Box";
import { OnClient } from "./_components/OnClient";
import { OnServer } from "./_components/OnServer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trees | Playground",
  description:
    "A tree of nested server and client components, demonstrating App Router composition.",
  openGraph: {
    title: "Trees",
    description:
    "A tree of nested server and client components, demonstrating App Router composition.",
  },
};


export default function TreesPage() {
  return (
    <Box color="blue">
      <p>This is running on a server</p>
      <OnClient>
        <p>This is running on a client</p>
        <OnServer>
          <p>This is running on a server</p>
          <OnClient>
            <p>This is running on a client</p>
          </OnClient>
        </OnServer>
      </OnClient>
    </Box>
  );
}
