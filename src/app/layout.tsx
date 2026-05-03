import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/** Matches differentialfactor.com (Inter 300–600 + black for display type) */
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "900"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Build vs. Buy Calculator | Differential Factor",
  description: "B2B SaaS strategic decision tool — compare TCO for custom build vs. vendor SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased bg-df-canvas`}>
      <body className="font-sans text-df-ink bg-df-canvas selection:bg-df-mint/30">
        {children}
      </body>
    </html>
  );
}
