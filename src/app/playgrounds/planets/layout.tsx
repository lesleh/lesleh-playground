import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planets | Playground",
  description: "Watch planets orbit in smooth animations using the Motion library.",
  openGraph: {
    title: "Planets",
    description: "Watch planets orbit in smooth animations using the Motion library.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
