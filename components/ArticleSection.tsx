"use client";

import { Article } from "@/lib/mdx";
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
    <section className="mb-12 mt-8 flex flex-col items-center">
      <h1 className="text-xl font-bold mb-4 text-blue-400 text-center bg-[#18181b] px-4 py-2 rounded-md">
        Blocks of code
      </h1>
      <div className="flex justify-center w-full">
        <ul className="flex flex-col items-center space-y-3 max-w-md">
          {articles.map((article) => (
            <li key={article.slug} className="w-full">
              <Link
                href={`/articles/${article.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleRedirect(article.slug);
                }}
                className="block text-center px-4 py-3 rounded-lg bg-[#23232b] text-blue-400 shadow hover:bg-[#2d2d36] hover:text-blue-300 text-base font-medium transition-colors border border-transparent"
              >
                {article.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}