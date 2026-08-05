import type { Metadata } from "next";
import { products } from "@/lib/data";
import { PageHeader } from "@/components/layout/page-header";
import { SearchBar } from "@/components/commerce/search-bar";
import { FilterPanel } from "@/components/commerce/filters";
import { ProductBrowser } from "@/components/commerce/product-browser";

export const metadata: Metadata = {
  title: "All products",
  description: "Browse every product in the ShopBeta catalogue.",
};

export default function ProductListingPage() {
  return (
    <div className="sb-container">
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "All products" }]}
        title="All products"
        description="12,412 products across computers, electronics, gaming, smart home, office and networking."
      />

      <div className="mb-8 max-w-2xl">
        <SearchBar size="lg" withSuggestions={false} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[276px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-ink">Filters</h2>
              <button type="button" className="text-[13px] font-medium text-primary hover:underline">
                Reset
              </button>
            </div>
            <FilterPanel />
          </div>
        </aside>
        <ProductBrowser items={products} total={12412} />
      </div>
    </div>
  );
}
