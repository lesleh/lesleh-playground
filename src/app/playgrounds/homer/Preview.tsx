"use client";

import Image from "next/image";
import homer from "./_assets/homer.png";

export function HomerPreview() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-100 to-yellow-200">
      <Image
        src={homer}
        alt="Homer Simpson"
        className="object-contain h-full w-auto"
      />
    </div>
  );
}
