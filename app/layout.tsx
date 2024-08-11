import type { Metadata } from "next";
import "./globals.css";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { SolanaContextProvider } from "@/contexts/SolanaProvider";
import { Toaster } from "@/components/ui/toaster";
import { TokenProvider } from "@/contexts/TokenProvider";

export const metadata: Metadata = {
  title: "riki.bio",
  description: "Riki's personal web",
};

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
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
          " bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <SolanaContextProvider>
          <TokenProvider>{children}</TokenProvider>
        </SolanaContextProvider>
        <Toaster />
      </body>
    </html>
  );
}
