import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Marked, Renderer, type Tokens } from 'marked';
import { createHighlighter, type Highlighter } from 'shiki';

export interface Article {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  published: boolean;
  content: string;
  htmlContent: string;
  readingMinutes: number;
}

export type ArticleSummary = Pick<
  Article,
  'slug' | 'title' | 'description' | 'date' | 'tags'
>;

const articlesDirectory = path.join(process.cwd(), 'app/articles');

const SHIKI_LANGS = ['typescript', 'tsx', 'jsx', 'javascript', 'bash', 'sql', 'yaml', 'json', 'rust', 'dotenv'];
const LANG_ALIASES: Record<string, string> = { ts: 'typescript', js: 'javascript', sh: 'bash', shell: 'bash', env: 'dotenv', yml: 'yaml' };

let highlighter: Promise<Highlighter> | null = null;
function getHighlighter() {
  highlighter ??= createHighlighter({ themes: ['vitesse-dark', 'vitesse-light'], langs: SHIKI_LANGS });
  return highlighter;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;|&#\d+;/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Markdown -> HTML for the reader. Code is highlighted at build time by Shiki
// with both themes emitted as CSS variables, so the light/dark toggle needs no
// client-side highlighting.
async function renderMarkdown(markdown: string): Promise<string> {
  const shiki = await getHighlighter();
  const marked = new Marked();
  const tokens = marked.lexer(markdown);

  // The page header already shows the title
  const first = tokens.find((t) => t.type !== 'space');
  if (first?.type === 'heading' && first.depth === 1) {
    tokens.splice(tokens.indexOf(first), 1);
  }

  const highlighted = new WeakMap<Tokens.Code, string>();
  marked.walkTokens(tokens, (token) => {
    if (token.type !== 'code') return;
    const raw = (token.lang || '').toLowerCase();
    const lang = LANG_ALIASES[raw] ?? raw;
    highlighted.set(
      token as Tokens.Code,
      shiki.codeToHtml(token.text, {
        lang: SHIKI_LANGS.includes(lang) ? lang : 'text',
        themes: { dark: 'vitesse-dark', light: 'vitesse-light' },
        defaultColor: false,
      }),
    );
  });

  const usedIds = new Set<string>();

  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        let id = slugify(text) || 'section';
        for (let n = 2; usedIds.has(id); n++) id = `${slugify(text)}-${n}`;
        usedIds.add(id);
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${text}</h${depth}>\n`;
      },
      code(token) {
        const label = token.lang || 'text';
        return `<figure class="code"><figcaption><span>${label}</span><button type="button" class="copy-btn">Copy</button></figcaption>${highlighted.get(token) ?? ''}</figure>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href);
        const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${href}"${title ? ` title="${title}"` : ''}${attrs}>${text}</a>`;
      },
      table(token) {
        return `<div class="table-wrap">${Renderer.prototype.table.call(this, token)}</div>`;
      },
    },
  });

  return marked.parser(tokens);
}

function readingMinutes(markdown: string) {
  return Math.max(1, Math.round(markdown.split(/\s+/).length / 220));
}

export async function getArticleSummaries(): Promise<ArticleSummary[]> {
  const summaries: ArticleSummary[] = [];

  for (const fileName of fs.readdirSync(articlesDirectory)) {
    if (!fileName.endsWith('.mdx')) continue;
    const { data } = matter(
      fs.readFileSync(path.join(articlesDirectory, fileName), 'utf8'),
    );
    if (data.published === false) continue;
    summaries.push({
      slug: fileName.replace(/\.mdx$/, ''),
      title: data.title || fileName,
      description: data.description || '',
      date: data.date || new Date().toISOString(),
      tags: data.tags || [],
    });
  }

  return summaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getArticle(slug: string): Promise<Article | null> {
  try {
    const fullPath = path.join(articlesDirectory, `${slug}.mdx`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    const html = await renderMarkdown(content);

    return {
      slug,
      title: data.title || slug,
      description: data.description || '',
      date: data.date || new Date().toISOString(),
      tags: data.tags || [],
      published: data.published !== false,
      content,
      htmlContent: html,
      readingMinutes: readingMinutes(content),
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