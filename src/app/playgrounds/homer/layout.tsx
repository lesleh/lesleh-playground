import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Homer Simpson | Playground",
  description: "Homer's eyes follow your cursor around the screen.",
  openGraph: {
    title: "Homer Simpson",
    description: "Homer's eyes follow your cursor around the screen.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
