"use client";
import * as React from "react";

export function ArticleHtmlClient({ html }: { html: string }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const handler = (e: Event) => {
      const button = (e.target as HTMLElement).closest(".copy-btn");
      if (!button) return;
      const code = button.closest("figure")?.querySelector("pre")?.textContent;
      if (!code) return;
      navigator.clipboard.writeText(code);
      button.textContent = "Copied";
      button.setAttribute("data-copied", "");
      setTimeout(() => {
        button.textContent = "Copy";
        button.removeAttribute("data-copied");
      }, 1400);
    };
    root.addEventListener("click", handler);
    return () => root.removeEventListener("click", handler);
  }, []);

  return (
    <div
      ref={ref}
      className="reader-prose"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
