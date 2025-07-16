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
    <div className="flex justify-center min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-6 px-4 md:px-8">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-5xl w-full p-6 md:p-10 lg:p-12">
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <header className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white leading-tight">
              {article.title}
            </h1>
            <div className="flex flex-col md:flex-row md:items-center gap-3 text-gray-600 dark:text-gray-400 mb-4">
              <time 
                dateTime={article.date}
                className="flex items-center text-sm font-medium"
              >
                {new Date(article.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {article.description && (
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {article.description}
              </p>
            )}
          </header>
          
          <div className="article-content">
            <ArticleHtmlClient html={article.htmlContent || ''} />
          </div>
        </article>
        
        <div className="flex justify-center mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link href="/">
            <Button 
              variant="outline" 
              size="lg"
              className="px-6 py-2 text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ← Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
