import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  HeartHandshake,
  Sparkles,
  Truck,
  Zap,
} from "lucide-react";
import { type Product as ProductView } from "@/lib/data";
import type { Product } from "@/types/product";
import { HOME_HERO_PRODUCT_SLUG } from "@/constants/app";
import { HomeHero } from "@/components/commerce/home-hero";
import { CategoryCarousel } from "@/components/commerce/category-carousel";
import { formatPrice } from "@/lib/utils";
import { toBrandViews, toCategoryViews } from "@/lib/catalog-view";
import { toProductViews, toProductView } from "@/lib/product-view";
import { Countdown } from "@/components/commerce/countdown";
import { endOfTodayISO } from "@/lib/datetime";
import {
  buildListingMetadata,
  JsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { getHomeCatalogSections } from "@/services/products.service";
import { getBrands, getCategories } from "@/services/catalog.service";
import { RecentlyViewedRail } from "@/components/commerce/recently-viewed";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/card";
import { CategoryTile } from "@/components/commerce/category-card";
import {
  CatalogEmpty,
  CatalogError,
  CatalogRail,
} from "@/components/commerce/catalog-state";
import { BrandMark, ProductMedia } from "@/components/commerce/product-media";

const trustPoints = [
  {
    icon: Truck,
    title: "Express delivery",
    body: "Fast delivery across Lagos and Abuja, with tracking from checkout to your door.",
  },
  {
    icon: CreditCard,
    title: "Pay your way",
    body: "Card, bank transfer and USSD through secure gateways — or pay on delivery where available.",
  },
  {
    icon: BadgeCheck,
    title: "Genuine products",
    body: "Products sourced from trusted brands and distributors, described honestly.",
  },
  {
    icon: HeartHandshake,
    title: "Care that hugs back",
    body: "Real support for orders, refunds and returns whenever you need a hand.",
  },
];

export const revalidate = 60;

export const metadata = buildListingMetadata({
  title: "Shop electronics & gadgets",
  description:
    "Zenvexa catalogue — flash sales, featured picks, trending products and recently added stock.",
  path: "/",
});

/** Configured hero product when sellable, otherwise the next best sellable product. */
function pickHeroProduct(catalog: Product[], fallback?: Product) {
  const sellable = (product?: Product): product is Product =>
    !!product &&
    product.active !== false &&
    product.stock > 0 &&
    product.price > 0 &&
    !!(product.thumbnail ?? product.images?.[0]);
  const configured = catalog.find((product) => product.slug === HOME_HERO_PRODUCT_SLUG);
  if (sellable(configured)) return configured;
  if (sellable(fallback)) return fallback;
  return catalog.find((product) => product.featured && sellable(product)) ?? catalog.find(sellable);
}

async function loadSections() {
  const [home, categoryDocs, brandDocs] = await Promise.all([
    getHomeCatalogSections(4),
    getCategories(),
    getBrands(),
  ]);

  const heroSource = pickHeroProduct(home.catalog, home.heroSource);
  const hero: ProductView | undefined = heroSource
    ? toProductView(heroSource)
    : undefined;

  return {
    hero,
    flash: toProductViews(home.flash),
    featured: toProductViews(home.featured),
    trending: toProductViews(home.trending),
    recent: toProductViews(home.recent),
    best: toProductViews(home.best),
    offers: toProductViews(home.offers),
    categories: toCategoryViews(categoryDocs),
    brands: toBrandViews(brandDocs),
  };
}

type Sections = Omit<Awaited<ReturnType<typeof loadSections>>, "hero"> & {
  hero?: ProductView;
};

const EMPTY_SECTIONS: Sections = {
  hero: undefined,
  flash: [],
  featured: [],
  trending: [],
  recent: [],
  best: [],
  offers: [],
  categories: [],
  brands: [],
};

export default async function HomePage() {
  let failed = false;
  let sections = EMPTY_SECTIONS;
  try {
    sections = await loadSections();
  } catch {
    failed = true;
  }
  const {
    hero,
    flash,
    featured,
    trending,
    recent,
    best,
    offers,
    categories,
    brands,
  } = sections;

  return (
    <div className="sb-container">
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      {/* Hero */}
      <div className="pt-5 lg:pt-7">
        {hero ? (
          <HomeHero product={hero} />
        ) : failed ? (
          <CatalogError />
        ) : (
          <CatalogEmpty
            title="No products yet"
            description="The featured product appears once the catalogue has products."
          />
        )}
      </div>

      {/* Promotions */}
      <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.35fr]">
        <Link
          href="/deals"
          className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-3xl border border-accent-200 bg-accent-100 p-6 sm:p-7"
        >
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              <Zap className="h-3.5 w-3.5" aria-hidden />
              Flash sale
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-[-0.02em] text-primary-800">
              Today&apos;s hottest Awoof deals
            </h2>
            <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary">
              Shop the sale
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </div>
          <Zap className="h-16 w-16 shrink-0 text-primary/15" aria-hidden />
        </Link>

        <div className="flex flex-col items-start justify-between gap-5 rounded-3xl border border-line bg-white p-6 sm:flex-row sm:items-center sm:p-7">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent">
              <Sparkles className="h-5 w-5 text-primary-800" aria-hidden />
            </span>
            <div>
              <p className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
                Shop now, pay your way
              </p>
              <p className="mt-1 text-[13px] text-muted">
                Pay securely by card, bank transfer or USSD — or choose pay on delivery where available.
              </p>
            </div>
          </div>
          <ButtonLink href="/help" variant="subtle" className="shrink-0">
            How payment works
          </ButtonLink>
        </div>
      </section>

      {/* Categories */}
      <section className="pt-12 sm:pt-14">
        {categories.length ? (
          <CategoryCarousel
            categories={categories}
            actions={
              <ButtonLink href="/products" variant="outline" size="sm">
                All categories
              </ButtonLink>
            }
          />
        ) : failed ? (
          <CatalogError />
        ) : (
          <CatalogEmpty description="Categories appear once the catalogue has been set up." />
        )}
      </section>

      {/* Flash sale */}
      <section className="pt-16 sm:pt-20">
        <div className="overflow-hidden rounded-3xl border border-line bg-white">
          <div className="flex flex-wrap items-center justify-between gap-5 border-b border-line bg-soft/60 p-6 sm:p-7">
            <div>
              <p className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                <Zap className="h-3.5 w-3.5" aria-hidden />
                Flash sale
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.025em] text-ink">
                Ends tonight at midnight
              </h2>
            </div>
            <div className="flex items-center gap-5">
              <Countdown endsAt={endOfTodayISO()} />
              <ButtonLink href="/deals" variant="outline" size="sm" className="hidden sm:inline-flex">
                See all
              </ButtonLink>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <CatalogRail
              items={flash}
              failed={failed}
              emptyDescription="No flash sale products are live right now."
            />
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="pt-16 sm:pt-20">
        <SectionHeading
          eyebrow="Handpicked"
          title="Featured products"
          description="Chosen by our buyers for build quality, support and resale value."
          action={
            <ButtonLink href="/products" variant="outline" size="sm">
              View all
            </ButtonLink>
          }
        />
        <CatalogRail items={featured} failed={failed} />
      </section>

      {/* Trending */}
      <section className="pt-16 sm:pt-20">
        <SectionHeading
          eyebrow="Moving fast"
          title="Trending this week"
          action={
            <ButtonLink href="/products" variant="outline" size="sm">
              View all
            </ButtonLink>
          }
        />
        <CatalogRail items={trending} failed={failed} />
      </section>

      {/* Recently added */}
      <section className="pt-16 sm:pt-20">
        <SectionHeading
          eyebrow="Just landed"
          title="Recently added"
          action={
            <ButtonLink href="/products?sort=newest" variant="outline" size="sm">
              New arrivals
            </ButtonLink>
          }
        />
        <CatalogRail items={recent} failed={failed} />
      </section>

      {/* Best sellers */}
      <section className="pt-16 sm:pt-20">
        <SectionHeading
          eyebrow="Most ordered"
          title="Best sellers"
          action={
            <ButtonLink href="/products" variant="outline" size="sm">
              View all
            </ButtonLink>
          }
        />
        <CatalogRail items={best} failed={failed} />
      </section>

      {/* Top brands */}
      <section className="pt-16 sm:pt-20">
        <SectionHeading
          eyebrow="Trusted names"
          title="Top brands"
          description="Shop the brands Nigerians trust, all in one place."
          action={
            <ButtonLink href="/brands" variant="outline" size="sm">
              All brands
            </ButtonLink>
          }
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {brands.slice(0, 12).map((brand) => (
            <Link
              key={brand.slug}
              href="/brands"
              className="group flex flex-col items-center gap-3 rounded-2xl border border-line bg-white p-5 transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-transparent hover:sb-shadow-soft"
            >
              <BrandMark initials={brand.initials} className="transition-colors group-hover:bg-primary-50" />
              <span className="text-center text-[13px] font-medium text-ink">{brand.name}</span>
              <span className="text-[11px] text-muted">{brand.productCount} products</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Special offers */}
      <section className="pt-16 sm:pt-20">
        <SectionHeading
          eyebrow="Bundles"
          title="Special offers"
          description="Curated collections with the discount already applied."
        />
        {failed ? <CatalogError /> : null}
        {!failed && !offers.length ? (
          <CatalogEmpty description="No discounted products are available right now." />
        ) : null}
        <div className="grid gap-4 md:grid-cols-3">
          {offers.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="group flex items-center gap-5 overflow-hidden rounded-2xl border border-line bg-white p-5 transition-all duration-300 ease-premium hover:border-transparent hover:sb-shadow-soft"
            >
              <ProductMedia
                icon={product.icon}
                tone={product.tone}
                name={product.name}
                className="h-24 w-24 shrink-0"
                iconClassName="group-hover:scale-110"
              />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
                  Save {formatPrice((product.oldPrice ?? product.price) - product.price)}
                </p>
                <h3 className="mt-1.5 line-clamp-2 text-[15px] font-medium leading-snug text-ink">
                  {product.name}
                </h3>
                <p className="mt-2 text-[15px] font-semibold text-ink">
                  {formatPrice(product.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Zenvexa */}
      <section className="pt-16 sm:pt-20">
        <SectionHeading
          eyebrow="Why Zenvexa"
          title="Shopping, wrapped in a warm hug"
          description="From checkout to delivery, every step is designed to feel simple, secure and personal."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-line bg-white p-6 transition-all duration-300 hover:border-primary-100 hover:sb-shadow-soft"
            >
              <span className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-primary text-accent">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Category spotlight */}
      <section className="pt-16 sm:pt-20">
        <SectionHeading eyebrow="Departments" title="Explore the shop floor" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.slice(0, 4).map((category) => (
            <CategoryTile key={category.slug} category={category} />
          ))}
        </div>
      </section>

      <RecentlyViewedRail />
    </div>
  );
}
