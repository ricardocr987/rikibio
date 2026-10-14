import type { Metadata } from "next";
import "./globals.css";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.riki.bio"),
  title: "Ricardo Castelló · Full-stack engineer",
  description:
    "Senior full-stack engineer shipping trading and payments infrastructure on Solana since 2021, for Jupiter, frnx.ai and Fishnet.",
  openGraph: {
    title: "Ricardo Castelló · Full-stack engineer",
    description:
      "Trading and payments infrastructure on Solana, from programs to production frontends.",
    url: "https://www.riki.bio",
    siteName: "riki.bio",
    type: "website",
  },
};

const fontSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const fontDisplay = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  // Next 14 ships no fallback metrics for Newsreader
  adjustFontFallback: false,
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          "bg-ink font-sans text-paper antialiased",
          fontSans.variable,
          fontMono.variable,
          fontDisplay.variable,
        )}
      >
        {children}
      </body>
    </html>
  );
}
