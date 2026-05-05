"use client";

import { useCallback, useRef, useState } from "react";
import {
  cloneBodies,
  DEFAULT_PARAMS,
  type Body,
  type SimParams,
} from "../../_lib/threeBody";
import { buildPreset, type PresetId } from "../../_lib/presets";
import { ThreeBodyCanvas } from "../ThreeBodyCanvas";
import { Controls } from "../Controls";
import { Readouts } from "../Readouts";

const DEFAULT_PRESET: PresetId = "figure-eight";

export function ThreeBody() {
  const [presetId, setPresetId] = useState<PresetId>(DEFAULT_PRESET);
  const [bodies, setBodies] = useState<Body[]>(() => buildPreset(DEFAULT_PRESET));
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);
  const [playing, setPlaying] = useState(true);

  const initialBodiesRef = useRef<Body[]>(bodies);
  const liveBodiesRef = useRef<Body[]>(cloneBodies(bodies));
  const paramsRef = useRef<SimParams>(params);
  const playingRef = useRef<boolean>(true);
  const resetSignalRef = useRef<number>(0);

  const updateInitial = useCallback((next: Body[]) => {
    initialBodiesRef.current = next;
    setBodies(next);
  }, []);

  const handleBodyChange = useCallback(
    (i: number, key: keyof Body, value: number) => {
      const next = bodies.map((b, idx) =>
        idx === i ? { ...b, [key]: value } : b
      );
      updateInitial(next);
    },
    [bodies, updateInitial]
  );

  const handleParamChange = useCallback(
    (key: keyof SimParams, value: number) => {
      setParams((prev) => {
        const next = { ...prev, [key]: value };
        paramsRef.current = next;
        return next;
      });
    },
    []
  );

  const handlePresetChange = useCallback(
    (id: PresetId) => {
      setPresetId(id);
      const next = buildPreset(id);
      updateInitial(next);
      resetSignalRef.current++;
    },
    [updateInitial]
  );

  const handleReset = useCallback(() => {
    resetSignalRef.current++;
  }, []);

  const handlePlayPauseToggle = useCallback(() => {
    setPlaying((prev) => {
      playingRef.current = !prev;
      return !prev;
    });
  }, []);

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-[#0d0d0d]">
      <div className="flex-1 min-h-0 lg:min-w-0 relative">
        <ThreeBodyCanvas
          liveBodiesRef={liveBodiesRef}
          initialBodiesRef={initialBodiesRef}
          paramsRef={paramsRef}
          playingRef={playingRef}
          resetSignalRef={resetSignalRef}
        />
      </div>
      <div className="h-[45%] lg:h-full lg:w-96 lg:flex-shrink-0 overflow-y-auto bg-[#111] border-t border-slate-800 lg:border-t-0 lg:border-l">
        <Controls
          bodies={bodies}
          params={params}
          presetId={presetId}
          playing={playing}
          onBodyChange={handleBodyChange}
          onParamChange={handleParamChange}
          onPresetChange={handlePresetChange}
          onPlayPauseToggle={handlePlayPauseToggle}
          onReset={handleReset}
        />
        <Readouts liveBodiesRef={liveBodiesRef} />
      </div>
    </div>
  );
}
