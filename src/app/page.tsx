import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Headphones,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
  Zap,
} from "lucide-react";
import { type Product as ProductView } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { toBrandViews, toCategoryViews } from "@/lib/catalog-view";
import { toProductViews, toProductView } from "@/lib/product-view";
import { buildListingMetadata } from "@/lib/seo";
import { getHomeCatalogSections } from "@/services/products.service";
import { getBrands, getCategories } from "@/services/catalog.service";
import { RecentlyViewedRail } from "@/components/commerce/recently-viewed";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/card";
import { CategoryCard, CategoryTile } from "@/components/commerce/category-card";
import {
  CatalogEmpty,
  CatalogError,
  CatalogRail,
} from "@/components/commerce/catalog-state";
import { BrandMark, ProductMedia } from "@/components/commerce/product-media";
import { Countdown } from "@/components/commerce/countdown";

const trustPoints = [
  {
    icon: Truck,
    title: "Next-day delivery",
    body: "Order before 6pm on weekdays and most metro addresses get it tomorrow.",
  },
  {
    icon: ShieldCheck,
    title: "2 years of cover",
    body: "Manufacturer warranty plus ShopBeta cover, handled in-house.",
  },
  {
    icon: BadgeCheck,
    title: "Authorised stock only",
    body: "Every unit is sourced from the brand or an authorised distributor.",
  },
  {
    icon: RotateCcw,
    title: "30-day returns",
    body: "Changed your mind? Send it back with a prepaid label, no questions.",
  },
];

export const revalidate = 60;

export const metadata = buildListingMetadata({
  title: "Shop electronics & gadgets",
  description:
    "ShopBeta catalogue — flash sales, featured picks, trending products and recently added stock.",
  path: "/",
});

async function loadSections() {
  const [home, categoryDocs, brandDocs] = await Promise.all([
    getHomeCatalogSections(4),
    getCategories(),
    getBrands(),
  ]);

  const hero: ProductView | undefined = home.heroSource
    ? toProductView(home.heroSource)
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
      {/* Hero */}
      <section className="grid gap-4 pt-6 lg:grid-cols-[1.55fr_1fr] lg:pt-8">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-soft p-7 sm:p-10 lg:p-12">
          <span
            className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/80 blur-3xl"
            aria-hidden
          />
          <div className="relative max-w-xl">
            <Badge tone="primary" className="mb-5">
              <Zap className="h-3 w-3" aria-hidden />
              Save up to 32% this week
            </Badge>
            <h1 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-ink sm:text-display lg:text-display-lg">
              Premium tech,
              <br />
              priced fairly.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted sm:text-lg">
              Computers, gadgets and gaming gear from the brands worth owning — with
              next-day delivery and two years of cover on everything.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href="/products" size="lg">
                Shop all products
                <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/deals" variant="outline" size="lg">
                View today&apos;s deals
              </ButtonLink>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6">
              {[
                { label: "Products", value: "12,400+" },
                { label: "Brands", value: "340" },
                { label: "Rating", value: "4.8/5" },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-muted">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 text-xl font-semibold tracking-[-0.02em] text-ink">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <ProductMedia
            icon="laptop"
            tone="bg-transparent"
            name="Featured laptop"
            className="pointer-events-none absolute -bottom-10 right-4 hidden h-72 w-72 lg:block"
            iconClassName="h-full w-full"
            iconTone="text-ink/[0.07]"
          />
        </div>

        <div className="grid gap-4">
          {hero ? (
          <Link
            href={`/product/${hero.slug}`}
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-ink p-7 text-white"
          >
            <span
              className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/25 blur-3xl"
              aria-hidden
            />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-300">
                Editor&apos;s choice
              </p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.025em]">
                {hero.name}
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-white/60">
                {hero.shortDescription}
              </p>
            </div>
            <div className="relative mt-6 flex items-end justify-between">
              <div>
                <p className="text-[12px] text-white/50 line-through">
                  {hero.oldPrice ? formatPrice(hero.oldPrice) : null}
                </p>
                <p className="text-2xl font-semibold tracking-[-0.02em]">
                  {formatPrice(hero.price)}
                </p>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-primary transition-transform duration-300 ease-premium group-hover:scale-110">
                <ArrowRight className="h-5 w-5" aria-hidden />
              </span>
            </div>
          </Link>
          ) : failed ? (
            <CatalogError />
          ) : (
            <CatalogEmpty
              title="No products yet"
              description="Editor’s choice appears once the catalogue has products."
            />
          )}

          <Link
            href="/deals"
            className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-3xl border border-line bg-primary-50 p-7"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Flash sale
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-ink">
                Audio &amp; storage
                <br />
                up to 45% off
              </h2>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary">
                Shop the sale
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </div>
            <Headphones className="h-24 w-24 shrink-0 text-ink/10" aria-hidden />
          </Link>
        </div>
      </section>

      {/* Promo banner */}
      <section className="mt-4">
        <div className="flex flex-col items-start justify-between gap-5 rounded-3xl border border-line bg-white p-6 sm:flex-row sm:items-center sm:p-7">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-50">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden />
            </span>
            <div>
              <p className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
                ShopBeta Plus — free next-day delivery, all year
              </p>
              <p className="mt-1 text-[13px] text-muted">
                $39/year. Early access to flash sales and 2% back in points on every order.
              </p>
            </div>
          </div>
          <ButtonLink href="/settings" variant="secondary">
            Join Plus
          </ButtonLink>
        </div>
      </section>

      {/* Categories */}
      <section className="pt-16 sm:pt-20">
        <SectionHeading
          eyebrow="Browse"
          title="Shop by category"
          description="Eight departments, one checkout. Everything in stock ships the same day."
          action={
            <ButtonLink href="/products" variant="outline" size="sm">
              All categories
            </ButtonLink>
          }
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>
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
              <Countdown />
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
          eyebrow="Authorised retailer"
          title="Top brands"
          description="340 brands, every unit sourced through official channels."
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

      {/* Why ShopBeta */}
      <section className="pt-16 sm:pt-20">
        <SectionHeading
          eyebrow="Why ShopBeta"
          title="The boring parts, done properly"
          description="Delivery, warranty and returns are where most electronics retailers fall apart. They are the parts we obsess over."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-line bg-white p-6 transition-all duration-300 hover:sb-shadow-soft"
            >
              <span className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-primary-50">
                <Icon className="h-5 w-5 text-primary" aria-hidden />
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
