import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "STYLX.AI — Describe it. Wear it.", template: "%s | STYLX.AI" },
  description: "Describe your perfect shirt and AI generates it instantly. Fashion-tech custom printing shipped in 72 hours.",
  keywords: ["ai shirt design", "custom t-shirts", "ai fashion", "print on demand", "personalized shirts", "ai generated clothing"],
  metadataBase: new URL("https://stylx.ai"),
  alternates: { canonical: "https://stylx.ai" },
  openGraph: {
    title: "STYLX.AI — Describe it. Wear it.",
    description: "Describe your perfect shirt and AI generates it instantly. Fashion-tech printing, shipped in 72 hours.",
    type: "website",
    siteName: "STYLX.AI",
    url: "https://stylx.ai",
    images: [
      {
        url: "/og-image.png",
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
    images: ["/og-image.png"],
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
      logo: "https://stylx.ai/logo.png",
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning style={{ margin: 0, backgroundColor: '#080808', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
