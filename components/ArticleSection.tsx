"use client";

import { Article } from "@/lib/notion";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ArticleProps = {
  articles: Article[];
};

export function ArticleSection({ articles }: ArticleProps) {
  const router = useRouter();

  const handleRedirect = (slug: string) => {
    router.push(`/articles/${slug}`);
  };

  return (
    <section className="mb-10">
      <h1 className="text-xl font-bold mb-2 text-white">Sharing my progress</h1>
      <ul className="list-none space-y-2">
        {articles.map((article) => (
          <li key={article.slug.id} className="flex items-center">
            <span className="text-blue-700 mr-2">•</span>
            <Link
              href={`/articles/${article.slug.rich_text[0].plain_text}`}
              onClick={(e) => {
                e.preventDefault();
                handleRedirect(article.slug.rich_text[0].plain_text);
              }}
              className="text-blue-300 hover:underline"
            >
              {article.title.title[0].plain_text}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}