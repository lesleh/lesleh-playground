"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useClientBoundingRect } from "./_hooks/useClientBoundingRect";
import homer from "./_assets/homer.png";
import eyedot from "./_assets/eyedot.png";
import { useMousePosition } from "./_hooks/useMousePosition";

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

function HomerPage() {
  const pRef = useRef<HTMLDivElement | null>(null);
  const leftEyeRef = useRef<HTMLImageElement | null>(null);
  const rightEyeRef = useRef<HTMLImageElement | null>(null);
  const { x, y } = useMousePosition();
  // @ts-expect-error
  const pRect = useClientBoundingRect(pRef);

  const leftEyePosition = {
    x: LEFT_EYE.x + (pRect?.left || 0),
    y: LEFT_EYE.y + (pRect?.top || 0),
  };

  const rightEyePosition = {
    x: RIGHT_EYE.x + (pRect?.left || 0),
    y: RIGHT_EYE.y + (pRect?.top || 0),
  };

  useEffect(() => {
    if (!leftEyeRef.current || !rightEyeRef.current) return;

    // Clamp the pupil's distance from the eye centre to the cursor's actual
    // distance, so when the cursor is over the eye the pupil sits under it
    // rather than orbiting the rim at the full radius.
    const eyeOffset = (radius: number, eyeX: number, eyeY: number) => {
      const dx = x - eyeX;
      const dy = y - eyeY;
      const distance = Math.min(Math.hypot(dx, dy), radius);
      const angle = Math.atan2(dy, dx);
      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
      };
    };

    const leftOffset = eyeOffset(
      LEFT_EYE.radius,
      leftEyePosition.x,
      leftEyePosition.y,
    );
    const rightOffset = eyeOffset(
      RIGHT_EYE.radius,
      rightEyePosition.x,
      rightEyePosition.y,
    );

    leftEyeRef.current.style.left = `${LEFT_EYE.x + leftOffset.x}px`;
    leftEyeRef.current.style.top = `${LEFT_EYE.y + leftOffset.y}px`;
    rightEyeRef.current.style.left = `${RIGHT_EYE.x + rightOffset.x}px`;
    rightEyeRef.current.style.top = `${RIGHT_EYE.y + rightOffset.y}px`;
  }, [
    leftEyePosition.x,
    leftEyePosition.y,
    pRect?.x,
    pRect?.y,
    rightEyePosition.x,
    rightEyePosition.y,
    x,
    y,
  ]);

  return (
    <div className="select-none">
      <div className="fixed bottom-0 left-0 right-0 grid justify-center">
        <div className="relative" ref={pRef}>
          <Image
            alt=""
            src={eyedot}
            className="absolute -z-10 drag-none select-none"
            ref={leftEyeRef}
            style={{
              top: LEFT_EYE.y,
              left: LEFT_EYE.x,
            }}
          />
          <Image
            alt=""
            src={eyedot}
            className="absolute -z-10 drag-none select-none"
            ref={rightEyeRef}
            style={{
              top: RIGHT_EYE.y,
              left: RIGHT_EYE.x,
            }}
          />
          <Image className="drag-none select-none" src={homer} alt="" />
        </div>
      </div>
    </div>
  );
}

export default HomerPage;
