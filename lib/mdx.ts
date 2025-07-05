import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface Article {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  published: boolean;
  content: string;
  htmlContent?: string;
}

const articlesDirectory = path.join(process.cwd(), 'app/articles');

// Improved markdown to HTML converter with VSCode-like code blocks
function markdownToHtml(markdown: string): string {
  // Handle code blocks first
  let html = markdown.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    let escaped = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    escaped = escaped.replace(/\n$/, '');
    escaped = escaped.replace(/^\n+|\n+$/g, '');

    // Highlight comments first
    escaped = escaped.replace(/(\/\/.*)/g, '<span class="token-comment">$1</span>');
    // Highlight strings (but not inside comments)
    escaped = escaped.replace(/(<span class=\"token-comment\">[\s\S]*?<\/span>)|('[^']*'|\"[^\"]*\"|`[^`]*`)/g, (m: string, comment: string, str: string): string => {
      if (comment) return comment;
      if (str) return `<span class=\"token-string\">${str}</span>`;
      return m;
    });
    // Highlight keywords, numbers, function names (but not inside comments/strings)
    escaped = escaped.replace(/(<span class=\"token-(comment|string)\">[\s\S]*?<\/span>)|\b(const|let|var|function|async|await|if|else|return|for|while|switch|case|break|continue|throw|new|typeof|class|extends|constructor|super|import|from|export|default|try|catch|finally|Promise|void|undefined|null|true|false)\b/g, (m: string, span: string, type: string, kw: string): string => {
      if (span) return span;
      if (kw) return `<span class=\"token-keyword\">${kw}</span>`;
      return m;
    });
    escaped = escaped.replace(/(<span class=\"token-(comment|string|keyword)\">[\s\S]*?<\/span>)|(\b\d+(?:\.\d+)?\b)/g, (m: string, span: string, type: string, num: string): string => {
      if (span) return span;
      if (num) return `<span class=\"token-number\">${num}</span>`;
      return m;
    });
    escaped = escaped.replace(/(<span class=\"token-(comment|string|keyword|number)\">[\s\S]*?<\/span>)|([a-zA-Z0-9_]+)(?=\s*\()/g, (m: string, span: string, type: string, fn: string): string => {
      if (span) return span;
      if (fn) return `<span class=\"token-function\">${fn}</span>`;
      return m;
    });

    // Remove all newlines at the start and end, but keep internal newlines
    return `<div class="vscode-codeblock not-prose code-block-wrapper relative my-12">
        <button class="copy-btn absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded border border-[#23232b] text-gray-200 font-mono" data-code="${encodeURIComponent(code)}">Copy</button>
        <pre class="code-block bg-[#18181b] text-[#d4d4d4] font-mono text-sm p-4 rounded-lg overflow-x-auto border border-[#23232b]" style="white-space:pre; margin:0;"><code>${escaped}</code></pre>
      </div>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-200 text-gray-900 px-1 py-0.5 rounded text-sm font-mono">$1</code>');

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mt-8 mb-4">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
    .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>');
  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li[\s\S]*?<\/li>)/g, '<ul class="list-disc my-4">$1</ul>');

  // Paragraphs: only wrap lines not already in block tags and not inside code blocks
  // Split by \n, but skip lines that are inside <div class="vscode-codeblock ..."> ... </div>
  let inCodeBlock = false;
  html = html.split('\n').map(line => {
    if (line.includes('<div class="vscode-codeblock')) inCodeBlock = true;
    if (inCodeBlock) {
      if (line.includes('</div>')) inCodeBlock = false;
      return line;
    }
    if (
      /^\s*<\/?(h[1-6]|ul|li|pre|code|blockquote|p|img|table|thead|tbody|tr|th|td|a|strong|em|div|button)/.test(line.trim()) ||
      line.trim() === ''
    ) {
      return line;
    }
    return `<p class="my-4">${line}</p>`;
  }).join('\n');

  // Remove empty paragraphs
  html = html.replace(/<p class="my-4">\s*<\/p>/g, '');

  return html;
}

export async function getArticles(): Promise<Article[]> {
  const fileNames = fs.readdirSync(articlesDirectory);
  const articles: Article[] = [];

  for (const fileName of fileNames) {
    if (fileName.endsWith('.mdx')) {
      const slug = fileName.replace(/\.mdx$/, '');
      const fullPath = path.join(articlesDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      if (data.published !== false) {
        articles.push({
          slug,
          title: data.title || slug,
          description: data.description || '',
          date: data.date || new Date().toISOString(),
          tags: data.tags || [],
          published: data.published !== false,
          content,
          htmlContent: markdownToHtml(content),
        });
      }
    }
  }

  // Sort articles by date (newest first)
  return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getArticle(slug: string): Promise<Article | null> {
  try {
    const fullPath = path.join(articlesDirectory, `${slug}.mdx`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      title: data.title || slug,
      description: data.description || '',
      date: data.date || new Date().toISOString(),
      tags: data.tags || [],
      published: data.published !== false,
      content,
      htmlContent: markdownToHtml(content),
    };
  } catch (error) {
    return null;
  }
}

export async function getAllSlugs(): Promise<string[]> {
  const fileNames = fs.readdirSync(articlesDirectory);
  return fileNames
    .filter(fileName => fileName.endsWith('.mdx'))
    .map(fileName => fileName.replace(/\.mdx$/, ''));
} 