import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { PageVisitTracker } from "@/components/analytics/page-visit-tracker";
import { AppProviders } from "@/providers/app-providers";
import { CatalogNavProvider } from "@/providers/catalog-nav-provider";
import { toBrandViews, toCategoryViews } from "@/lib/catalog-view";
import {
  getBrands,
  getCategories,
  getPopularSearchTerms,
} from "@/services/catalog.service";
import {
  APP_DESCRIPTOR,
  APP_NAME,
  APP_TAGLINE,
  BRAND_SOCIAL_IMAGE,
  BRAND_THEME_COLOR,
} from "@/constants/app";
import { publicSiteUrl } from "@/lib/site-url";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const siteUrl = publicSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: `${APP_NAME} — ${APP_DESCRIPTOR}`,
  title: {
    default: `${APP_NAME} — ${APP_DESCRIPTOR}`,
    template: `%s · ${APP_NAME}`,
  },
  description: `${APP_NAME} ${APP_DESCRIPTOR}: shop electronics, gadgets, home essentials and everyday products across Nigeria. ${APP_TAGLINE}`,
  keywords: [
    APP_NAME,
    `${APP_NAME} ${APP_DESCRIPTOR}`,
    "online shopping Nigeria",
    "electronics",
    "gadgets",
    "phones",
    "home essentials",
    "Nigeria",
  ],
  alternates: { canonical: siteUrl },
  openGraph: {
    type: "website",
    siteName: `${APP_NAME} — ${APP_DESCRIPTOR}`,
    title: `${APP_NAME} — ${APP_DESCRIPTOR}`,
    description: APP_TAGLINE,
    url: siteUrl,
    locale: "en_NG",
    images: [
      {
        url: BRAND_SOCIAL_IMAGE,
        width: 1080,
        height: 602,
        alt: `${APP_NAME} — ${APP_DESCRIPTOR}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — ${APP_DESCRIPTOR}`,
    description: APP_TAGLINE,
    images: [BRAND_SOCIAL_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  themeColor: BRAND_THEME_COLOR,
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let categories: ReturnType<typeof toCategoryViews> = [];
  let brands: ReturnType<typeof toBrandViews> = [];
  let popularSearches: string[] = [];
  try {
    const [categoryDocs, brandDocs, popular] = await Promise.all([
      getCategories(),
      getBrands(),
      getPopularSearchTerms(),
    ]);
    categories = toCategoryViews(categoryDocs);
    brands = toBrandViews(brandDocs);
    popularSearches = popular;
  } catch {
    // Layout still renders if Firestore is unavailable.
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-5 focus:py-3 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>
        <AppProviders>
          <CatalogNavProvider value={{ categories, brands, popularSearches }}>
            <AppShell>{children}</AppShell>
            <PageVisitTracker />
          </CatalogNavProvider>
        </AppProviders>
      </body>
    </html>
  );
}
