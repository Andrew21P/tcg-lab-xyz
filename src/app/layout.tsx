import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Sora } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const sans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const heading = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "TCG Lab XYZ — Competitive Pokémon TCG Lab",
    template: "%s · TCG Lab XYZ",
  },
  description:
    "TCG Lab XYZ — import a list or Live log, put the board on the table, and measure whether the next card you cut actually wins more prizes.",
  metadataBase: new URL("http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${heading.variable} ${mono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
