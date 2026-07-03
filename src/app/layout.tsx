import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-montserrat",
  display: "swap",
});

const GA_MEASUREMENT_ID = "G-DTB0VR2ZNR";
const SITE_URL = "https://bvb.differentialfactor.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Build vs. Buy SaaS Calculator — Should You Build or Buy?",
    template: "%s | Build vs. Buy Calculator",
  },
  description:
    "Free build vs. buy calculator for SaaS decisions. Compare the 3-year total cost of ownership of building custom software (including AI / vibe-coding velocity) against buying vendor SaaS, and get a clear build-or-buy recommendation.",
  keywords: [
    "build vs buy",
    "build vs buy SaaS",
    "build vs buy calculator",
    "should I build or buy software",
    "should I vibe code my SaaS",
    "vibe coding SaaS",
    "total cost of ownership calculator",
    "TCO build vs buy",
    "custom build vs vendor SaaS",
    "build or buy decision",
    "make vs buy software",
  ],
  authors: [{ name: "Differential Factor" }],
  applicationName: "Build vs. Buy Calculator",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Build vs. Buy Calculator",
    title: "Build vs. Buy SaaS Calculator — Should You Build or Buy?",
    description:
      "Compare the 3-year total cost of ownership of building vs. buying your SaaS, factor in AI / vibe-coding velocity, and get a data-backed build-or-buy recommendation.",
    images: [
      {
        url: "/images/df-logo-full.jpg",
        width: 1200,
        height: 630,
        alt: "Build vs. Buy Calculator by Differential Factor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Build vs. Buy SaaS Calculator — Should You Build or Buy?",
    description:
      "Free TCO calculator: compare building custom software vs. buying vendor SaaS, including AI / vibe-coding velocity.",
    images: ["/images/df-logo-full.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Structured data: helps Google understand the app and surface FAQ rich results
// for queries like "should I build or buy SaaS" and "should I vibe code my SaaS".
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "Build vs. Buy Calculator",
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Free calculator that compares the total cost of ownership of building custom software versus buying vendor SaaS, including AI / vibe-coding build velocity.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@type": "Organization", name: "Differential Factor", url: "https://differentialfactor.com" },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Should I build or buy my SaaS?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "It depends on total cost of ownership over the software's lifespan, how differentiating the capability is, how fast you need it, and your team's build velocity. Commodity needs usually favor buying vendor SaaS; differentiating, long-lived capabilities can favor building. This calculator compares the TCO of both paths over your expected app lifespan (1–5 years) so you can decide with numbers rather than instinct.",
          },
        },
        {
          "@type": "Question",
          name: "Should I vibe code my SaaS instead of buying it?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "AI-assisted ('vibe') coding can dramatically cut build time and cost, which shifts the build-vs-buy math toward building — especially for differentiated features. The calculator lets you model AI model-stack costs and faster build velocity, then shows whether building still beats a vendor SaaS subscription over your chosen horizon.",
          },
        },
        {
          "@type": "Question",
          name: "How do I calculate the total cost of ownership for build vs. buy?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Add up the full multi-year cost of each path. For buying: license, implementation, support, and annual price increases. For building: engineering and AI/model costs, time-to-live, ongoing maintenance, and support. This tool computes both over your chosen horizon (1–5 years, based on expected app lifespan) and recommends the cheaper, lower-risk option for your inputs.",
          },
        },
        {
          "@type": "Question",
          name: "When does building software cost less than buying SaaS?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Building tends to win when the app is highly differentiating, has a long lifespan, vendor SaaS pricing is high or rising fast, and your build velocity is strong (e.g. AI-assisted development). Buying tends to win for short-lived, commodity, or compliance-sensitive needs. Enter your numbers to see the crossover point.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`antialiased bg-df-canvas ${inter.variable} ${montserrat.variable}`}>
      <body className="font-sans text-df-ink bg-df-canvas selection:bg-df-mint/30">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
