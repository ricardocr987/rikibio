"use client";

import { useEffect, useRef } from "react";

// Background "block production": chains grow one grid cell per slot along the
// backdrop grid. The head block glows in the signal colour, settled blocks cool
// to mint and are linked by hash lines; a finished chain flashes (finalized)
// and dissolves, and a new one starts elsewhere. The cell under the pointer
// lights up faintly. Cells under elements marked data-blocks-avoid (text,
// portrait, sections) are off limits, so blocks only live in the empty space
// around the content and never sit behind text. Canvas sized to the backdrop (it scrolls with the page),
// capped at 30fps, paused while scrolled out of view or the tab is hidden, and
// a single still frame under prefers-reduced-motion.

const CELL = 56; // must match the .backdrop grid size in globals.css
const INSET = 6;
const SLOT_MS = 420; // roughly a Solana slot
const FRAME_MS = 1000 / 30;
const FINAL_FLASH_MS = 550;
const FINAL_FADE_MS = 1400;
const TRAIL_MS = 900;

type Dir = readonly [number, number];
type Cell = { col: number; row: number; born: number };
type Chain = {
  cells: Cell[];
  dir: Dir;
  maxLen: number;
  slot: number;
  nextStep: number;
  finalizedAt: number | null;
};

const DIRS: Dir[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function readRgb(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return (value || fallback).split(/\s+/).join(",");
}

export function BlockField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const signal = readRgb("--signal", "255 99 51");
    const mint = readRgb("--mint", "120 230 170");
    const paper = readRgb("--paper", "236 230 214");
    const rgba = (rgb: string, a: number) => `rgba(${rgb},${a})`;

    let cols = 0;
    let rows = 0;
    let target = 0;
    const chains: Chain[] = [];
    const occupied = new Set<string>();
    const blocked = new Set<string>();
    const trail = new Map<string, number>();
    const key = (c: number, r: number) => `${c}:${r}`;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / CELL);
      rows = Math.ceil(h / CELL);
      measureBlocked();
    };

    // Mark every cell that overlaps avoided content (plus a small margin)
    const AVOID_PAD = 10;
    const measureBlocked = () => {
      blocked.clear();
      const origin = canvas.getBoundingClientRect();
      document.querySelectorAll("[data-blocks-avoid]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const c0 = Math.floor((r.left - origin.left - AVOID_PAD) / CELL);
        const c1 = Math.floor((r.right - origin.left + AVOID_PAD) / CELL);
        const r0 = Math.floor((r.top - origin.top - AVOID_PAD) / CELL);
        const r1 = Math.floor((r.bottom - origin.top + AVOID_PAD) / CELL);
        for (let c = Math.max(0, c0); c <= Math.min(cols - 1, c1); c++)
          for (let row = Math.max(0, r0); row <= Math.min(rows - 1, r1); row++)
            blocked.add(key(c, row));
      });
      const open = cols * rows - blocked.size;
      target = Math.max(2, Math.min(6, Math.round(open / 40)));
      // chains that now overlap content finish early
      const now = performance.now();
      for (const chain of chains) {
        if (
          chain.finalizedAt === null &&
          chain.cells.some((c) => blocked.has(key(c.col, c.row)))
        )
          chain.finalizedAt = now;
      }
    };

    const free = (c: number, r: number) =>
      c >= 0 &&
      r >= 0 &&
      c < cols &&
      r < rows &&
      !occupied.has(key(c, r)) &&
      !blocked.has(key(c, r));

    const spawn = (now: number, delay: number) => {
      for (let attempt = 0; attempt < 40; attempt++) {
        const col = Math.floor(Math.random() * cols);
        // the backdrop fades out lower down, so start chains in the top part
        const row = Math.floor(Math.random() * Math.max(1, rows * 0.8));
        if (!free(col, row)) continue;
        occupied.add(key(col, row));
        const horizontal = Math.random() < 0.65;
        chains.push({
          cells: [{ col, row, born: now + delay }],
          dir: horizontal ? DIRS[Math.random() < 0.5 ? 0 : 1] : DIRS[Math.random() < 0.5 ? 2 : 3],
          maxLen: 4 + Math.floor(Math.random() * 6),
          slot: SLOT_MS * (0.85 + Math.random() * 0.6),
          nextStep: now + delay + SLOT_MS,
          finalizedAt: null,
        });
        return;
      }
    };

    const grow = (chain: Chain, now: number) => {
      const head = chain.cells[chain.cells.length - 1];
      const [dx, dy] = chain.dir;
      const turns: Dir[] = [
        [dy, dx],
        [-dy, -dx],
      ];
      const options =
        Math.random() < 0.7
          ? [chain.dir, ...turns]
          : [...turns.sort(() => Math.random() - 0.5), chain.dir];
      for (const dir of options) {
        const col = head.col + dir[0];
        const row = head.row + dir[1];
        if (!free(col, row)) continue;
        occupied.add(key(col, row));
        chain.cells.push({ col, row, born: now });
        chain.dir = dir;
        return true;
      }
      return false;
    };

    const update = (now: number) => {
      for (let i = chains.length - 1; i >= 0; i--) {
        const chain = chains[i];
        if (chain.finalizedAt === null && now >= chain.nextStep) {
          const grew = chain.cells.length < chain.maxLen && grow(chain, now);
          if (grew) chain.nextStep = now + chain.slot;
          else chain.finalizedAt = now;
        }
        if (
          chain.finalizedAt !== null &&
          now - chain.finalizedAt > FINAL_FLASH_MS + FINAL_FADE_MS
        ) {
          chain.cells.forEach((c) => occupied.delete(key(c.col, c.row)));
          chains.splice(i, 1);
          spawn(now, 300 + Math.random() * 1500);
        }
      }
      while (chains.length < target) spawn(now, Math.random() * 800);
      trail.forEach((t, k) => {
        if (now - t > TRAIL_MS) trail.delete(k);
      });
    };

    const rect = (col: number, row: number, grow: number) => {
      const size = (CELL - INSET * 2) * grow;
      const x = col * CELL + (CELL - size) / 2;
      const y = row * CELL + (CELL - size) / 2;
      ctx.beginPath();
      ctx.roundRect(x, y, size, size, 4);
    };
    const center = (c: Cell) =>
      [c.col * CELL + CELL / 2, c.row * CELL + CELL / 2] as const;

    const draw = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 1;

      trail.forEach((t, k) => {
        const [c, r] = k.split(":").map(Number);
        const a = 1 - (now - t) / TRAIL_MS;
        rect(c, r, 1);
        ctx.fillStyle = rgba(paper, 0.05 * a);
        ctx.fill();
        ctx.strokeStyle = rgba(paper, 0.3 * a);
        ctx.stroke();
      });

      for (const chain of chains) {
        const since = chain.finalizedAt === null ? -1 : now - chain.finalizedAt;
        const flash = since < 0 ? 0 : 1 - clamp01(since / FINAL_FLASH_MS);
        const fade =
          since < 0 ? 1 : 1 - clamp01((since - FINAL_FLASH_MS) / FINAL_FADE_MS);
        const visible = chain.cells.filter((c) => now >= c.born);

        // hash links between consecutive blocks
        for (let i = 1; i < visible.length; i++) {
          const [x1, y1] = center(visible[i - 1]);
          const [x2, y2] = center(visible[i]);
          const p = easeOut(clamp01((now - visible[i].born) / 260));
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x1 + (x2 - x1) * p, y1 + (y2 - y1) * p);
          ctx.strokeStyle = rgba(paper, 0.22 * fade);
          ctx.stroke();
        }

        visible.forEach((cell, i) => {
          const age = now - cell.born;
          const appear = easeOut(clamp01(age / 280));
          const isHead = chain.finalizedAt === null && i === visible.length - 1;
          const cool = clamp01(age / 3500);
          const g = 0.6 + 0.4 * appear;

          if (isHead) {
            rect(cell.col, cell.row, g * 1.18);
            ctx.fillStyle = rgba(signal, 0.08 * appear);
            ctx.fill();
            rect(cell.col, cell.row, g);
            ctx.fillStyle = rgba(signal, 0.26 * appear);
            ctx.fill();
            ctx.strokeStyle = rgba(signal, 0.9 * appear);
            ctx.stroke();
            return;
          }

          rect(cell.col, cell.row, g);
          ctx.fillStyle = rgba(mint, (0.16 - 0.08 * cool) * fade);
          ctx.fill();
          ctx.strokeStyle = rgba(mint, (0.5 - 0.22 * cool) * fade);
          ctx.stroke();
          if (flash > 0) {
            ctx.fillStyle = rgba(signal, 0.22 * flash);
            ctx.fill();
            ctx.strokeStyle = rgba(signal, 0.85 * flash);
            ctx.stroke();
          }
        });
      }
    };

    resize();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();

    if (reduced) {
      // One still frame: a few fully grown chains
      for (let i = 0; i < target; i++) spawn(start - 60000, 0);
      chains.forEach((chain) => {
        while (chain.cells.length < chain.maxLen && grow(chain, start - 60000));
      });
      draw(start);
      return;
    }

    for (let i = 0; i < target; i++) spawn(start, 600 + i * 700);

    let raf = 0;
    let last = 0;
    let onScreen = true;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < FRAME_MS) return;
      last = now;
      update(now);
      draw(now);
    };
    const sync = () => {
      cancelAnimationFrame(raf);
      if (onScreen && !document.hidden) raf = requestAnimationFrame(loop);
    };
    sync();

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    io.observe(canvas);

    // Content moves after the entrance animation, font swap and reflows
    let alive = true;
    const remeasure = () => {
      if (alive) measureBlocked();
    };
    const settleTimer = window.setTimeout(measureBlocked, 1400);
    document.fonts?.ready.then(remeasure);
    const ro = new ResizeObserver(remeasure);
    ro.observe(document.body);

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !onScreen) return;
      const box = canvas.getBoundingClientRect();
      const col = Math.floor((e.clientX - box.left) / CELL);
      const row = Math.floor((e.clientY - box.top) / CELL);
      if (row >= 0 && row < rows && !blocked.has(key(col, row)))
        trail.set(key(col, row), performance.now());
    };
    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    };

    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      io.disconnect();
      ro.disconnect();
      alive = false;
      clearTimeout(settleTimer);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="block-canvas" aria-hidden />;
}
