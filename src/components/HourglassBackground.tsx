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
        sand: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.12)",
        falling: isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.20)",
        splashBase: isDark ? [255, 255, 255] as const : [0, 0, 0] as const,
      };
    }

    function widthAt(y: number): number {
      const halfH = (geo.bottom - geo.top) / 2;
      const ry = y - geo.top;
      if (ry < 0 || ry > halfH * 2) return 0;
      const capWidth = Math.min(768 * 0.4, geo.w * 0.5);
      const bulbZone = 0.15;

      // Mirror: use distance from nearest end so both halves are identical
      const distFromEnd = ry <= halfH ? ry : halfH * 2 - ry;
      const t = distFromEnd / halfH; // 0 at cap, 1 at neck

      if (t <= bulbZone) {
        // Smooth ramp from capWidth to geo.w
        const s = t / bulbZone;
        const smooth = s * s * (3 - 2 * s);
        return capWidth + (geo.w - capWidth) * smooth;
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

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      computeGeometry();
      computeVolumeTables();
    }

    resize();
    window.addEventListener("resize", resize);

    function draw() {
      const colors = getColors();

      ctx!.fillStyle = colors.bg;
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / DURATION, 1);

      const topSurface = getUpperSandSurface(progress);
      const bottomSurface = getLowerSandSurface(progress);

      ctx!.fillStyle = colors.sand;

      // Upper sand
      if (progress < 1) {
        for (let y = topSurface; y < geo.cy; y += DOT_SPACING) {
          const hw = widthAt(y) / 2;
          if (hw <= 0) continue;
          for (let x = geo.cx - hw; x <= geo.cx + hw; x += DOT_SPACING) {
            ctx!.fillRect(x - DOT_SIZE / 2, y - DOT_SIZE / 2, DOT_SIZE, DOT_SIZE);
          }
        }
      }

      // Lower sand
      if (progress > 0) {
        for (let y = bottomSurface; y < geo.bottom; y += DOT_SPACING) {
          const hw = widthAt(y) / 2;
          if (hw <= 0) continue;
          for (let x = geo.cx - hw; x <= geo.cx + hw; x += DOT_SPACING) {
            ctx!.fillRect(x - DOT_SIZE / 2, y - DOT_SIZE / 2, DOT_SIZE, DOT_SIZE);
          }
        }
      }

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
          // Spawn splash on impact
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
        s.vy += GRAVITY * 0.5; // lighter gravity for dust
        s.vx *= 0.98; // air friction
        s.x += s.vx;
        s.y += s.vy;
        s.life++;

        if (s.life >= s.maxLife) {
          splashes.splice(i, 1);
          continue;
        }

        // Constrain within hourglass walls
        const hw = widthAt(s.y) / 2;
        if (hw > 0) {
          if (s.x > geo.cx + hw) { s.x = geo.cx + hw; s.vx *= -0.3; }
          if (s.x < geo.cx - hw) { s.x = geo.cx - hw; s.vx *= -0.3; }
        }

        // Fade out over lifetime
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
