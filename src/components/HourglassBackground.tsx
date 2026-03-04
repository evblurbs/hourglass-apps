"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  settled: boolean;
}

export default function HourglassBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    let settled: Particle[] = [];
    let done = false;
    let spawnCount = 0;

    const DURATION_SECONDS = 60;
    const PARTICLES_PER_FRAME = 2;
    const TOTAL_PARTICLES = DURATION_SECONDS * 60 * PARTICLES_PER_FRAME;
    const PARTICLE_SIZE = 1.5;
    const GRAVITY = 0.08;
    const SAND_COLOR = "rgba(180, 160, 120, 0.4)";
    const GLASS_COLOR = "rgba(255, 255, 255, 0.04)";
    const GLASS_STROKE = "rgba(255, 255, 255, 0.06)";

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    resize();
    window.addEventListener("resize", resize);

    // Hourglass geometry relative to canvas
    function getHourglass() {
      const cx = canvas!.width / 2;
      const cy = canvas!.height / 2;
      const h = canvas!.height * 0.7;
      const w = Math.min(canvas!.width * 0.3, h * 0.4);
      const neck = w * 0.06;
      const top = cy - h / 2;
      const bottom = cy + h / 2;
      return { cx, cy, h, w, neck, top, bottom };
    }

    // Check if point is inside hourglass shape
    function isInsideHourglass(x: number, y: number): boolean {
      const { cx, cy, w, neck, top, bottom } = getHourglass();
      const halfH = (bottom - top) / 2;

      // Relative position
      const ry = y - top;

      let maxWidth: number;
      if (ry < halfH) {
        // Upper half: wide at top, narrow at middle
        const t = ry / halfH;
        maxWidth = w * (1 - t) + neck * t;
      } else {
        // Lower half: narrow at middle, wide at bottom
        const t = (ry - halfH) / halfH;
        maxWidth = neck * (1 - t) + w * t;
      }

      return Math.abs(x - cx) < maxWidth / 2;
    }

    // Get the width of hourglass at a given y
    function hourglassWidthAt(y: number): number {
      const { cx, cy, w, neck, top, bottom } = getHourglass();
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

    // Get pile height at x position in bottom half
    function getPileHeight(x: number): number {
      const { cx, bottom } = getHourglass();
      let highest = bottom;
      for (const p of settled) {
        if (Math.abs(p.x - x) < PARTICLE_SIZE * 3) {
          highest = Math.min(highest, p.y);
        }
      }
      return highest;
    }

    function drawHourglass() {
      const { cx, cy, w, neck, top, bottom } = getHourglass();
      const halfH = (bottom - top) / 2;

      ctx!.beginPath();
      // Upper half - left side
      ctx!.moveTo(cx - w / 2, top);
      ctx!.quadraticCurveTo(cx - w / 2, cy - neck, cx - neck / 2, cy);
      // Lower half - left side
      ctx!.quadraticCurveTo(cx - w / 2, cy + neck, cx - w / 2, bottom);
      // Bottom
      ctx!.lineTo(cx + w / 2, bottom);
      // Lower half - right side
      ctx!.quadraticCurveTo(cx + w / 2, cy + neck, cx + neck / 2, cy);
      // Upper half - right side
      ctx!.quadraticCurveTo(cx + w / 2, cy - neck, cx + w / 2, top);
      ctx!.closePath();

      ctx!.fillStyle = GLASS_COLOR;
      ctx!.fill();
      ctx!.strokeStyle = GLASS_STROKE;
      ctx!.lineWidth = 1;
      ctx!.stroke();
    }

    // Draw sand still in the upper chamber
    function drawUpperSand() {
      const { cx, cy, w, neck, top } = getHourglass();
      const progress = spawnCount / TOTAL_PARTICLES;
      if (progress >= 1) return;

      const sandTop = top + (cy - top) * progress * 0.8;

      ctx!.beginPath();
      const widthAtSandTop = hourglassWidthAt(sandTop);
      ctx!.moveTo(cx - widthAtSandTop / 2 + 2, sandTop);

      // Fill down to the neck
      const steps = 20;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const y = sandTop + (cy - sandTop) * t;
        const hw = hourglassWidthAt(y) / 2 - 2;
        if (i === 0) ctx!.moveTo(cx + hw, y);
        else ctx!.lineTo(cx + hw, y);
      }
      for (let i = steps; i >= 0; i--) {
        const t = i / steps;
        const y = sandTop + (cy - sandTop) * t;
        const hw = hourglassWidthAt(y) / 2 - 2;
        ctx!.lineTo(cx - hw, y);
      }
      ctx!.closePath();
      ctx!.fillStyle = SAND_COLOR;
      ctx!.fill();
    }

    function spawnParticle() {
      const { cx, cy, neck } = getHourglass();
      particles.push({
        x: cx + (Math.random() - 0.5) * neck * 0.3,
        y: cy,
        vx: (Math.random() - 0.5) * 0.3,
        vy: 0.5 + Math.random() * 0.5,
        settled: false,
      });
      spawnCount++;
    }

    function update() {
      const { cx, cy, bottom } = getHourglass();

      // Spawn new particles
      if (spawnCount < TOTAL_PARTICLES) {
        for (let i = 0; i < PARTICLES_PER_FRAME; i++) {
          spawnParticle();
        }
      } else if (particles.length === 0) {
        done = true;
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += GRAVITY;
        p.x += p.vx;
        p.y += p.vy;

        // Constrain to hourglass walls (lower half only)
        if (p.y > cy) {
          const maxW = hourglassWidthAt(p.y) / 2 - PARTICLE_SIZE;
          if (maxW > 0) {
            if (p.x - cx > maxW) {
              p.x = cx + maxW;
              p.vx *= -0.3;
            }
            if (p.x - cx < -maxW) {
              p.x = cx - maxW;
              p.vx *= -0.3;
            }
          }
        }

        // Check if settled on pile or bottom
        const pileY = getPileHeight(p.x);
        if (p.y >= pileY - PARTICLE_SIZE) {
          p.y = pileY - PARTICLE_SIZE;
          p.settled = true;
          settled.push(p);
          particles.splice(i, 1);
        }
      }
    }

    function drawParticles() {
      ctx!.fillStyle = SAND_COLOR;

      for (const p of settled) {
        ctx!.fillRect(
          p.x - PARTICLE_SIZE / 2,
          p.y - PARTICLE_SIZE / 2,
          PARTICLE_SIZE,
          PARTICLE_SIZE
        );
      }

      for (const p of particles) {
        ctx!.fillRect(
          p.x - PARTICLE_SIZE / 2,
          p.y - PARTICLE_SIZE / 2,
          PARTICLE_SIZE,
          PARTICLE_SIZE
        );
      }
    }

    // Draw thin stream from neck
    function drawStream() {
      if (spawnCount >= TOTAL_PARTICLES) return;
      const { cx, cy, bottom, neck } = getHourglass();
      const pileTop = getPileHeight(cx);

      ctx!.beginPath();
      ctx!.moveTo(cx - 0.5, cy);
      ctx!.lineTo(cx + 0.5, cy);
      ctx!.lineTo(cx + 0.5, Math.min(pileTop, cy + 40));
      ctx!.lineTo(cx - 0.5, Math.min(pileTop, cy + 40));
      ctx!.closePath();
      ctx!.fillStyle = SAND_COLOR;
      ctx!.fill();
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      drawHourglass();
      drawUpperSand();
      drawStream();
      drawParticles();
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
