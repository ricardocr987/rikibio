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
      className="mdx-content prose prose-lg dark:prose-invert max-w-none text-gray-900 dark:text-gray-100
        prose-headings:text-gray-900 dark:prose-headings:text-white
        prose-h1:text-3xl prose-h1:font-bold prose-h1:mt-8 prose-h1:mb-6
        prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4
        prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3
        prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:my-4
        prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold
        prose-em:text-gray-700 dark:prose-em:text-gray-300 prose-em:italic
        prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline prose-a:font-medium
        prose-a:hover:text-blue-800 dark:prose-a:hover:text-blue-300 prose-a:hover:underline
        prose-ul:my-4 prose-ol:my-4 prose-li:my-1
        prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:my-6
        prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300
        prose-code:text-gray-900 dark:prose-code:text-gray-100 prose-code:bg-gray-100 dark:prose-code:bg-gray-800
        prose-pre:bg-gray-900 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700
        prose-img:rounded-lg prose-img:shadow-lg prose-img:my-6
        prose-hr:my-8 prose-hr:border-gray-300 dark:prose-hr:border-gray-600"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
} 