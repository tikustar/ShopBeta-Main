import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { brands, byTag, categories } from "@/lib/data";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card, SectionHeading } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { BrandMark, ProductIcon } from "@/components/commerce/product-media";
import { ProductCard } from "@/components/commerce/product-card";

export const metadata: Metadata = {
  title: "Brands",
};

const letters = ["All", "A–F", "G–L", "M–R", "S–Z"];

export default function BrandsPage() {
  const featured = brands.filter((brand) => brand.featured);
  const collections = categories.slice(0, 3);
  const spotlight = byTag("featured", 4);

  return (
    <div className="sb-container">
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Brands" }]}
        title="Brands"
        description="340 brands, all sourced through official channels. Warranty claims handled in-house."
      />

      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:max-w-sm sm:flex-1">
          <Input
            placeholder="Search brands"
            aria-label="Search brands"
            icon={<Search className="h-[18px] w-[18px]" />}
          />
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {letters.map((letter, index) => (
            <button
              key={letter}
              type="button"
              className={cn(
                "shrink-0 rounded-full border px-4 py-2.5 text-[13px] font-medium transition-colors",
                index === 0
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white text-ink-soft hover:bg-soft",
              )}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Featured brands */}
      <section>
        <SectionHeading
          eyebrow="Partners"
          title="Featured brands"
          description="Brands with the widest range and fastest restocks on ShopBeta."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((brand) => (
            <Link
              key={brand.slug}
              href="/products"
              className="group flex items-center gap-4 rounded-2xl border border-line bg-white p-5 transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-transparent hover:sb-shadow-hover"
            >
              <BrandMark
                initials={brand.initials}
                className="h-14 w-14 text-base transition-colors group-hover:bg-primary-50 group-hover:text-primary"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
                  {brand.name}
                </p>
                <p className="mt-1 text-[13px] text-muted">
                  {brand.productCount} products · {brand.category}
                </p>
              </div>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-muted transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Brand logo grid */}
      <section className="pt-16 sm:pt-20">
        <SectionHeading title="All brands" description="A–Z, updated weekly." />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {brands.map((brand) => (
            <Link
              key={brand.slug}
              href="/products"
              className="group flex flex-col items-center gap-3 rounded-2xl border border-line bg-white p-6 transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-transparent hover:sb-shadow-soft"
            >
              <BrandMark
                initials={brand.initials}
                className="transition-colors group-hover:bg-primary-50 group-hover:text-primary"
              />
              <span className="text-center text-[13px] font-medium text-ink">
                {brand.name}
              </span>
              <span className="text-[11px] text-muted">{brand.productCount} products</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Brand collections */}
      <section className="pt-16 sm:pt-20">
        <SectionHeading
          eyebrow="Collections"
          title="Brand collections"
          description="Curated line-ups pulled together by our buying team."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {collections.map((collection) => (
            <Card key={collection.slug} className={cn("relative overflow-hidden", collection.tone)}>
              <Badge tone="ink" className="mb-4">
                Collection
              </Badge>
              <h3 className="text-lg font-semibold tracking-[-0.02em] text-ink">
                Best of {collection.name}
              </h3>
              <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-muted">
                {collection.description}
              </p>
              <ButtonLink
                href={`/category/${collection.slug}`}
                variant="secondary"
                size="sm"
                className="mt-6"
              >
                Explore
              </ButtonLink>
              <ProductIcon
                icon={collection.icon}
                className="pointer-events-none absolute -bottom-4 right-2 h-28 w-28 text-ink/10"
              />
            </Card>
          ))}
        </div>
      </section>

      {/* Spotlight products */}
      <section className="pt-16 sm:pt-20">
        <SectionHeading title="Best of the big brands" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {spotlight.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
