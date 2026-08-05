"use client";

import { useState } from "react";
import { SlidersHorizontal, Star, X } from "lucide-react";
import { brands, categories, priceBounds } from "@/lib/data";
import { cn, formatPrice } from "@/lib/utils";
import { Checkbox } from "@/components/ui/field";
import { Chip } from "@/components/ui/badge";

function Group({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group border-b border-line py-5 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink">
        {title}
        <span className="text-muted transition-transform duration-200 group-open:rotate-180" aria-hidden>
          ▾
        </span>
      </summary>
      <div className="pt-4">{children}</div>
    </details>
  );
}

function PriceSlider() {
  const [max, setMax] = useState(1600);
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[13px] text-muted">
        <span>{formatPrice(priceBounds.min)}</span>
        <span className="font-semibold text-ink">Up to {formatPrice(max)}</span>
      </div>
      <input
        type="range"
        min={priceBounds.min}
        max={priceBounds.max}
        step={50}
        value={max}
        onChange={(event) => setMax(Number(event.target.value))}
        aria-label="Maximum price"
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-primary"
      />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <input
          type="number"
          defaultValue={priceBounds.min}
          aria-label="Minimum price"
          className="h-10 rounded-xl border border-line px-3 text-sm text-ink outline-none focus:border-primary"
        />
        <input
          type="number"
          value={max}
          onChange={(event) => setMax(Number(event.target.value))}
          aria-label="Maximum price"
          className="h-10 rounded-xl border border-line px-3 text-sm text-ink outline-none focus:border-primary"
        />
      </div>
    </div>
  );
}

export function FilterPanel({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-white px-5 py-1", className)}>
      <Group title="Category">
        <div className="space-y-0.5">
          {categories.slice(0, 6).map((category) => (
            <Checkbox
              key={category.slug}
              label={category.name}
              count={category.itemCount}
              defaultChecked={category.slug === "computers"}
            />
          ))}
        </div>
      </Group>
      <Group title="Brand">
        <div className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
          {brands.slice(0, 10).map((brand) => (
            <Checkbox key={brand.slug} label={brand.name} count={brand.productCount} />
          ))}
        </div>
      </Group>
      <Group title="Price">
        <PriceSlider />
      </Group>
      <Group title="Customer rating">
        <div className="space-y-0.5">
          {[4, 3, 2].map((stars) => (
            <Checkbox
              key={stars}
              label={
                <span className="flex items-center gap-1.5">
                  <span className="flex">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={cn(
                          "h-3.5 w-3.5",
                          index < stars
                            ? "fill-amber-400 text-amber-400"
                            : "fill-line text-line",
                        )}
                        aria-hidden
                      />
                    ))}
                  </span>
                  <span className="text-[13px]">& up</span>
                </span>
              }
            />
          ))}
        </div>
      </Group>
      <Group title="Availability">
        <div className="space-y-0.5">
          <Checkbox label="In stock" defaultChecked count={1842} />
          <Checkbox label="Ships today" count={914} />
          <Checkbox label="Pre-order" count={62} />
          <Checkbox label="Include out of stock" count={128} />
        </div>
      </Group>
      <Group title="Delivery" defaultOpen={false}>
        <div className="space-y-0.5">
          <Checkbox label="Free delivery" defaultChecked />
          <Checkbox label="Next-day delivery" />
          <Checkbox label="Store pickup" />
        </div>
      </Group>
    </div>
  );
}

export function ActiveFilters() {
  const [filters, setFilters] = useState([
    "Computers",
    "Apple",
    "Under $1,600",
    "In stock",
  ]);

  if (!filters.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[13px] text-muted">Active:</span>
      {filters.map((filter) => (
        <Chip
          key={filter}
          onRemove={() => setFilters((list) => list.filter((f) => f !== filter))}
          onClick={() => setFilters((list) => list.filter((f) => f !== filter))}
        >
          {filter}
        </Chip>
      ))}
      <button
        type="button"
        onClick={() => setFilters([])}
        className="text-[13px] font-medium text-primary hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}

export function FilterDrawer() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-medium text-ink transition-colors hover:bg-soft lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        Filters
      </button>
      {open ? (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-white">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <p className="text-[15px] font-semibold text-ink">Filters</p>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterPanel className="border-0 px-0" />
            </div>
            <div className="flex gap-3 border-t border-line p-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-12 flex-1 rounded-full border border-line text-sm font-medium text-ink"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-12 flex-1 rounded-full bg-primary text-sm font-medium text-white"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
