import type { Metadata, Viewport } from "next";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#050507',
};

export const metadata: Metadata = {
  title: { default: "STYLX - Describe it. Wear it.", template: "%s | STYLX" },
  description: "Create custom apparel from an idea, personalize the design, and submit an order request in minutes.",
  keywords: ["custom shirt design", "custom t-shirts", "design your own shirt", "print on demand", "personalized shirts", "custom apparel"],
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: SITE_URL },
  icons: { icon: '/favicon.ico', shortcut: '/favicon.ico' },
  openGraph: {
    title: "STYLX - Describe it. Wear it.",
    description: "Create custom apparel from an idea, personalize the design, and submit an order request in minutes.",
    type: "website",
    siteName: "STYLX",
    url: SITE_URL,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "STYLX - Custom Shirt Design Studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "STYLX - Describe it. Wear it.",
    description: "Type a shirt idea, personalize it, and turn it into a custom apparel order.",
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
      "@id": `${SITE_URL}/#org`,
      name: "STYLX",
      url: SITE_URL,
      logo: `${SITE_URL}/opengraph-image`,
      description: "Custom shirt design and printing, made to order.",
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "STYLX",
      publisher: { "@id": `${SITE_URL}/#org` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/catalog?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Service",
      name: "Custom Shirt Printing",
      provider: { "@id": `${SITE_URL}/#org` },
      description: "Describe any apparel idea, personalize the design, and submit it as a custom order request.",
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: "24.99",
        availability: "https://schema.org/InStock",
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
        <div id="main-content">
        {children}
        </div>
      </body>
    </html>
  );
}
