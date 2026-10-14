import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ArticleSummary } from "@/lib/mdx";
import { SectionHeading } from "./SectionHeading";

type ArticleProps = {
  articles: ArticleSummary[];
};

export function ArticleSection({ articles }: ArticleProps) {
  return (
    <section id="writing" className="scroll-mt-8 py-20 md:py-28">
      <SectionHeading index="02" title="Blocks of code" />
      <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2 md:[&>li:last-child:nth-child(odd)]:col-span-2">
        {articles.map((article) => (
          <li key={article.slug} className="bg-ink-raised">
            <Link
              href={`/articles/${article.slug}`}
              className="group flex h-full flex-col p-6 transition-colors hover:bg-ink md:p-8"
            >
              <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.14em] text-paper-dim">
                <time dateTime={article.date}>
                  {new Date(article.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                  })}
                </time>
                <ArrowUpRight className="h-4 w-4 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-signal" />
              </div>
              <h3 className="mt-5 font-display text-2xl leading-snug text-paper group-hover:text-signal">
                {article.title}
              </h3>
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-paper-dim">
                {article.description}
              </p>
              <div className="mt-auto flex flex-wrap gap-2 pt-6">
                {article.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[11px] text-paper-dim"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
