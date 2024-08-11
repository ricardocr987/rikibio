import { ContactSection } from "@/components/ContactSection";
import { Button } from "@/components/ui/button";
import { FaGithub, FaTelegram, FaTwitter } from "react-icons/fa";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { ArticleSection } from "@/components/ArticleSection";

export type Meetings = {
  [date: string]: string[];
};

export type MeetingsData = {
  meetings: Meetings;
  firstDate: string;
};

async function fetchInitialData(): Promise<MeetingsData> {
  const today = new Date();
  const currentTimestamp = today.getTime();
  const snapshot = await db
    .collection("meeting")
    .where("dob", ">=", currentTimestamp)
    .get();

  const meetings: { [date: string]: string[] } = {};
  snapshot.forEach((doc) => {
    const data = doc.data();
    const day = new Date(data.dob).toISOString();

    if (!meetings[day]) {
      meetings[day] = [];
    }

    meetings[day].push(...(data.hours || []));
  });

  today.setHours(0, 0, 0, 0);
  today.setDate(today.getDate() + 1);
  if (today.getDay() === 6) {
    today.setDate(today.getDate() + 2);
  } else if (today.getDay() === 0) {
    today.setDate(today.getDate() + 1);
  }

  const firstDate = today.toISOString();

  return { meetings, firstDate };
}

export default async function Home() {
  const { meetings, firstDate } = await fetchInitialData();

  return (
    <main className="flex flex-col items-center mt-32">
      <section className="mb-16 text-center">
        <div className="flex flex-col md:flex-row items-center justify-center mt-8">
          <div className="md:mr-8">
            <h1 className="mt-2 mb-2 px-4 text-lg md:text-xl font-bold">
              Solana enjoyor
            </h1>
            <div className="flex justify-center mt-4 space-x-4">
              <Button
                asChild
                variant="ghost"
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                <Link href="https://t.me/ricardocr987" target="_blank">
                  <FaTelegram />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="bg-black text-white hover:bg-black/80"
              >
                <Link href="https://github.com/ricardocr987" target="_blank">
                  <FaGithub />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                <Link href="https://twitter.com/ricardocr987" target="_blank">
                  <FaTwitter />
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center order-first md:order-last">
            <img
              src="/pfpHacker.png"
              alt="Ricardo builder mode"
              width="192"
              height="192"
              className="h-52 w-52 rounded-lg object-cover"
            />
          </div>
        </div>
      </section>
      <ArticleSection />
      <ContactSection firstDate={firstDate} meetings={meetings} />
    </main>
  );
}
