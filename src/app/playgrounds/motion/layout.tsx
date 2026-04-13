import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Motion | Playground",
  description: "Motion library playground. Spring physics and animation primitives.",
  openGraph: {
    title: "Motion",
    description: "Motion library playground. Spring physics and animation primitives.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
