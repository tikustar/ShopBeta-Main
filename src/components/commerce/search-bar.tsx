"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, TrendingUp, X } from "lucide-react";
import { popularSearches, recentSearches } from "@/lib/data";
import { cn } from "@/lib/utils";

export function SearchBar({
  placeholder = "Search laptops, phones, gaming, smart home…",
  className,
  withSuggestions = true,
  size = "md",
}: {
  placeholder?: string;
  className?: string;
  withSuggestions?: boolean;
  size?: "md" | "lg";
}) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-full border bg-white pl-5 pr-2 transition-all duration-200",
          size === "lg" ? "h-14" : "h-12",
          focused ? "border-primary ring-4 ring-primary-100" : "border-line hover:border-ink/20",
        )}
      >
        <Search className="h-[18px] w-[18px] shrink-0 text-muted" aria-hidden />
        <input
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          placeholder={placeholder}
          aria-label="Search products"
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setValue("")}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-soft hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
        <Link
          href="/search"
          className={cn(
            "hidden shrink-0 items-center justify-center rounded-full bg-primary px-5 text-[13px] font-medium text-white transition-colors hover:bg-primary-600 sm:inline-flex",
            size === "lg" ? "h-11" : "h-9",
          )}
        >
          Search
        </Link>
      </div>

      {withSuggestions && focused ? (
        <div className="sb-fade-up absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-line bg-white p-4 sb-shadow-soft">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
            Recent searches
          </p>
          <ul className="mb-4 space-y-0.5">
            {recentSearches.slice(0, 4).map((item) => (
              <li key={item}>
                <Link
                  href="/search"
                  className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-ink-soft transition-colors hover:bg-soft"
                >
                  <Search className="h-4 w-4 text-muted" aria-hidden />
                  {item}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
            Trending now
          </p>
          <div className="flex flex-wrap gap-2">
            {popularSearches.slice(0, 5).map((item) => (
              <Link
                key={item}
                href="/search"
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[13px] text-ink-soft transition-colors hover:border-primary-200 hover:text-primary"
              >
                <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                {item}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
