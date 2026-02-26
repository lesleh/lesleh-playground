"use client";

import Link from "next/link";
import { PlaygroundCardProps } from "./types";

export function PlaygroundCard({
  title,
  description,
  href,
  preview: Preview,
  accentColor = "#3b82f6",
}: PlaygroundCardProps) {
  return (
    <Link
      href={href}
      className="group block bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none overflow-hidden"
    >
      <div className="aspect-[16/10] bg-gray-50 relative">
        <Preview />
      </div>
      <div className="p-6">
        <h2 className="font-bold text-lg mb-2 text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
}
