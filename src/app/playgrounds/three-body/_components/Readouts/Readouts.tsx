"use client";

import { useEffect, useState } from "react";
import {
  totalEnergy,
  totalMomentum,
  angularMomentum,
  type Body,
} from "../../_lib/threeBody";

interface Props {
  liveBodiesRef: React.RefObject<Body[]>;
}

interface Readings {
  ke: number;
  pe: number;
  total: number;
  pMag: number;
  l: number;
}

export function Readouts({ liveBodiesRef }: Props) {
  const [readings, setReadings] = useState<Readings>({
    ke: 0,
    pe: 0,
    total: 0,
    pMag: 0,
    l: 0,
  });

  useEffect(() => {
    const id = setInterval(() => {
      const bodies = liveBodiesRef.current;
      const e = totalEnergy(bodies);
      const p = totalMomentum(bodies);
      const l = angularMomentum(bodies);
      setReadings({ ke: e.ke, pe: e.pe, total: e.total, pMag: p.mag, l });
    }, 100);
    return () => clearInterval(id);
  }, [liveBodiesRef]);

  return (
    <div className="p-4 border-t border-slate-800">
      <div className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-3">
        Readouts
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs font-mono tabular-nums">
        <Row label="KE" value={readings.ke} />
        <Row label="PE" value={readings.pe} />
        <Row label="E" value={readings.total} highlight />
        <Row label="|p|" value={readings.pMag} />
        <Row label="L" value={readings.l} />
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd className={`text-right ${highlight ? "text-slate-200" : "text-slate-400"}`}>
        {value.toExponential(3)}
      </dd>
    </>
  );
}
