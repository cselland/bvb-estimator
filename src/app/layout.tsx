import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="antialiased bg-df-canvas">
      <body className="font-sans text-df-ink bg-df-canvas selection:bg-df-mint/30">
        {children}
      </body>
    </html>
  );
}
