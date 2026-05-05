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

interface Props {
  initialPreset: PresetId;
}

export function ThreeBody({ initialPreset }: Props) {
  const [presetId, setPresetId] = useState<PresetId>(initialPreset);
  const [bodies, setBodies] = useState<Body[]>(() => buildPreset(initialPreset));
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);
  const [playing, setPlaying] = useState(true);

  const initialBodiesRef = useRef<Body[]>(bodies);
  const liveBodiesRef = useRef<Body[]>(cloneBodies(bodies));
  const paramsRef = useRef<SimParams>(params);
  const playingRef = useRef<boolean>(true);
  const resetSignalRef = useRef<number>(0);
  const clearSignalRef = useRef<number>(0);

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
      // Editing a body teleports it; reset the live sim so the user sees their change.
      resetSignalRef.current++;
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
      // Zoom remaps AU→px, so existing trails sit at the wrong pixels and smear. Wipe them.
      if (key === "zoom") clearSignalRef.current++;
    },
    []
  );

  const handlePresetChange = useCallback(
    (id: PresetId) => {
      setPresetId(id);
      const next = buildPreset(id);
      updateInitial(next);
      resetSignalRef.current++;
      // Sync URL so the link is shareable. replaceState avoids cluttering history.
      const url = new URL(window.location.href);
      url.searchParams.set("preset", id);
      window.history.replaceState(null, "", url);
    },
    [updateInitial]
  );

  const handleReset = useCallback(() => {
    // Rebuild from the current preset so randomised presets reroll on each reset.
    // For deterministic presets the result is the same as the previous initial state.
    const next = buildPreset(presetId);
    updateInitial(next);
    resetSignalRef.current++;
  }, [presetId, updateInitial]);

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
          clearSignalRef={clearSignalRef}
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
