import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SocialProofBar from "@/components/SocialProofBar";

export const metadata: Metadata = {
  title: { default: "PrintDrop — Custom T-Shirts in 72h", template: "%s | PrintDrop" },
  description: "Design a custom t-shirt in 3 steps. 50+ designs, AI generator, or upload your photo. Premium DTG printing, shipped in 72 hours.",
  keywords: ["custom t-shirts", "print on demand", "personalized shirts", "DTG printing", "custom printing", "design your own shirt"],
  metadataBase: new URL("https://printdrop.studio"),
  openGraph: {
    title: "PrintDrop — Custom T-Shirts in 72h",
    description: "Design a custom t-shirt in 3 steps. Premium DTG printing, 300 DPI, shipped in 72 hours.",
    type: "website",
    siteName: "PrintDrop",
  },
  twitter: {
    card: "summary_large_image",
    title: "PrintDrop — Custom T-Shirts in 72h",
    description: "Design a custom t-shirt in 3 steps. AI-powered, premium quality.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ backgroundColor: '#080808', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <Navbar />
        {children}
        <SocialProofBar />
      </body>
    </html>
  );
}
