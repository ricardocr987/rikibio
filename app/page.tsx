import { ContactSection } from "@/components/ContactSection";
import { Button } from "@/components/ui/button";
import { FaGithub, FaTelegram, FaTwitter } from "react-icons/fa";
import Link from "next/link";
import { ArticleSection } from "@/components/ArticleSection";
import { Article, getArticles } from "@/lib/notion";
import ky from "ky";
import config from "@/lib/config";

export type Meetings = {
  [date: string]: string[];
};

type InitialData = {
  meetings: Meetings;
  firstDate: string;
  articles: Article[];
};

async function getInitialData(): Promise<InitialData> {
  const { meetings, firstDate } = await ky.get(`${config.APP_URL}/api/initialData`, {
    cache: 'no-store',
  }).json<InitialData>();
  
  const articles = await getArticles();

  return { meetings, firstDate, articles };
}

export default async function Home() {
  const { meetings, firstDate, articles } = await getInitialData();

  return (
    <main className="flex flex-col items-center mt-16 md:mt-24 mb-8">
      <section className="mb-4 text-center">
        <div className="flex flex-col items-center">
          <img
            src="/pfpHacker.png"
            alt="Ricardo builder mode"
            className="h-48 w-48 rounded-lg object-cover mb-4"
          />
          <div className="flex space-x-4">
            <Button
              asChild
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              <Link href="https://t.me/ricardocr987" target="_blank">
                <FaTelegram />
              </Link>
            </Button>
            <Button
              asChild
              className="bg-black text-white hover:bg-black/80"
            >
              <Link href="https://github.com/ricardocr987" target="_blank">
                <FaGithub />
              </Link>
            </Button>
            <Button
              asChild
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              <Link href="https://twitter.com/ricardocr987" target="_blank">
                <FaTwitter />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <ArticleSection articles={articles} />
      <ContactSection firstDate={firstDate} meetings={meetings} />
    </main>
  );
}