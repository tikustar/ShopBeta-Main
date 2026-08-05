import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-nav";
import { AppProviders } from "@/providers/app-providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "ShopBeta — Premium electronics marketplace",
    template: "%s · ShopBeta",
  },
  description:
    "ShopBeta is a premium marketplace for computers, electronics, gadgets, gaming gear, smart home devices, office equipment and networking products.",
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>
        <AppProviders>
          <Header />
          <main id="main" className="pb-20 lg:pb-0">
            {children}
          </main>
          <Footer />
          <MobileBottomNav />
          <div className="h-16 lg:hidden" aria-hidden />
        </AppProviders>
      </body>
    </html>
  );
}
