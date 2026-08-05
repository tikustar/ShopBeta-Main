import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { byCategory, categories, products } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/card";
import { ProductIcon } from "@/components/commerce/product-media";
import { ProductCard } from "@/components/commerce/product-card";
import { FilterPanel } from "@/components/commerce/filters";
import { ProductBrowser } from "@/components/commerce/product-browser";

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const category = categories.find((item) => item.slug === params.slug);
  return {
    title: category?.name ?? "Category",
    description: category?.description,
  };
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const category = categories.find((item) => item.slug === params.slug);
  if (!category) notFound();

  const items = byCategory(category.slug);
  const listing = items.length ? items : products.slice(0, 6);
  const featured = listing.slice(0, 4);

  return (
    <div className="sb-container">
      <div className="pt-6 sm:pt-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Categories", href: "/products" },
            { label: category.name },
          ]}
        />
      </div>

      {/* Category banner */}
      <section
        className={cn(
          "relative mt-5 overflow-hidden rounded-3xl border border-line p-7 sm:p-10",
          category.tone,
        )}
      >
        <span
          className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/70 blur-3xl"
          aria-hidden
        />
        <div className="relative max-w-xl">
          <Badge tone="primary" className="mb-4">
            {category.itemCount.toLocaleString()} products
          </Badge>
          <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-display-sm">
            {category.name}
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted sm:text-base">
            {category.description}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="/products">
              Shop {category.name.toLowerCase()}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/deals" variant="outline">
              Deals in this category
            </ButtonLink>
          </div>
        </div>
        <ProductIcon
          icon={category.icon}
          className="pointer-events-none absolute -bottom-8 right-8 hidden h-56 w-56 text-ink/10 lg:block"
        />
      </section>

      {/* Subcategories */}
      <section className="pt-12">
        <h2 className="mb-4 text-[15px] font-semibold text-ink">Subcategories</h2>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {category.subcategories.map((sub, index) => (
            <Link
              key={sub}
              href="/products"
              className={cn(
                "shrink-0 rounded-full border px-4 py-2.5 text-[13px] font-medium transition-colors",
                index === 0
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-white text-ink-soft hover:border-ink/20 hover:bg-soft",
              )}
            >
              {sub}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured in category */}
      <section className="pt-14">
        <SectionHeading
          eyebrow="Buyers' picks"
          title={`Featured in ${category.name}`}
          action={
            <ButtonLink href="/products" variant="outline" size="sm">
              View all
            </ButtonLink>
          }
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Filters + grid */}
      <section className="pt-16">
        <SectionHeading title={`All ${category.name.toLowerCase()}`} />
        <div className="grid gap-8 lg:grid-cols-[276px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-ink">Filters</h3>
                <button
                  type="button"
                  className="text-[13px] font-medium text-primary hover:underline"
                >
                  Reset
                </button>
              </div>
              <FilterPanel />
            </div>
          </aside>
          <ProductBrowser items={listing} total={category.itemCount} />
        </div>
      </section>
    </div>
  );
}
