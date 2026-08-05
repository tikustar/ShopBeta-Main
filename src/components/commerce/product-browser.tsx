"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import type { Product } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/dropdown";
import { Pagination } from "@/components/ui/pagination";
import { ProductCard, ProductListCard } from "@/components/commerce/product-card";
import { ActiveFilters, FilterDrawer } from "@/components/commerce/filters";

const sortOptions = [
  "Most relevant",
  "Newest arrivals",
  "Price: low to high",
  "Price: high to low",
  "Top rated",
  "Biggest discount",
];

export function ProductBrowser({
  items,
  total,
  showFilterDrawer = true,
  showActiveFilters = true,
  showPagination = true,
}: {
  items: Product[];
  total?: number;
  showFilterDrawer?: boolean;
  showActiveFilters?: boolean;
  showPagination?: boolean;
}) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const count = total ?? items.length;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {showFilterDrawer ? <FilterDrawer /> : null}
          <p className="text-[13px] text-muted">
            <span className="font-semibold text-ink">{count.toLocaleString()}</span> products
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dropdown
            label="Sort"
            options={sortOptions}
            className="w-[220px]"
            align="right"
          />
          <div
            className="hidden items-center gap-1 rounded-full border border-line bg-white p-1 sm:flex"
            role="group"
            aria-label="View mode"
          >
            {(
              [
                { id: "grid" as const, icon: LayoutGrid, label: "Grid view" },
                { id: "list" as const, icon: List, label: "List view" },
              ]
            ).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                aria-label={label}
                aria-pressed={view === id}
                onClick={() => setView(id)}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-full transition-colors",
                  view === id ? "bg-ink text-white" : "text-muted hover:bg-soft hover:text-ink",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </div>

      {showActiveFilters ? (
        <div className="mb-6">
          <ActiveFilters />
        </div>
      ) : null}

      {view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-5">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((product) => (
            <ProductListCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {showPagination ? <Pagination current={1} total={9} className="mt-10" /> : null}
    </div>
  );
}
