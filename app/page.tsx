import Image from "next/image";
import Link from "next/link";
import { FaGithub, FaTelegram, FaXTwitter } from "react-icons/fa6";
import { ArrowDownToLine, ArrowRight } from "lucide-react";
import { ArticleSection } from "@/components/ArticleSection";
import { SectionHeading } from "@/components/SectionHeading";
import { BlockField } from "@/components/BlockField";
import { getArticleSummaries } from "@/lib/mdx";
import portrait from "@/public/pfpHacker.png";

const socials = [
  { href: "https://github.com/ricardocr987", label: "GitHub", icon: FaGithub },
  { href: "https://t.me/ricardocr987", label: "Telegram", icon: FaTelegram },
  { href: "https://twitter.com/ricardocr987", label: "X", icon: FaXTwitter },
];

const work = [
  {
    year: "2026",
    name: "Jupiter",
    role: "Full-stack",
    summary:
      "Co-built the Telegram trading and prediction bots from launch to 14,000 users. Webhook backend for copy trading, gasless transactions, Privy wallets and Mini Apps.",
  },
  {
    year: "2025",
    name: "frnx.ai",
    role: "Full-stack",
    summary:
      "Solana transaction layer for swaps, staking, subscriptions and blinks. Delegate Vault: a program that liquidates portfolios on stop-loss, take-profit or time triggers.",
  },
  {
    year: "2023",
    name: "Fishnet",
    role: "Full-stack",
    summary:
      "Solana Pay payment and monetization components with wallet auth.",
  },
  {
    year: "2022",
    name: "Aleph.im",
    role: "Backend",
    summary:
      "Open-source Solana indexers turning on-chain transactions into queryable data for DeFi protocols.",
  },
];

export default async function Home() {
  const articles = await getArticleSummaries();

  return (
    <>
      <div className="backdrop" aria-hidden>
        <BlockField />
      </div>
      <header className="stagger mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <Link href="/" className="font-mono text-sm tracking-tight text-paper" data-blocks-avoid>
          riki<span className="text-signal">.</span>bio
        </Link>
        <nav className="flex items-center gap-6 font-mono text-xs uppercase tracking-[0.14em] text-paper-dim" data-blocks-avoid>
          <a href="#work" className="hidden hover:text-paper sm:inline">
            Experience
          </a>
          <a href="#writing" className="hidden hover:text-paper sm:inline">
            Writing
          </a>
          <a
            href="/CV.pdf"
            download
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-paper transition-colors hover:border-signal hover:text-signal"
          >
            CV <ArrowDownToLine className="h-3.5 w-3.5" />
          </a>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <section className="grid items-end gap-12 pb-16 pt-10 md:grid-cols-[1fr_auto] md:pb-24 md:pt-20">
          <div>
            <p
              className="stagger mb-8 inline-flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.14em] text-paper-dim" data-blocks-avoid
              style={{ "--i": 1 } as React.CSSProperties}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
              </span>
              Open to work · Alicante, remote
            </p>
            <h1
              className="stagger max-w-2xl font-display text-[2.6rem] leading-[1.05] tracking-tight text-paper sm:text-5xl md:text-6xl" data-blocks-avoid
              style={{ "--i": 2 } as React.CSSProperties}
            >
              I build trading &amp; payments infrastructure{" "}
              <em className="text-signal">on Solana.</em>
            </h1>
            <p
              className="stagger mt-8 max-w-xl text-lg leading-relaxed text-paper-dim" data-blocks-avoid
              style={{ "--i": 3 } as React.CSSProperties}
            >
              Ricardo Castelló, senior full-stack engineer. Since 2021 I&apos;ve
              shipped production systems for{" "}
              <span className="text-paper">Jupiter</span>,{" "}
              <span className="text-paper">frnx.ai</span> and{" "}
              <span className="text-paper">Fishnet</span>, owning delivery end
              to end, from on-chain programs to backend APIs and the frontends
              people use. Now also running{" "}
              <a
                href="https://brickstudio.es"
                target="_blank"
                rel="noopener noreferrer"
                className="text-paper underline decoration-signal/60 underline-offset-4 transition-colors hover:text-signal"
              >
                Brick Studio
              </a>
              , a web agency for small businesses.
            </p>
            <div
              className="stagger mt-10 flex flex-wrap items-center gap-4" data-blocks-avoid
              style={{ "--i": 4 } as React.CSSProperties}
            >
              <a
                href="https://t.me/ricardocr987"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-signal px-6 py-3 font-medium text-ink transition-transform hover:-translate-y-0.5"
              >
                Message me
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="/CV.pdf"
                download
                className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-paper transition-colors hover:border-paper/60"
              >
                Download CV
              </a>
              <div className="ml-1 flex items-center gap-1">
                {socials.map(({ href, label, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="rounded-full p-2.5 text-paper-dim transition-colors hover:text-signal"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <figure
            className="stagger relative mx-auto w-56 md:mx-0 md:w-72" data-blocks-avoid
            style={{ "--i": 3 } as React.CSSProperties}
          >
            <div className="absolute -inset-3 rounded-[1.75rem] border border-line" />
            <Image
              src={portrait}
              alt="Ricardo Castelló"
              priority
              placeholder="blur"
              sizes="(min-width: 768px) 288px, 224px"
              className="relative aspect-[4/5] w-full rounded-2xl object-cover"
            />
          </figure>
        </section>

        <section id="work" className="scroll-mt-8 py-20 md:py-28" data-blocks-avoid>
          <SectionHeading index="01" title="Experience" />
          <ol className="border-t border-line">
            {work.map((item) => (
              <li
                key={item.name}
                className="grid gap-2 border-b border-line py-6 md:grid-cols-[5rem_14rem_1fr] md:gap-6"
              >
                <span className="font-mono text-sm text-paper-dim">
                  {item.year}
                </span>
                <div>
                  <span className="font-display text-2xl text-paper">
                    {item.name}
                  </span>
                  <span className="mt-1 block font-mono text-xs uppercase tracking-[0.14em] text-paper-dim">
                    {item.role}
                  </span>
                </div>
                <p className="max-w-2xl leading-relaxed text-paper-dim">
                  {item.summary}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <ArticleSection articles={articles} />
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-8 font-mono text-xs text-paper-dim md:px-10">
        <span>© {new Date().getFullYear()} Ricardo Castelló Román</span>
        <a
          href="https://brickstudio.es"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-signal"
        >
          brickstudio.es ↗
        </a>
        <a href="mailto:ricardocr987@gmail.com" className="hover:text-signal">
          ricardocr987@gmail.com
        </a>
      </footer>
    </>
  );
}
