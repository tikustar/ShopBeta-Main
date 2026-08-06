import type { Metadata } from "next";
import Link from "next/link";
import { Clock, TrendingUp, X } from "lucide-react";
import { popularSearches, recentSearches } from "@/lib/data";
import { toProductViews } from "@/lib/product-view";
import { searchProducts } from "@/services/products.service";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { NoResultsIllustration } from "@/components/ui/illustrations";
import { SearchBar } from "@/components/commerce/search-bar";
import { ProductBrowser } from "@/components/commerce/product-browser";
import { CatalogError } from "@/components/commerce/catalog-state";

export const metadata: Metadata = {
  title: "Search",
};

/** Results depend on `?q=`, so this page is rendered per request. */
export const dynamic = "force-dynamic";

export default async function SearchResultsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const queryTerm = searchParams.q?.trim() ?? "";
  let results: ReturnType<typeof toProductViews> = [];
  let failed = false;
  try {
    results = toProductViews(await searchProducts(queryTerm));
  } catch {
    failed = true;
  }

  return (
    <div className="sb-container">
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Search" }]}
        title="Search results"
        description={
          queryTerm
            ? `Showing results for “${queryTerm}”. Refine with filters or try a related search.`
            : "Showing the full catalogue. Refine with filters or try a related search."
        }
      />

      <div className="mb-8 max-w-3xl">
        <SearchBar size="lg" withSuggestions={false} />
      </div>

      <div className="mb-10 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <Clock className="h-4 w-4 text-muted" aria-hidden />
              Recent searches
            </h2>
            <button
              type="button"
              className="text-[13px] font-medium text-muted transition-colors hover:text-primary"
            >
              Clear all
            </button>
          </div>
          <ul className="mt-4 space-y-1">
            {recentSearches.map((term) => (
              <li key={term} className="flex items-center gap-2">
                <Link
                  href="/search"
                  className="flex-1 rounded-lg px-2 py-2 text-sm text-ink-soft transition-colors hover:bg-soft"
                >
                  {term}
                </Link>
                <button
                  type="button"
                  aria-label={`Remove ${term} from recent searches`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-soft hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
            Popular searches
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {popularSearches.map((term) => (
              <Link
                key={term}
                href="/search"
                className="rounded-full border border-line px-3.5 py-2 text-[13px] text-ink-soft transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary"
              >
                {term}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {failed ? (
        <CatalogError compact={false} />
      ) : (
        <ProductBrowser items={results} showFilterDrawer showActiveFilters />
      )}

      <section className="pt-16 sm:pt-20">
        <h2 className="mb-4 text-[15px] font-semibold text-ink">No results state</h2>
        <EmptyState
          illustration={<NoResultsIllustration />}
          title={`No matches for “${queryTerm || "thunderbolt 6 dock"}”`}
          description="Check the spelling, use fewer words, or browse the closest category instead."
          actions={
            <>
              <ButtonLink href="/products">Browse all products</ButtonLink>
              <ButtonLink href="/help" variant="outline">
                Ask support
              </ButtonLink>
            </>
          }
        />
      </section>
    </div>
  );
}
