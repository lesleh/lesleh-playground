"use client";

import { useCallback, useRef, useState } from "react";
import { BoidsCanvas } from "../BoidsCanvas";
import { Controls } from "../Controls";
import { DEFAULT_PARAMS } from "../../_lib/boids";
import type { BoidParams } from "../../_lib/boids";

export function Boids() {
  const [params, setParams] = useState<BoidParams>(DEFAULT_PARAMS);
  const paramsRef = useRef<BoidParams>(DEFAULT_PARAMS);

  const handleChange = useCallback((key: keyof BoidParams, value: number) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      paramsRef.current = next;
      return next;
    });
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">
      <div className="flex-1 overflow-hidden">
        <BoidsCanvas paramsRef={paramsRef} />
      </div>
      <Controls params={params} onChange={handleChange} />
    </div>
  );
}
