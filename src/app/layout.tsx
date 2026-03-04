import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="border-b border-black/[.08] dark:border-white/[.1]">
          <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight"
            >
              Hourglass Apps
            </Link>
            <div className="flex gap-6 text-sm">
              <Link
                href="/"
                className="text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
              >
                Apps
              </Link>
              <Link
                href="/blog"
                className="text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
              >
                Blog
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-3xl px-6 py-12">{children}</main>
        <footer className="border-t border-black/[.08] dark:border-white/[.1]">
          <div className="mx-auto max-w-3xl px-6 py-8 text-center text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} Hourglass Apps
          </div>
        </footer>
      </body>
    </html>
  );
}
