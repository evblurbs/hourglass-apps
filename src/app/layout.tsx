import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import HourglassBackground from "@/components/HourglassBackground";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hourglass Apps",
  description: "Apps built to make the most of your time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <HourglassBackground />
        <header className="relative z-10 border-b border-black/[.08] dark:border-white/[.1]">
          <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight"
            >
              ⏳ Apps
            </Link>
            <div className="flex gap-6 text-sm">
              <Link
                href="/blog"
                className="text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
              >
                Blog
              </Link>
              <Link
                href="/about"
                className="text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
              >
                About
              </Link>
              <Link
                href="/team"
                className="text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
              >
                Team
              </Link>
            </div>
          </nav>
        </header>
        <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-6 py-12">{children}</main>
        <footer className="relative z-10 mt-auto border-t border-black/[.08] dark:border-white/[.1]">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-6 py-8 text-sm text-zinc-500">
            <div className="flex gap-4">
              <Link
                href="/privacy"
                className="transition-colors hover:text-foreground"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="transition-colors hover:text-foreground"
              >
                Terms &amp; Conditions
              </Link>
            </div>
            <p>&copy; {new Date().getFullYear()} Hourglass Apps</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
