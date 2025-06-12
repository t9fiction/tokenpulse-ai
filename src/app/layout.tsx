import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'TokenPulse AI - Crypto News Aggregator',
  description: 'AI-powered cryptocurrency news aggregation and sentiment analysis',
  keywords: 'cryptocurrency, news, AI, sentiment analysis, bitcoin, ethereum',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThirdwebProvider>
          <div className="relative">
            <Navbar />
            {children}
            </div>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
