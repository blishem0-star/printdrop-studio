import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "STYLX.AI — Describe it. Wear it.", template: "%s | STYLX.AI" },
  description: "Describe your perfect shirt and AI generates it instantly. Fashion-tech custom printing shipped in 72 hours.",
  keywords: ["ai shirt design", "custom t-shirts", "ai fashion", "print on demand", "personalized shirts"],
  metadataBase: new URL("https://stylx.ai"),
  openGraph: {
    title: "STYLX.AI — Describe it. Wear it.",
    description: "Describe your perfect shirt and AI generates it instantly. Fashion-tech printing, shipped in 72 hours.",
    type: "website",
    siteName: "STYLX.AI",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning style={{ margin: 0, backgroundColor: '#080808', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
