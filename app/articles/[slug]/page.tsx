import * as React from "react";
import { getArticle, getAllSlugs } from "@/lib/mdx";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from 'next/navigation';
import { ArticleHtmlClient } from "@/components/ArticleHtmlClient";

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

export default async function Page({ params }: PageProps) {
  const article = await getArticle(params.slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="flex justify-center min-h-screen w-full bg-transparent py-12 px-2 md:px-0">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-[95vw] p-8 md:p-20">
        <article className="prose prose-invert max-w-none">
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-4 text-gray-900">{article.title}</h1>
            <div className="flex items-center gap-4 text-gray-500 mb-4">
              <time dateTime={article.date}>
                {new Date(article.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm mb-2"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {article.description && (
              <p className="text-xl text-gray-700 mb-6">{article.description}</p>
            )}
          </header>
          <ArticleHtmlClient html={article.htmlContent || ''} />
        </article>
        <div className="flex justify-center mt-12 pb-4">
          <Link href="/">
            <Button>Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
