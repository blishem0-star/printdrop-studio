import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SocialProofBar from "@/components/SocialProofBar";

export const metadata: Metadata = {
  title: "PrintDrop — Custom T-Shirts Made Simple",
  description: "Design and order custom t-shirts in 3 simple steps. Premium quality, fast delivery, AI-powered designs.",
  keywords: ["custom t-shirts", "print on demand", "personalized shirts", "custom printing"],
  openGraph: {
    title: "PrintDrop — Custom T-Shirts Made Simple",
    description: "Design and order custom t-shirts in 3 simple steps.",
    type: "website",
  },
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
