"use client";

import { useEffect, useRef } from "react";

interface Particle {
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
    let falling: Particle[] = [];
    let settled: Particle[] = [];
    let done = false;
    let spawnCount = 0;

    const DURATION_SECONDS = 60;
    const PARTICLES_PER_FRAME = 2;
    const TOTAL_PARTICLES = DURATION_SECONDS * 60 * PARTICLES_PER_FRAME;
    const PARTICLE_SIZE = 1.5;
    const GRAVITY = 0.08;
    const SAND_COLOR = "rgba(255, 255, 255, 0.035)";

    // Grid for fast pile-height lookups
    const GRID_CELL = 3;
    let gridCols = 0;
    let gridRows = 0;
    let grid: Float64Array;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      gridCols = Math.ceil(canvas!.width / GRID_CELL);
      gridRows = Math.ceil(canvas!.height / GRID_CELL);
      grid = new Float64Array(gridCols * gridRows);
      // Re-init grid with bottom boundary from settled particles
      grid.fill(0);
      for (const p of settled) {
        const col = Math.floor(p.x / GRID_CELL);
        const row = Math.floor(p.y / GRID_CELL);
        if (col >= 0 && col < gridCols && row >= 0 && row < gridRows) {
          const idx = row * gridCols + col;
          grid[idx] = 1;
        }
      }
    }

    resize();
    window.addEventListener("resize", resize);

    // Hourglass geometry — only the bottom half matters for settling
    function getHourglass() {
      const cx = canvas!.width / 2;
      const cy = canvas!.height / 2;
      const h = canvas!.height * 0.7;
      const w = Math.min(canvas!.width * 0.35, h * 0.45);
      const neck = w * 0.05;
      const top = cy - h / 2;
      const bottom = cy + h / 2;
      return { cx, cy, h, w, neck, top, bottom };
    }

    // Width of the hourglass at a given y (full shape)
    function hourglassWidthAt(y: number): number {
      const { cx, w, neck, top, bottom } = getHourglass();
      const halfH = (bottom - top) / 2;
      const ry = y - top;
      if (ry < 0 || ry > halfH * 2) return 0;
      if (ry < halfH) {
        const t = ry / halfH;
        return w * (1 - t) + neck * t;
      } else {
        const t = (ry - halfH) / halfH;
        return neck * (1 - t) + w * t;
      }
    }

    // Find the highest settled particle near x in the bottom half
    function getPileHeight(x: number): number {
      const { bottom } = getHourglass();
      const col = Math.floor(x / GRID_CELL);
      // Scan upward from bottom
      for (let row = gridRows - 1; row >= 0; row--) {
        // Check col and neighbors
        for (let dc = -1; dc <= 1; dc++) {
          const c = col + dc;
          if (c >= 0 && c < gridCols && grid[row * gridCols + c]) {
            return row * GRID_CELL;
          }
        }
      }
      return bottom;
    }

    function settleParticle(p: Particle) {
      const col = Math.floor(p.x / GRID_CELL);
      const row = Math.floor(p.y / GRID_CELL);
      if (col >= 0 && col < gridCols && row >= 0 && row < gridRows) {
        grid[row * gridCols + col] = 1;
      }
      settled.push(p);
    }

    function spawnParticle() {
      const { cx, cy, neck } = getHourglass();
      falling.push({
        x: cx + (Math.random() - 0.5) * neck * 0.4,
        y: cy,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 0.5 + Math.random() * 0.5,
      });
      spawnCount++;
    }

    function update() {
      const { cx, cy, bottom } = getHourglass();

      if (spawnCount < TOTAL_PARTICLES) {
        for (let i = 0; i < PARTICLES_PER_FRAME; i++) {
          spawnParticle();
        }
      } else if (falling.length === 0) {
        done = true;
      }

      for (let i = falling.length - 1; i >= 0; i--) {
        const p = falling[i];
        p.vy += GRAVITY;
        p.x += p.vx;
        p.y += p.vy;

        // Only constrain in the lower half (below neck)
        if (p.y > cy) {
          const maxHalf = hourglassWidthAt(p.y) / 2 - PARTICLE_SIZE;
          if (maxHalf > 0) {
            const dx = p.x - cx;
            if (dx > maxHalf) {
              p.x = cx + maxHalf;
              p.vx *= -0.3;
            } else if (dx < -maxHalf) {
              p.x = cx - maxHalf;
              p.vx *= -0.3;
            }
          }
        }

        // Settle on the pile or the bottom wall
        const pileY = getPileHeight(p.x);
        if (p.y >= pileY - PARTICLE_SIZE) {
          p.y = pileY - PARTICLE_SIZE;
          settleParticle(p);
          falling.splice(i, 1);
        } else if (p.y >= bottom - PARTICLE_SIZE) {
          p.y = bottom - PARTICLE_SIZE;
          settleParticle(p);
          falling.splice(i, 1);
        }
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx!.fillStyle = SAND_COLOR;

      for (const p of settled) {
        ctx!.fillRect(
          p.x - PARTICLE_SIZE / 2,
          p.y - PARTICLE_SIZE / 2,
          PARTICLE_SIZE,
          PARTICLE_SIZE
        );
      }

      for (const p of falling) {
        ctx!.fillRect(
          p.x - PARTICLE_SIZE / 2,
          p.y - PARTICLE_SIZE / 2,
          PARTICLE_SIZE,
          PARTICLE_SIZE
        );
      }
    }

    function loop() {
      if (done) return;
      update();
      draw();
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
