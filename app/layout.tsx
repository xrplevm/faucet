import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import Script from "next/script";

const workSans = Work_Sans({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "XRPL EVM Sidechain – Scalability, Compatibility & Speed for Ethereum powered by XRP",
  description:
    "Discover XRPL EVM Sidechain, combining XRPL’s security and speed with full Ethereum compatibility powered by XRP. Build and run your dApps with low fees, fast settlements, and maximum efficiency.",
  keywords: [
    "XRPL EVM Sidechain",
    "Ethereum Virtual Machine",
    "XRPL",
    "Smart Contracts",
    "Blockchain",
    "DeFi",
    "dApps",
    "Ethereum Compatibility",
    "XRP Staking",
    "Interoperability",
    "Web3",
  ],
  openGraph: {
    title: "XRPL EVM Sidechain – The Future of Ethereum Compatibility",
    description:
      "Integrate and scale your applications with XRPL EVM Sidechain, the ultimate blend of security, speed, and Ethereum compatibility.",
    url: "https://xrplevm.org",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-KJN0XF1YMF" strategy="afterInteractive" />
      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-KJN0XF1YMF');
        `}
      </Script>

      {/* 
        Make sure the <body> is "relative" so our absolutely positioned
        images can be placed behind other content via z-[-1].
      */}
      <body className={`${workSans.className} antialiased relative`}>
        {/* Left branding line, pinned from top to bottom, narrower width */}
        <img
          src="/left.svg"
          alt="Branding left"
          className="absolute top-0 bottom-0 left-0 w-69 object-contain pointer-events-none z-[-1]"
        />

        {/* Right branding line, pinned from top to bottom, narrower width */}
        <img
          src="/right.svg"
          alt="Branding right"
          className="absolute top-0 bottom-0 right-0 w-69 object-contain pointer-events-none z-[-1]"
        />

        {children}

        <TailwindIndicator />
      </body>
    </html>
  );
}
