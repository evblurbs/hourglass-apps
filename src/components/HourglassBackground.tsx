"use client";

import { useEffect, useRef } from "react";

interface FallingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export default function HourglassBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let falling: FallingParticle[] = [];
    const startTime = Date.now();
    const DURATION = 60_000;
    const DOT_SPACING = 5;
    const DOT_SIZE = 1.5;
    const SAND_COLOR = "rgba(255, 255, 255, 0.035)";
    const FALLING_COLOR = "rgba(255, 255, 255, 0.055)";
    const GRAVITY = 0.06;
    const NAV_HEIGHT = 57;
    const FOOTER_HEIGHT = 73;
    const MAX_FALLING = 80;

    // Volume lookup tables for smooth draining
    let upperVolTable: number[] = []; // cumulative volume at each pixel row from top
    let upperYTable: number[] = []; // corresponding y values
    let lowerVolTable: number[] = []; // cumulative volume at each pixel row from bottom
    let lowerYTable: number[] = []; // corresponding y values
    let totalUpperVol = 0;
    let totalLowerVol = 0;

    const geo = { cx: 0, cy: 0, top: 0, bottom: 0, w: 0, neck: 0 };

    function widthAt(y: number): number {
      const halfH = (geo.bottom - geo.top) / 2;
      const ry = y - geo.top;
      if (ry < 0 || ry > halfH * 2) return 0;
      if (ry <= halfH) {
        const t = ry / halfH;
        return geo.w * (1 - t * t) + geo.neck * (t * t);
      } else {
        const t = (ry - halfH) / halfH;
        return geo.neck * (1 - t * t) + geo.w * (t * t);
      }
    }

    function computeGeometry() {
      geo.cx = canvas!.width / 2;
      geo.top = NAV_HEIGHT;
      geo.bottom = canvas!.height - FOOTER_HEIGHT;
      geo.cy = geo.top + (geo.bottom - geo.top) / 2;
      geo.w = Math.min(canvas!.width * 0.75, (geo.bottom - geo.top) * 0.55);
      geo.neck = geo.w * 0.035;
    }

    function computeVolumeTables() {
      upperVolTable = [];
      upperYTable = [];
      lowerVolTable = [];
      lowerYTable = [];

      // Upper: top -> cy
      let cumVol = 0;
      for (let y = Math.floor(geo.top); y <= Math.floor(geo.cy); y++) {
        cumVol += widthAt(y);
        upperVolTable.push(cumVol);
        upperYTable.push(y);
      }
      totalUpperVol = cumVol;

      // Lower: bottom -> cy (scanning upward)
      cumVol = 0;
      for (let y = Math.floor(geo.bottom); y >= Math.ceil(geo.cy); y--) {
        cumVol += widthAt(y);
        lowerVolTable.push(cumVol);
        lowerYTable.push(y);
      }
      totalLowerVol = cumVol;
    }

    // Binary search: find y where cumulative vol from top >= target
    function getUpperSandSurface(progress: number): number {
      if (progress <= 0) return geo.top;
      if (progress >= 1) return geo.cy;
      const target = progress * totalUpperVol;
      let lo = 0;
      let hi = upperVolTable.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (upperVolTable[mid] < target) lo = mid + 1;
        else hi = mid;
      }
      return upperYTable[lo];
    }

    // Binary search: find y where cumulative vol from bottom >= target
    function getLowerSandSurface(progress: number): number {
      if (progress <= 0) return geo.bottom;
      if (progress >= 1) return geo.cy;
      const target = progress * totalLowerVol;
      let lo = 0;
      let hi = lowerVolTable.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (lowerVolTable[mid] < target) lo = mid + 1;
        else hi = mid;
      }
      return lowerYTable[lo];
    }

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      computeGeometry();
      computeVolumeTables();
    }

    resize();
    window.addEventListener("resize", resize);

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / DURATION, 1);

      const topSurface = getUpperSandSurface(progress);
      const bottomSurface = getLowerSandSurface(progress);

      ctx!.fillStyle = SAND_COLOR;

      // Upper sand: from topSurface down to neck
      if (progress < 1) {
        for (let y = topSurface; y < geo.cy; y += DOT_SPACING) {
          const hw = widthAt(y) / 2;
          if (hw <= 0) continue;
          for (let x = geo.cx - hw; x <= geo.cx + hw; x += DOT_SPACING) {
            ctx!.fillRect(x - DOT_SIZE / 2, y - DOT_SIZE / 2, DOT_SIZE, DOT_SIZE);
          }
        }
      }

      // Lower sand: from bottomSurface down to bottom
      if (progress > 0) {
        for (let y = bottomSurface; y < geo.bottom; y += DOT_SPACING) {
          const hw = widthAt(y) / 2;
          if (hw <= 0) continue;
          for (let x = geo.cx - hw; x <= geo.cx + hw; x += DOT_SPACING) {
            ctx!.fillRect(x - DOT_SIZE / 2, y - DOT_SIZE / 2, DOT_SIZE, DOT_SIZE);
          }
        }
      }

      // Falling particles through neck
      if (progress < 1 && falling.length < MAX_FALLING) {
        falling.push({
          x: geo.cx + (Math.random() - 0.5) * geo.neck * 0.5,
          y: geo.cy,
          vx: (Math.random() - 0.5) * 0.3,
          vy: 0.5 + Math.random(),
        });
      }

      ctx!.fillStyle = FALLING_COLOR;
      for (let i = falling.length - 1; i >= 0; i--) {
        const p = falling[i];
        p.vy += GRAVITY;
        p.x += p.vx;
        p.y += p.vy;

        if (p.y >= bottomSurface || p.y > geo.bottom) {
          falling.splice(i, 1);
          continue;
        }

        ctx!.fillRect(p.x - DOT_SIZE / 2, p.y - DOT_SIZE / 2, DOT_SIZE, DOT_SIZE);
      }
    }

    function loop() {
      draw();
      const elapsed = Date.now() - startTime;
      if (elapsed >= DURATION && falling.length === 0) return;
      animationId = requestAnimationFrame(loop);
    }

    loop();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10"
      aria-hidden="true"
    />
  );
}
