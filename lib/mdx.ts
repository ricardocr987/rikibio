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
    // Safely encode code for base64, handling Unicode characters
    const safeCode = Buffer.from(code, 'utf8').toString('base64');
    
    return `<div class="vscode-codeblock not-prose code-block-wrapper relative my-12">
        <button class="copy-btn absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded border border-[#23232b] text-gray-200 font-mono" data-code="${safeCode}">Copy</button>
        <pre class="code-block bg-[#18181b] text-[#d4d4d4] font-mono text-sm p-4 rounded-lg overflow-x-auto border border-[#23232b]" style="white-space:pre; margin:0;"><code>${escaped}</code></pre>
      </div>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>');

  // Headers with better spacing
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mt-10 mb-6 text-gray-900 dark:text-white">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-10 mb-6 text-gray-900 dark:text-white">$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium underline" target="_blank" rel="noopener noreferrer">$1</a>');

  // Lists with better spacing
  html = html.replace(/^\* (.*$)/gim, '<li class="ml-4 my-1 text-gray-700 dark:text-gray-300">$1</li>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 my-1 text-gray-700 dark:text-gray-300">$1</li>');
  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li[\s\S]*?<\/li>)/g, '<ul class="list-disc my-4 space-y-1">$1</ul>');

  // Numbered lists
  html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 my-1 text-gray-700 dark:text-gray-300">$1</li>');
  html = html.replace(/(<li[\s\S]*?<\/li>)/g, '<ol class="list-decimal my-4 space-y-1">$1</ol>');

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 my-6 italic text-gray-700 dark:text-gray-300">$1</blockquote>');

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr class="my-8 border-gray-300 dark:border-gray-600">');

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
      /^\s*<\/?(h[1-6]|ul|ol|li|pre|code|blockquote|p|img|table|thead|tbody|tr|th|td|a|strong|em|div|button|hr)/.test(line.trim()) ||
      line.trim() === ''
    ) {
      return line;
    }
    return `<p class="my-4 text-gray-700 dark:text-gray-300 leading-relaxed">${line}</p>`;
  }).join('\n');

  // Remove empty paragraphs
  html = html.replace(/<p class="my-4 text-gray-700 dark:text-gray-300 leading-relaxed">\s*<\/p>/g, '');

  // Add extra spacing around sections
  html = html.replace(/<h2/g, '<div class="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700"><h2');
  html = html.replace(/<\/h2>/g, '</h2></div>');

  // Special styling for Production Considerations section
  html = html.replace(
    /<h2[^>]*>Production Considerations<\/h2>/g,
    '<h2 class="text-2xl font-semibold mt-10 mb-6 text-gray-900 dark:text-white bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 rounded-lg border-l-4 border-blue-500">Production Considerations</h2>'
  );

  // Special styling for subsections within Production Considerations
  html = html.replace(
    /<h3[^>]*>Security Enhancements<\/h3>/g,
    '<h3 class="text-xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20 p-2 rounded border-l-4 border-green-500">Security Enhancements</h3>'
  );
  html = html.replace(
    /<h3[^>]*>Performance Optimizations<\/h3>/g,
    '<h3 class="text-xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20 p-2 rounded border-l-4 border-yellow-500">Performance Optimizations</h3>'
  );
  html = html.replace(
    /<h3[^>]*>Monitoring and Logging<\/h3>/g,
    '<h3 class="text-xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20 p-2 rounded border-l-4 border-purple-500">Monitoring and Logging</h3>'
  );
  html = html.replace(
    /<h3[^>]*>Testing Strategy<\/h3>/g,
    '<h3 class="text-xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20 p-2 rounded border-l-4 border-pink-500">Testing Strategy</h3>'
  );

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