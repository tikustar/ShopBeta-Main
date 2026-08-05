import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";
import { byTag, categories } from "@/lib/data";
import { ButtonLink } from "@/components/ui/button";
import { NotFoundIllustration } from "@/components/ui/illustrations";
import { SearchBar } from "@/components/commerce/search-bar";
import { ProductCard } from "@/components/commerce/product-card";

export default function NotFound() {
  const suggestions = byTag("best-seller", 4);

  return (
    <div className="sb-container">
      <section className="flex flex-col items-center py-14 text-center sm:py-20">
        <div className="w-64 sm:w-80">
          <NotFoundIllustration />
        </div>
        <h1 className="mt-8 text-[30px] font-semibold tracking-[-0.03em] text-ink sm:text-display-sm">
          We cannot find that page
        </h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted sm:text-base">
          The link may be out of date, or the product might have sold out and been retired.
          Try a search instead.
        </p>

        <div className="mt-8 w-full max-w-xl">
          <SearchBar size="lg" withSuggestions={false} placeholder="Search products…" />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/" size="lg">
            <Home className="h-4 w-4" aria-hidden />
            Back to home
          </ButtonLink>
          <ButtonLink href="/products" variant="outline" size="lg">
            Browse products
          </ButtonLink>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {categories.slice(0, 6).map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="rounded-full border border-line px-3.5 py-2 text-[13px] text-ink-soft transition-colors hover:border-primary-200 hover:text-primary"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="pb-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-[-0.025em] text-ink">
            Popular right now
          </h2>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
          >
            View all
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {suggestions.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
