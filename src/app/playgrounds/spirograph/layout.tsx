import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spirograph | Playground",
  description: "Draw mesmerizing spirograph patterns by rolling circles within circles.",
  openGraph: {
    title: "Spirograph",
    description: "Draw mesmerizing spirograph patterns by rolling circles within circles.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
