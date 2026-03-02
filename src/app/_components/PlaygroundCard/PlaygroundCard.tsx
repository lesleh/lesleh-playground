"use client";

import Link from "next/link";
import { PlaygroundCardProps } from "./types";

const rotations = [
  "-rotate-1",
  "rotate-1",
  "-rotate-2",
  "rotate-2",
  "-rotate-[0.5deg]",
  "rotate-[0.5deg]",
  "-rotate-[1.5deg]",
  "rotate-[1.5deg]",
];

export function PlaygroundCard({
  title,
  description,
  href,
  preview: Preview,
  index = 0,
}: PlaygroundCardProps & { index?: number }) {
  const rotation = rotations[index % rotations.length];

  return (
    <Link
      href={href}
      className={`group block bg-[#fffef5] border-2 border-black ${rotation} hover:rotate-0 hover:scale-105 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
    >
      <div className="aspect-[16/10] relative border-b-2 border-black overflow-hidden">
        <Preview />
        {/* stamp overlay corner */}
        <div className="absolute top-0 right-0 w-12 h-12 border-l-2 border-b-2 border-black bg-[#fffef5] flex items-center justify-center">
          <span className="text-[10px] font-mono text-black leading-none text-center">
            NO.{String(index + 1).padStart(2, "0")}
          </span>
        </div>
      </div>
      <div className="p-4 pb-5">
        <h2 className="font-roboto-slab font-black text-xl text-black leading-tight mb-2 group-hover:underline decoration-2 underline-offset-2">
          {title}
        </h2>
        <p className="text-xs font-mono text-black/60 leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
}
