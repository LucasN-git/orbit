import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter_Tight, Space_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "orbit — your social life",
  description:
    "Wer von deinen Leuten gerade in deiner Stadt ist, wer mit dir reist, wer dich treffen will.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F5EC" },
    { media: "(prefers-color-scheme: dark)", color: "#1F1A14" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="de"
      className={`${spaceGrotesk.variable} ${interTight.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-canvas text-ink-primary">
        {children}
      </body>
    </html>
  );
}
