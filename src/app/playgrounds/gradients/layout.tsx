import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gradients | Playground",
  description: "Experiment with colour gradients and transitions.",
  openGraph: {
    title: "Gradients",
    description: "Experiment with colour gradients and transitions.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
