"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  Heart,
  Menu,
  Percent,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import { SearchBar } from "@/components/commerce/search-bar";
import { ProductIcon } from "@/components/commerce/product-media";
import { useCatalogNav } from "@/providers/catalog-nav-provider";

const navLinks = [
  { label: "Deals", href: "/deals" },
  { label: "New Arrivals", href: "/products?sort=newest" },
  { label: "Brands", href: "/brands" },
  { label: "Support", href: "/help" },
];

function IconAction({
  href,
  label,
  count,
  children,
}: {
  href: string;
  label: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="relative grid h-10 w-10 place-items-center rounded-full text-ink transition-colors duration-200 hover:bg-soft"
    >
      {children}
      {count ? (
        <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { categories, popularSearches } = useCatalogNav();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/85 backdrop-blur-xl">
      <div className="hidden border-b border-line bg-ink text-white lg:block">
        <div className="sb-container flex h-9 items-center justify-between text-[12px]">
          <p className="flex items-center gap-2 text-white/80">
            <Truck className="h-3.5 w-3.5" aria-hidden />
            Free next-day delivery on orders over $99
          </p>
          <div className="flex items-center gap-6 text-white/70">
            <Link href="/track-order" className="transition-colors hover:text-white">
              Track order
            </Link>
            <Link href="/help" className="transition-colors hover:text-white">
              Help centre
            </Link>
            <Link href="/settings" className="transition-colors hover:text-white">
              USD · English
            </Link>
          </div>
        </div>
      </div>

      <div className="sb-container flex h-16 items-center gap-4 lg:h-[72px] lg:gap-6">
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="-ml-2 grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-soft lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>

        <Logo className="shrink-0" />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          <div
            className="relative"
            onMouseEnter={() => setCatOpen(true)}
            onMouseLeave={() => setCatOpen(false)}
          >
            <button
              type="button"
              aria-expanded={catOpen}
              onClick={() => setCatOpen((value) => !value)}
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium text-ink transition-colors hover:bg-soft"
            >
              Categories
              <ChevronDown
                className={cn("h-4 w-4 text-muted transition-transform", catOpen && "rotate-180")}
                aria-hidden
              />
            </button>
            {catOpen ? (
              <div className="sb-fade-up absolute left-0 top-full w-[620px] overflow-hidden rounded-2xl border border-line bg-white p-3 sb-shadow-soft">
                <div className="grid grid-cols-2 gap-1">
                  {categories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/category/${category.slug}`}
                      className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-soft"
                    >
                      <span
                        className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", category.tone)}
                      >
                        <ProductIcon icon={category.icon} className="h-[18px] w-[18px] text-ink" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink">
                          {category.name}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-muted">
                          {category.subcategories.slice(0, 3).join(" · ")}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/products"
                  className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-soft py-3 text-[13px] font-medium text-ink transition-colors hover:bg-line/60"
                >
                  Browse all 12,000+ products
                </Link>
              </div>
            ) : null}
          </div>
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="inline-flex h-10 items-center rounded-full px-3.5 text-sm font-medium text-ink transition-colors hover:bg-soft hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden min-w-0 max-w-xl flex-1 lg:block">
          <SearchBar suggestions={popularSearches} />
        </div>

        <div className="ml-auto flex items-center gap-0.5 lg:ml-0">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-soft lg:hidden"
          >
            <Search className="h-5 w-5" aria-hidden />
          </button>
          <IconAction href="/wishlist" label="Wishlist" count={6}>
            <Heart className="h-5 w-5" aria-hidden />
          </IconAction>
          <IconAction href="/notifications" label="Notifications" count={3}>
            <Bell className="h-5 w-5" aria-hidden />
          </IconAction>
          <IconAction href="/cart" label="Cart" count={4}>
            <ShoppingBag className="h-5 w-5" aria-hidden />
          </IconAction>
          <Link
            href="/profile"
            aria-label="Your profile"
            className="ml-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-[12px] font-semibold text-white transition-transform duration-200 hover:scale-105"
          >
            AB
          </Link>
        </div>
      </div>

      {searchOpen ? (
        <div className="sb-container pb-3 lg:hidden">
          <SearchBar withSuggestions={false} suggestions={popularSearches} />
        </div>
      ) : null}

      {menuOpen ? (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Logo />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                Shop by category
              </p>
              <div className="mb-6 grid gap-1">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm text-ink transition-colors hover:bg-soft"
                  >
                    <span className={cn("grid h-9 w-9 place-items-center rounded-lg", category.tone)}>
                      <ProductIcon icon={category.icon} className="h-4 w-4 text-ink" />
                    </span>
                    {category.name}
                  </Link>
                ))}
              </div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                Discover
              </p>
              <div className="grid gap-1">
                <Link
                  href="/deals"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm text-ink hover:bg-soft"
                >
                  <Percent className="h-4 w-4 text-primary" aria-hidden />
                  Deals
                </Link>
                <Link
                  href="/products"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm text-ink hover:bg-soft"
                >
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                  New arrivals
                </Link>
                <Link
                  href="/track-order"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm text-ink hover:bg-soft"
                >
                  <Truck className="h-4 w-4 text-primary" aria-hidden />
                  Track order
                </Link>
                <Link
                  href="/help"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm text-ink hover:bg-soft"
                >
                  <Bell className="h-4 w-4 text-primary" aria-hidden />
                  Help centre
                </Link>
              </div>
            </div>
            <div className="border-t border-line p-5">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-line p-3"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-[12px] font-semibold text-white">
                  AB
                </span>
                <span>
                  <span className="block text-sm font-medium text-ink">Amara Bello</span>
                  <span className="block text-[12px] text-muted">View profile</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
