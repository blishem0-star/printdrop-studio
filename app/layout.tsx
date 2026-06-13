import type { Metadata, Viewport } from "next";
import "./globals.css";
import CursorEffect from '@/components/CursorEffect';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#050507',
};

export const metadata: Metadata = {
  title: { default: "STYLX.AI — Describe it. Wear it.", template: "%s | STYLX.AI" },
  description: "Describe your perfect shirt and AI generates it instantly. Fashion-tech custom printing shipped in 72 hours.",
  keywords: ["ai shirt design", "custom t-shirts", "ai fashion", "print on demand", "personalized shirts", "ai generated clothing"],
  metadataBase: new URL("https://stylx.ai"),
  alternates: { canonical: "https://stylx.ai" },
  icons: { icon: '/favicon.ico', shortcut: '/favicon.ico' },
  openGraph: {
    title: "STYLX.AI — Describe it. Wear it.",
    description: "Describe your perfect shirt and AI generates it instantly. Fashion-tech printing, shipped in 72 hours.",
    type: "website",
    siteName: "STYLX.AI",
    url: "https://stylx.ai",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "STYLX.AI — AI-Powered Custom Shirt Design",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "STYLX.AI — Describe it. Wear it.",
    description: "Type a shirt idea. AI generates it in seconds. Order it printed in 72 hours.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://stylx.ai/#org",
      name: "STYLX.AI",
      url: "https://stylx.ai",
      logo: "https://stylx.ai/opengraph-image",
      description: "AI-powered custom shirt design and printing service.",
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": "https://stylx.ai/#website",
      url: "https://stylx.ai",
      name: "STYLX.AI",
      publisher: { "@id": "https://stylx.ai/#org" },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: "https://stylx.ai/catalog?q={search_term_string}" },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Service",
      name: "AI Custom Shirt Printing",
      provider: { "@id": "https://stylx.ai/#org" },
      description: "Describe any shirt idea and AI generates a unique design. Premium 300 DPI DTG printing shipped in 72 hours.",
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: "24.99",
        availability: "https://schema.org/InStock",
        deliveryLeadTime: { "@type": "QuantitativeValue", value: 3, unitCode: "DAY" },
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        {/* Fonts are self-hosted (public/fonts + @font-face in globals.css); preload the latin subsets */}
        <link rel="preload" href="/fonts/bebas-neue-latin.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/outfit-latin.woff2" as="font" type="font/woff2" crossOrigin="" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning style={{ margin: 0, backgroundColor: '#050507', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <CursorEffect />
        <div id="main-content">
        {children}
        </div>
      </body>
    </html>
  );
}
