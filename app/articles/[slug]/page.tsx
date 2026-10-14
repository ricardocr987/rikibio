import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getArticle, getAllSlugs, getArticleSummaries } from "@/lib/mdx";
import { ArticleHtmlClient } from "@/components/ArticleHtmlClient";
import { ReaderChrome } from "@/components/reader/ReaderChrome";
import { readerThemeScript } from "@/lib/readerTheme";

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const article = await getArticle(params.slug);
  if (!article) return {};
  return {
    title: `${article.title} · riki.bio`,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: new Date(article.date).toISOString(),
      url: `https://www.riki.bio/articles/${article.slug}`,
    },
  };
}

const stagger = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function Page({ params }: PageProps) {
  const [article, summaries] = await Promise.all([
    getArticle(params.slug),
    getArticleSummaries(),
  ]);

  if (!article) {
    notFound();
  }

  const index = summaries.findIndex((s) => s.slug === article.slug);
  const newer = index > 0 ? summaries[index - 1] : null;
  const older = index >= 0 ? summaries[index + 1] ?? null : null;

  return (
    <div className="reader">
      <script dangerouslySetInnerHTML={{ __html: readerThemeScript }} />
      <ReaderChrome />

      <header className="mx-auto w-full max-w-[46rem] px-6 pb-12 pt-14 md:pb-16 md:pt-20">
        <div>
          <div
            className="stagger mb-6 flex flex-wrap gap-2"
            style={stagger(0)}
          >
            {article.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="reader-tag">
                {tag}
              </span>
            ))}
          </div>
          <h1
            className="stagger font-display text-4xl leading-[1.08] tracking-tight text-[rgb(var(--r-fg))] md:text-[3.25rem]"
            style={stagger(1)}
          >
            {article.title}
          </h1>
          {article.description && (
            <p
              className="stagger mt-6 text-lg leading-relaxed text-[rgb(var(--r-dim))]"
              style={stagger(2)}
            >
              {article.description}
            </p>
          )}
          <p
            className="stagger mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-[0.14em] text-[rgb(var(--r-dim))]"
            style={stagger(3)}
          >
            <span>Ricardo Castelló</span>
            <span aria-hidden>·</span>
            <time dateTime={new Date(article.date).toISOString()}>
              {new Date(article.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span aria-hidden>·</span>
            <span>{article.readingMinutes} min read</span>
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[46rem] border-t border-[rgb(var(--r-line))] px-6 pt-12">
        <article className="stagger" style={stagger(4)}>
          <ArticleHtmlClient html={article.htmlContent} />
        </article>
      </div>

      <footer className="mx-auto mt-20 w-full max-w-[46rem] px-6 pb-16">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-[rgb(var(--r-line))] bg-[rgb(var(--r-line))] md:grid-cols-2">
          {older ? (
            <Link href={`/articles/${older.slug}`} className="reader-pager">
              <span className="flex items-center gap-2">
                <ArrowLeft className="h-3.5 w-3.5" /> Older
              </span>
              <strong>{older.title}</strong>
            </Link>
          ) : (
            <div className="reader-pager" aria-hidden />
          )}
          {newer ? (
            <Link
              href={`/articles/${newer.slug}`}
              className="reader-pager md:items-end md:text-right"
            >
              <span className="flex items-center gap-2">
                Newer <ArrowRight className="h-3.5 w-3.5" />
              </span>
              <strong>{newer.title}</strong>
            </Link>
          ) : (
            <Link href="/#writing" className="reader-pager md:items-end md:text-right">
              <span className="flex items-center gap-2">
                All articles <ArrowRight className="h-3.5 w-3.5" />
              </span>
              <strong>Back to riki.bio</strong>
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}
