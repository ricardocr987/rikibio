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
    <section className="mb-16">
      <h1 className="text-xl font-bold mb-2">My blog posts</h1>
      <ul className="list-disc pl-5 space-y-2">
        {articles.map((article) => (
          <li key={article.slug.id}>
            <Link
              href={`/articles/${article.slug.rich_text[0].plain_text}`}
              onClick={(e) => {
                e.preventDefault();
                handleRedirect(article.slug.rich_text[0].plain_text);
              }}
              className="text-blue-500 hover:underline"
            >
              {article.title.title[0].plain_text}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
