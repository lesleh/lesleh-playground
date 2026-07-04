"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useClientBoundingRect } from "./_hooks/useClientBoundingRect";
import homer from "./_assets/homer.png";
import eyedot from "./_assets/eyedot.png";
import { usePointerPosition } from "./_hooks/usePointerPosition";

// Eye geometry is expressed in the image's natural pixel space. The rendered
// image scales to fit the viewport (especially on mobile), so everything is
// scaled by renderedWidth / NATURAL_WIDTH before being applied.
const NATURAL_WIDTH = 800;
const NATURAL_HEIGHT = 533;

const LEFT_EYE = {
  x: 288,
  y: 168,
  radius: 20,
};

const RIGHT_EYE = {
  x: 366,
  y: 180,
  radius: 25,
};

// Pupil size as a fraction of the image width (eyedot is 13px on the 800px
// image) so it scales with Homer rather than staying a fixed size.
const PUPIL_WIDTH = `${(13 / NATURAL_WIDTH) * 100}%`;

function HomerPage() {
  const pRef = useRef<HTMLDivElement | null>(null);
  const leftEyeRef = useRef<HTMLImageElement | null>(null);
  const rightEyeRef = useRef<HTMLImageElement | null>(null);
  const pointer = usePointerPosition();
  // @ts-expect-error
  const pRect = useClientBoundingRect(pRef);

  // Disable scrolling while the demo is mounted (desktop and mobile) so a
  // touch drag moves the eyes instead of panning the page.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (!leftEyeRef.current || !rightEyeRef.current || !pRect) return;

    // How much the rendered image is scaled down from its natural size.
    const scale = pRect.width / NATURAL_WIDTH;

    // Until the first pointer input, keep the pupils centred (looking ahead).
    // Otherwise clamp each pupil's distance from the eye centre to the
    // pointer's actual distance, so when the pointer is over the eye the pupil
    // sits under it rather than orbiting the rim at the full radius. All eye
    // geometry is scaled into rendered (page) pixels first.
    const eyeOffset = (eye: { x: number; y: number; radius: number }) => {
      if (!pointer) return { x: 0, y: 0 };
      const centreX = pRect.left + eye.x * scale;
      const centreY = pRect.top + eye.y * scale;
      const dx = pointer.x - centreX;
      const dy = pointer.y - centreY;
      const distance = Math.min(Math.hypot(dx, dy), eye.radius * scale);
      const angle = Math.atan2(dy, dx);
      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
      };
    };

    const leftOffset = eyeOffset(LEFT_EYE);
    const rightOffset = eyeOffset(RIGHT_EYE);

    leftEyeRef.current.style.left = `${LEFT_EYE.x * scale + leftOffset.x}px`;
    leftEyeRef.current.style.top = `${LEFT_EYE.y * scale + leftOffset.y}px`;
    rightEyeRef.current.style.left = `${RIGHT_EYE.x * scale + rightOffset.x}px`;
    rightEyeRef.current.style.top = `${RIGHT_EYE.y * scale + rightOffset.y}px`;
  }, [pRect, pointer]);

  return (
    <div className="select-none">
      {/* Hint fades out on the first pointer input. Wording depends on the
          pointer type so touch devices are told to drag. */}
      <div
        aria-hidden={pointer !== null}
        className={`pointer-events-none fixed inset-x-0 top-8 flex justify-center px-4 transition-opacity duration-500 ${
          pointer ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="rounded-full border border-black/10 bg-black/5 px-4 py-2 text-center font-mono text-xs uppercase tracking-widest text-black/50">
          <span className="[@media(pointer:coarse)]:hidden">
            Move your mouse, the eyes follow
          </span>
          <span className="hidden [@media(pointer:coarse)]:inline">
            Drag anywhere, the eyes follow
          </span>
        </span>
      </div>
      <div className="fixed bottom-0 left-0 right-0 grid justify-center">
        <div className="relative" ref={pRef}>
          <Image
            alt=""
            src={eyedot}
            className="absolute -z-10 h-auto drag-none select-none"
            ref={leftEyeRef}
            style={{
              top: `${(LEFT_EYE.y / NATURAL_HEIGHT) * 100}%`,
              left: `${(LEFT_EYE.x / NATURAL_WIDTH) * 100}%`,
              width: PUPIL_WIDTH,
              transform: "translate(-50%, -50%)",
            }}
          />
          <Image
            alt=""
            src={eyedot}
            className="absolute -z-10 h-auto drag-none select-none"
            ref={rightEyeRef}
            style={{
              top: `${(RIGHT_EYE.y / NATURAL_HEIGHT) * 100}%`,
              left: `${(RIGHT_EYE.x / NATURAL_WIDTH) * 100}%`,
              width: PUPIL_WIDTH,
              transform: "translate(-50%, -50%)",
            }}
          />
          <Image className="drag-none select-none" src={homer} alt="" />
        </div>
      </div>
    </div>
  );
}

export default HomerPage;
