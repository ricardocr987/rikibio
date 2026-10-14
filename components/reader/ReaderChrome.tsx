"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { READER_THEME_KEY } from "@/lib/readerTheme";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  if (theme === "light") document.documentElement.dataset.reader = "light";
  else delete document.documentElement.dataset.reader;
}

export function ReaderChrome() {
  const [theme, setTheme] = useState<Theme>("dark");
  const bar = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const saved =
      localStorage.getItem(READER_THEME_KEY) === "light" ? "light" : "dark";
    applyTheme(saved);
    setTheme(saved);
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
    try {
      localStorage.setItem(READER_THEME_KEY, next);
    } catch {}
  };

  return (
    <header className="reader-bar">
      <div
        ref={bar}
        className="reader-progress"
        style={{ transform: "scaleX(0)" }}
        aria-hidden
      />
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6 md:px-10">
        <Link
          href="/#writing"
          className="group inline-flex items-center gap-2 font-mono text-sm tracking-tight text-[rgb(var(--r-dim))] transition-colors hover:text-[rgb(var(--r-fg))]"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          riki<span className="text-[rgb(var(--r-accent))]">.</span>bio
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-[rgb(var(--r-line))] px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[rgb(var(--r-dim))] transition-colors hover:border-[rgb(var(--r-accent))] hover:text-[rgb(var(--r-fg))]"
        >
          {theme === "dark" ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>
    </header>
  );
}
