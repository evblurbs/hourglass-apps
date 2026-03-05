"use client";

import { useEffect, useRef } from "react";

interface FallingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface SplashParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

// Module-level state so animation persists across page navigations
let persistedStartTime: number | null = null;

export default function HourglassBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!persistedStartTime) {
      persistedStartTime = Date.now();
    }
    const startTime = persistedStartTime;

    let animationId: number;
    let falling: FallingParticle[] = [];
    let splashes: SplashParticle[] = [];
    const DURATION = 2 * 60 * 1000; // 2 minutes (testing)
    const DOT_SPACING = 5;
    const DOT_SIZE = 1.5;
    const GRAVITY = 0.06;
    const MAX_FALLING = 80;
    const MAX_SPLASHES = 200;

    // Volume lookup tables for smooth draining
    let upperVolTable: number[] = [];
    let upperYTable: number[] = [];
    let lowerVolTable: number[] = [];
    let lowerYTable: number[] = [];
    let totalUpperVol = 0;
    let totalLowerVol = 0;

    const geo = { cx: 0, cy: 0, top: 0, bottom: 0, w: 0, neck: 0 };

    function getColors() {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return {
        bg: isDark ? "#0a0a0a" : "#ffffff",
        sand: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
        falling: isDark ? "rgba(255, 255, 255, 0.10)" : "rgba(0, 0, 0, 0.08)",
        splashBase: isDark ? [255, 255, 255] as const : [0, 0, 0] as const,
      };
    }

    function widthAt(y: number): number {
      const halfH = (geo.bottom - geo.top) / 2;
      const ry = y - geo.top;
      if (ry < 0 || ry > halfH * 2) return 0;
      const capWidth = geo.w * 0.55;
      const bulbZone = 0.3;

      // Mirror: use distance from nearest end so both halves are identical
      const distFromEnd = ry <= halfH ? ry : halfH * 2 - ry;
      const t = distFromEnd / halfH; // 0 at cap, 1 at neck

      if (t <= bulbZone) {
        // Circular arc: rounded from capWidth up to geo.w
        const s = t / bulbZone;
        return capWidth + (geo.w - capWidth) * Math.sin(s * Math.PI / 2);
      } else {
        // Concave funnel from geo.w down to neck
        const s = (t - bulbZone) / (1 - bulbZone);
        return geo.neck + (geo.w - geo.neck) * (1 - s * s);
      }
    }

    function computeGeometry() {
      const header = document.querySelector("header");
      const footer = document.querySelector("footer");
      const navBottom = header ? header.getBoundingClientRect().bottom : 57;
      const footerTop = footer ? footer.getBoundingClientRect().top : canvas!.height - 73;

      geo.cx = canvas!.width / 2;
      geo.top = navBottom;
      geo.bottom = footerTop;
      geo.cy = geo.top + (geo.bottom - geo.top) / 2;
      geo.w = Math.min(canvas!.width * 0.75, (geo.bottom - geo.top) * 0.55);
      geo.neck = 6;
    }

    function computeVolumeTables() {
      upperVolTable = [];
      upperYTable = [];
      lowerVolTable = [];
      lowerYTable = [];

      let cumVol = 0;
      for (let y = Math.floor(geo.top); y <= Math.floor(geo.cy); y++) {
        cumVol += widthAt(y);
        upperVolTable.push(cumVol);
        upperYTable.push(y);
      }
      totalUpperVol = cumVol;

      cumVol = 0;
      for (let y = Math.floor(geo.bottom); y >= Math.ceil(geo.cy); y--) {
        cumVol += widthAt(y);
        lowerVolTable.push(cumVol);
        lowerYTable.push(y);
      }
      totalLowerVol = cumVol;
    }

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

    function spawnSplash(x: number, y: number, speed: number) {
      const count = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        if (splashes.length >= MAX_SPLASHES) break;
        const angle = -Math.PI * (0.15 + Math.random() * 0.7);
        const force = speed * (0.15 + Math.random() * 0.25);
        splashes.push({
          x,
          y,
          vx: Math.cos(angle) * force * (Math.random() > 0.5 ? 1 : -1),
          vy: Math.sin(angle) * force,
          life: 0,
          maxLife: 20 + Math.random() * 25,
        });
      }
    }

    let lastWidth = 0;
    let lastHeight = 0;

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Skip resize if only height changed slightly (mobile URL bar)
      if (lastWidth === w && Math.abs(lastHeight - h) < 100) return;
      lastWidth = w;
      lastHeight = h;
      canvas!.width = w;
      canvas!.height = h;
      computeGeometry();
      computeVolumeTables();
    }

    resize();
    // Force initial dimensions
    lastWidth = 0;
    lastHeight = 0;
    resize();
    window.addEventListener("resize", resize);

    const FILL = 0.95;
    const DIP_SETTLE = 2500; // ms for surface dip to ease in after flip
    const MAX_DIP = 25;

    function drawSand(colors: ReturnType<typeof getColors>, progress: number, dip: number) {
      const topSurface = getUpperSandSurface(progress);
      const lowerFill = Math.max(0, progress - (1 - FILL));
      const bottomSurface = getLowerSandSurface(lowerFill);

      ctx!.fillStyle = colors.sand;

      // Upper sand — concave surface
      if (progress < 1) {
        for (let y = topSurface - dip; y < geo.cy; y += DOT_SPACING) {
          const hw = widthAt(y) / 2;
          if (hw <= 0) continue;
          for (let x = geo.cx - hw; x <= geo.cx + hw; x += DOT_SPACING) {
            const dx = (x - geo.cx) / (hw || 1);
            const localSurface = topSurface + dip * (1 - dx * dx);
            if (y < localSurface) continue;
            ctx!.fillRect(x - DOT_SIZE / 2, y - DOT_SIZE / 2, DOT_SIZE, DOT_SIZE);
          }
        }
      }

      // Lower sand — mounded surface (flattens as draining stops)
      if (lowerFill > 0) {
        for (let y = bottomSurface - dip; y < geo.bottom; y += DOT_SPACING) {
          const hw = widthAt(y) / 2;
          if (hw <= 0) continue;
          for (let x = geo.cx - hw; x <= geo.cx + hw; x += DOT_SPACING) {
            const dx = (x - geo.cx) / (hw || 1);
            const localSurface = bottomSurface + dip * dx * dx;
            if (y < localSurface) continue;
            ctx!.fillRect(x - DOT_SIZE / 2, y - DOT_SIZE / 2, DOT_SIZE, DOT_SIZE);
          }
        }
      }

      return bottomSurface;
    }

    function draw() {
      const colors = getColors();

      ctx!.fillStyle = colors.bg;
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      const elapsed = Date.now() - startTime;
      const progress = (1 - FILL) + Math.min(elapsed / DURATION, 1) * FILL;

      // Ease in the surface dip gradually
      const dipT = Math.min(elapsed / DIP_SETTLE, 1);
      const dip = MAX_DIP * dipT * dipT; // ease-in quadratic

      const bottomSurface = drawSand(colors, progress, dip);

      // Spawn falling particles through neck
      if (progress < 1 && falling.length < MAX_FALLING) {
        falling.push({
          x: geo.cx + (Math.random() - 0.5) * geo.neck * 0.5,
          y: geo.cy,
          vx: (Math.random() - 0.5) * 0.3,
          vy: 0.5 + Math.random(),
        });
      }

      // Update and draw falling particles
      ctx!.fillStyle = colors.falling;
      for (let i = falling.length - 1; i >= 0; i--) {
        const p = falling[i];
        p.vy += GRAVITY;
        p.x += p.vx;
        p.y += p.vy;

        if (p.y >= bottomSurface || p.y > geo.bottom) {
          spawnSplash(p.x, Math.min(p.y, bottomSurface), p.vy);
          falling.splice(i, 1);
          continue;
        }

        ctx!.fillRect(p.x - DOT_SIZE / 2, p.y - DOT_SIZE / 2, DOT_SIZE, DOT_SIZE);
      }

      // Update and draw splash particles
      const [sr, sg, sb] = colors.splashBase;
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        s.vy += GRAVITY * 0.5;
        s.vx *= 0.98;
        s.x += s.vx;
        s.y += s.vy;
        s.life++;

        if (s.life >= s.maxLife) {
          splashes.splice(i, 1);
          continue;
        }

        const hw = widthAt(s.y) / 2;
        if (hw > 0) {
          if (s.x > geo.cx + hw) { s.x = geo.cx + hw; s.vx *= -0.3; }
          if (s.x < geo.cx - hw) { s.x = geo.cx - hw; s.vx *= -0.3; }
        }

        const alpha = 0.06 * (1 - s.life / s.maxLife);
        ctx!.fillStyle = `rgba(${sr}, ${sg}, ${sb}, ${alpha})`;
        ctx!.fillRect(s.x - 0.5, s.y - 0.5, 1, 1);
      }
    }

    function loop() {
      draw();
      const elapsed = Date.now() - startTime;
      if (elapsed >= DURATION && falling.length === 0 && splashes.length === 0) return;
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
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
