"use client";

import { useEffect, useRef } from "react";

// Europe silhouette as an ASCII luminance dither (dense glyphs = land, faint dots = sea),
// now interactive: the cursor disturbs nearby characters and a click sends out a ripple.
const RAMP = ["·", "·", ":", ":", "+", "*", "#", "%", "@"];
const SAMPLE = 200;
const MAP_SCALE = 0.98;   // square map size relative to max(viewport)
const MAP_SHIFT_Y = 0.18; // shift image up -> crops upper Scandinavia, centres central Europe

export default function AsciiBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999, inside: false });
  const ripples = useRef<{ x: number; y: number; t0: number }[]>([]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const cv: HTMLCanvasElement = canvas;
    const ctx: CanvasRenderingContext2D = context;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    let lum: Float32Array | null = null;
    let cols = 0, rows = 0, cell = 12, ox = 0, oy = 0;
    let land: Float32Array = new Float32Array(0);   // base landness per cell
    let baseIdx: Uint8Array = new Uint8Array(0);     // base glyph index per cell

    function buildSamples(img: HTMLImageElement) {
      const off = document.createElement("canvas");
      off.width = SAMPLE; off.height = SAMPLE;
      const octx = off.getContext("2d");
      if (!octx) return;
      octx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
      const data = octx.getImageData(0, 0, SAMPLE, SAMPLE).data;
      const buf = new Float32Array(SAMPLE * SAMPLE);
      for (let i = 0; i < SAMPLE * SAMPLE; i++) buf[i] = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3 / 255;
      lum = buf;
    }

    function layout() {
      const w = window.innerWidth, h = window.innerHeight;
      cv.width = Math.floor(w * dpr); cv.height = Math.floor(h * dpr);
      cv.style.width = w + "px"; cv.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = Math.max(12, Math.round(Math.min(w, h) / 72));
      cols = Math.ceil(w / cell) + 1;
      rows = Math.ceil(h / cell) + 1;
      const mapSize = Math.max(w, h) * MAP_SCALE;
      ox = (w - mapSize) / 2;
      oy = (h - mapSize) / 2 - mapSize * MAP_SHIFT_Y;
      land = new Float32Array(cols * rows);
      baseIdx = new Uint8Array(cols * rows);
      if (!lum) return;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cell, y = r * cell;
          const u = (x - ox) / mapSize, v = (y - oy) / mapSize;
          let L = 0;
          if (u >= 0 && u < 1 && v >= 0 && v < 1) {
            const sx = Math.min(SAMPLE - 1, (u * SAMPLE) | 0);
            const sy = Math.min(SAMPLE - 1, (v * SAMPLE) | 0);
            L = 1 - lum[sy * SAMPLE + sx];
          }
          const idx = r * cols + c;
          land[idx] = L;
          baseIdx[idx] = Math.min(RAMP.length - 1, (L * (RAMP.length - 1) + 0.5) | 0);
        }
      }
    }

    function colors() {
      const dark = (document.documentElement.getAttribute("data-theme") || "dark") !== "light";
      return { dark, base: 0.04, span: dark ? 0.55 : 0.7, eSpan: dark ? 0.7 : 0.8 };
    }

    function draw(t: number) {
      const w = window.innerWidth, h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.font = `${cell}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textBaseline = "top";
      const { dark, base, span, eSpan } = colors();
      const mx = mouse.current.x, my = mouse.current.y;
      const R = 130, R2 = R * R;
      const rips = ripples.current;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const x = c * cell, y = r * cell;
          const L = land[idx];

          // effect energy from cursor + ripples
          let e = 0;
          if (mouse.current.inside) {
            const dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
            if (d2 < R2) e = 1 - Math.sqrt(d2) / R;
          }
          for (let i = 0; i < rips.length; i++) {
            const age = t - rips[i].t0;
            const radius = age * 0.45;            // px/ms
            const dx = x - rips[i].x, dy = y - rips[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const ring = Math.abs(dist - radius);
            if (ring < 26) {
              const fade = Math.max(0, 1 - age / 1100);
              e = Math.max(e, (1 - ring / 26) * fade);
            }
          }

          // radial glow only — brighten within the cursor/ripple field, no character scrambling
          const ch = RAMP[baseIdx[idx]];
          const a = Math.min(1, base + Math.pow(L, 1.6) * span + Math.pow(e, 0.8) * eSpan);
          ctx.fillStyle = dark ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
          ctx.fillText(ch, x, y);
        }
      }
    }

    const img = new Image();
    let ready = false;
    img.onload = () => { buildSamples(img); layout(); ready = true; draw(performance.now()); };
    img.src = "/europe-src.png";

    const onResize = () => { layout(); if (ready) draw(performance.now()); };
    window.addEventListener("resize", onResize);
    const obs = new MutationObserver(() => ready && draw(performance.now()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    if (reduced || coarse) {
      return () => { window.removeEventListener("resize", onResize); obs.disconnect(); };
    }

    const onMove = (ev: MouseEvent) => { mouse.current = { x: ev.clientX, y: ev.clientY, inside: true }; };
    const onLeave = () => { mouse.current.inside = false; };
    const onDown = (ev: MouseEvent) => { ripples.current.push({ x: ev.clientX, y: ev.clientY, t0: performance.now() }); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);
    window.addEventListener("mousedown", onDown);

    let raf = 0, lastDraw = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      ripples.current = ripples.current.filter((r) => t - r.t0 < 1200);
      const active = mouse.current.inside || ripples.current.length > 0;
      if (!ready || !active) return;          // stay static when idle
      if (t - lastDraw < 45) return;          // ~22fps
      lastDraw = t;
      draw(t);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      window.removeEventListener("mousedown", onDown);
      obs.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="ascii-bg" aria-hidden="true" />;
}
