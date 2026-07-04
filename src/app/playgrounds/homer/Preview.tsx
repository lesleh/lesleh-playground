"use client";

import Image from "next/image";
import homer from "./_assets/homer.png";
import eyedot from "./_assets/eyedot.png";

// Eye positions as % of natural image size (800x533)
// Left eye center: x=288, y=168 → 36%, 31.5%
// Right eye center: x=366, y=180 → 45.75%, 33.8%
// Pupil sized relative to the container (eyedot is 13px on the 800px image)
// so it scales with Homer instead of staying a fixed, googly size.
const PUPIL_WIDTH = `${(13 / 800) * 100}%`;

export function HomerPreview() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-100 to-yellow-200">
      {/* isolate keeps the eyedots' negative z-index within this box so they
          sit behind Homer but above the background, not lost behind it. */}
      <div className="relative h-full isolate" style={{ aspectRatio: "800/533" }}>
        <Image
          src={eyedot}
          alt=""
          aria-hidden="true"
          className="absolute -z-10 h-auto"
          style={{ left: "36%", top: "31.5%", width: PUPIL_WIDTH, transform: "translate(-50%, -50%)" }}
        />
        <Image
          src={eyedot}
          alt=""
          aria-hidden="true"
          className="absolute -z-10 h-auto"
          style={{ left: "45.75%", top: "33.8%", width: PUPIL_WIDTH, transform: "translate(-50%, -50%)" }}
        />
        <Image
          src={homer}
          alt="Homer Simpson"
          className="h-full w-auto"
        />
      </div>
    </div>
  );
}
