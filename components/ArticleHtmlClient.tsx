"use client";
import * as React from "react";

export function ArticleHtmlClient({ html }: { html: string }) {
  React.useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('copy-btn')) {
        const code = decodeURIComponent(target.getAttribute('data-code') || '');
        navigator.clipboard.writeText(code);
        target.textContent = 'Copied!';
        setTimeout(() => {
          target.textContent = 'Copy';
        }, 1200);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <div
      className="mdx-content prose max-w-none text-gray-900"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
} 