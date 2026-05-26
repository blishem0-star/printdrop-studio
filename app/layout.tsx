import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SocialProofBar from "@/components/SocialProofBar";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PrintDrop — Custom T-Shirts Made Simple",
  description: "Design and order custom t-shirts in 3 simple steps. Premium quality, fast delivery, AI-powered designs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen" style={{ backgroundColor: '#080808', color: '#fff' }}>
        <Navbar />
        {children}
        <SocialProofBar />
      </body>
    </html>
  );
}
