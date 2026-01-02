"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import "./spirograph.css";

interface View {
  cx: number;
  cy: number;
  scale: number;
  initialized: boolean;
}

interface Circle {
  id: number;
  r: number;
  d: number;
  color: string;
}

interface SpiroParams {
  mode: string;
  R: number;
  r: number;
  d: number;
}

interface Point {
  x: number;
  y: number;
}

const COLORS = [
  "#8aa4ff",
  "#ff6b9d",
  "#64d9a0",
  "#ffd166",
  "#a78bfa",
  "#fb923c",
  "#ec4899",
  "#06b6d4",
];

const DEFAULT_PROGRESS = 1;

export default function Spirograph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<View>({ cx: 0, cy: 0, scale: 1, initialized: false });

  const [progress, setProgress] = useState(DEFAULT_PROGRESS);
  const [mode, setMode] = useState("inside");
  const [R, setR] = useState(170);
  const [circles, setCircles] = useState<Circle[]>([
    { id: 1, r: 65, d: 90, color: "#8aa4ff" },
  ]);
  const [nextId, setNextId] = useState(2);

  const gcd = useCallback((a: number, b: number) => {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }, []);

  const spiroPoint = useCallback((t: number, params: SpiroParams): Point => {
    const { mode, R, r, d } = params;

    if (mode === "inside") {
      const k = R - r;
      const cx = k * Math.cos(t);
      const cy = k * Math.sin(t);
      const phi = (k / r) * t;
      const x = cx + d * Math.cos(-phi);
      const y = cy + d * Math.sin(-phi);
      return { x, y };
    } else {
      const k = R + r;
      const cx = k * Math.cos(t);
      const cy = k * Math.sin(t);
      const phi = (k / r) * t;
      const x = cx - d * Math.cos(phi);
      const y = cy - d * Math.sin(phi);
      return { x, y };
    }
  }, []);

  const computePath = useCallback(
    (params: SpiroParams) => {
      const g = gcd(params.R, params.r);
      const turnsToComplete = params.r / g;
      const tMax = Math.PI * 2 * turnsToComplete;
      const n = 6000;
      const pts = new Array(n);

      for (let i = 0; i < n; i++) {
        const t = (i / (n - 1)) * tMax;
        pts[i] = spiroPoint(t, params);
      }
      return pts;
    },
    [gcd, spiroPoint],
  );

  const autoRecenter = useCallback(
    (canvas: HTMLCanvasElement, allPoints: Point[][]) => {
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;

      for (const pts of allPoints) {
        for (const q of pts) {
          if (q.x < minX) minX = q.x;
          if (q.x > maxX) maxX = q.x;
          if (q.y < minY) minY = q.y;
          if (q.y > maxY) maxY = q.y;
        }
      }

      const rect = canvas.getBoundingClientRect();
      const pad = 36;
      const spanX = Math.max(1e-6, maxX - minX);
      const spanY = Math.max(1e-6, maxY - minY);
      const scale = Math.min(
        (rect.width - pad * 2) / spanX,
        (rect.height - pad * 2) / spanY,
      );

      viewRef.current = {
        scale,
        cx: (minX + maxX) / 2,
        cy: (minY + maxY) / 2,
        initialized: true,
      };
    },
    [],
  );

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 1;

      const step = 40;
      ctx.beginPath();
      for (let x = 0; x <= w; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y <= h; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      ctx.restore();
    },
    [],
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Compute all paths
    const allPaths = circles.map((circle) =>
      computePath({ mode, R, r: circle.r, d: circle.d }),
    );

    if (!viewRef.current.initialized) {
      autoRecenter(canvas, allPaths);
    }

    const view = viewRef.current;

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(view.scale, view.scale);
    ctx.translate(-view.cx, -view.cy);

    // Draw all circles
    circles.forEach((circle, idx) => {
      const pts = allPaths[idx];
      const count = Math.max(1, Math.ceil(progress * pts.length));

      ctx.lineWidth = 2.5 / view.scale;
      ctx.strokeStyle = circle.color;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < count; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();

      // Draw current pen point
      const cur = pts[count - 1];
      ctx.fillStyle = circle.color;
      ctx.beginPath();
      const radius = 4 / view.scale;
      ctx.arc(cur.x, cur.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }, [progress, mode, R, circles, computePath, autoRecenter]);

  const handleRecenter = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const allPaths = circles.map((circle) =>
      computePath({ mode, R, r: circle.r, d: circle.d }),
    );
    autoRecenter(canvas, allPaths);
    draw();
  }, [mode, R, circles, computePath, autoRecenter, draw]);

  const handleRandomize = useCallback(() => {
    const randInt = (a: number, b: number) =>
      Math.floor(a + Math.random() * (b - a + 1));
    const randChoice = <T,>(arr: T[]) =>
      arr[Math.floor(Math.random() * arr.length)];

    setMode(randChoice(["inside", "outside"]));
    const newR = randInt(90, 240);
    setR(newR);

    // Randomize 2-4 circles
    const numCircles = randInt(2, 4);
    const newCircles: Circle[] = [];
    for (let i = 0; i < numCircles; i++) {
      newCircles.push({
        id: i + 1,
        r: randInt(20, Math.min(180, newR - 5)),
        d: randInt(0, 240),
        color: COLORS[i % COLORS.length],
      });
    }
    setCircles(newCircles);
    setNextId(numCircles + 1);
    setProgress(DEFAULT_PROGRESS);
    viewRef.current.initialized = false;
  }, []);

  const addCircle = useCallback(() => {
    const newCircle: Circle = {
      id: nextId,
      r: 50,
      d: 80,
      color: COLORS[circles.length % COLORS.length],
    };
    setCircles([...circles, newCircle]);
    setNextId(nextId + 1);
    viewRef.current.initialized = false;
  }, [circles, nextId]);

  const removeCircle = useCallback(
    (id: number) => {
      if (circles.length > 1) {
        setCircles(circles.filter((c) => c.id !== id));
        viewRef.current.initialized = false;
      }
    },
    [circles],
  );

  const updateCircle = useCallback(
    (id: number, updates: Partial<Circle>) => {
      setCircles(circles.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    },
    [circles],
  );

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `spirograph-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }, []);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "0") setProgress(0);
      if (e.key === "1") setProgress(1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="spirograph-container">
      <div className="wrap">
        <div className="card">
          <canvas ref={canvasRef} />
        </div>

        <div className="card">
          <div className="panel">
            <div>
              <h1>Multi-Spirograph</h1>
              <p className="hint">
                Draw multiple spirograph curves with different colors.
                Add/remove circles and adjust their parameters.
              </p>
            </div>

            <div className="row">
              <label>
                Progress
                <span className="val">{progress.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.0005"
                value={progress}
                onChange={(e) => setProgress(parseFloat(e.target.value))}
              />
            </div>

            <div className="row">
              <label>Mode</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="inside">Inside (hypotrochoid)</option>
                <option value="outside">Outside (epitrochoid)</option>
              </select>
            </div>

            <div className="row">
              <label>
                R (big radius) <span className="val">{R}</span>
              </label>
              <input
                type="range"
                min="40"
                max="260"
                step="1"
                value={R}
                onChange={(e) => setR(parseFloat(e.target.value))}
              />
            </div>

            <div className="circles-section">
              <div className="section-header">
                <label>Inner Circles</label>
                <button className="btn-add" onClick={addCircle}>
                  + Add Circle
                </button>
              </div>

              <div className="circles-list">
                {circles.map((circle) => (
                  <div key={circle.id} className="circle-item">
                    <div className="circle-header">
                      <div
                        className="color-indicator"
                        style={{ background: circle.color }}
                      />
                      <input
                        type="color"
                        value={circle.color}
                        onChange={(e) =>
                          updateCircle(circle.id, { color: e.target.value })
                        }
                        className="color-picker"
                      />
                      {circles.length > 1 && (
                        <button
                          className="btn-remove"
                          onClick={() => removeCircle(circle.id)}
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <div className="circle-controls">
                      <div className="control-row">
                        <label>
                          r <span className="val">{circle.r}</span>
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="200"
                          step="1"
                          value={circle.r}
                          onChange={(e) =>
                            updateCircle(circle.id, {
                              r: parseFloat(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="control-row">
                        <label>
                          d <span className="val">{circle.d}</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="240"
                          step="1"
                          value={circle.d}
                          onChange={(e) =>
                            updateCircle(circle.id, {
                              d: parseFloat(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid2">
              <button onClick={handleRandomize}>Randomize</button>
              <button onClick={handleRecenter}>Recenter</button>
            </div>

            <button onClick={handleSave}>Save as PNG</button>

            <div className="footer">
              Each circle creates a separate spirograph curve. Experiment with
              different r/d values and colors!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
