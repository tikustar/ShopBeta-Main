"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgePercent,
  Bell,
  ChartLine,
  ExternalLink,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Package,
  PlugZap,
  ReceiptText,
  ScrollText,
  Settings,
  Tags,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { RequireAdmin } from "@/components/auth/require-admin";
import { BrandMark } from "@/components/layout/logo";
import { ADMIN_NAV, hasPermission } from "@/lib/admin/rbac";
import { cn } from "@/lib/utils";
import { signOutUser } from "@/services/auth.service";
import { useUserStore } from "@/stores/user.store";
import { APP_DESCRIPTOR, APP_NAME } from "@/constants/app";

const NAV_ICONS: Record<string, LucideIcon> = {
  "/admin": LayoutDashboard,
  "/admin/products": Package,
  "/admin/categories": FolderTree,
  "/admin/brands": Tags,
  "/admin/orders": ReceiptText,
  "/admin/customers": Users,
  "/admin/coupons": BadgePercent,
  "/admin/banners": ImageIcon,
  "/admin/ads": Megaphone,
  "/admin/notifications": Bell,
  "/admin/analytics": ChartLine,
  "/admin/integrations": PlugZap,
  "/admin/settings": Settings,
  "/admin/audit": ScrollText,
};

function isActive(pathname: string | null, href: string) {
  return href === "/admin" ? pathname === "/admin" : !!pathname?.startsWith(href);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const profile = useUserStore((state) => state.profile);
  const role = profile?.role;
  const [open, setOpen] = useState(false);

  const links = ADMIN_NAV.filter((item) => hasPermission(role, item.permission));
  const current = links.find((item) => isActive(pathname, item.href));
  const displayName = profile?.displayName || profile?.email || "Admin";
  const roleLabel = role?.replaceAll("_", " ") ?? "staff";

  const Brand = (
    <Link href="/admin" className="flex items-center gap-3 px-5 py-5">
      <BrandMark tone="light" className="h-10 w-10" />
      <span className="leading-tight">
        <span className="block text-[15px] font-extrabold uppercase tracking-[0.04em] text-white">
          {APP_NAME}
        </span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
          {APP_DESCRIPTOR} · Admin
        </span>
      </span>
    </Link>
  );

  const Nav = (
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2">
      <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
        Management
      </p>
      {links.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = NAV_ICONS[item.href] ?? LayoutDashboard;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
              active
                ? "bg-accent text-primary-800 shadow-sm"
                : "text-white/75 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon
              className={cn(
                "h-[18px] w-[18px] shrink-0",
                active ? "text-primary-800" : "text-white/55 group-hover:text-accent",
              )}
              aria-hidden
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const Footer = (
    <div className="border-t border-white/10 p-3">
      <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/[0.06] px-3 py-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-[12px] font-bold uppercase text-primary-800">
          {displayName.slice(0, 1)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium text-white">{displayName}</span>
          <span className="block text-[11px] capitalize text-white/50">{roleLabel}</span>
        </span>
      </div>
      <Link
        href="/"
        className="mb-1 flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] text-white/70 hover:bg-white/10 hover:text-white"
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        View storefront
      </Link>
      <button
        type="button"
        onClick={() => void signOutUser()}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[13px] text-white/70 hover:bg-white/10 hover:text-white"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Sign out
      </button>
    </div>
  );

  return (
    <RequireAdmin>
      <div className="flex min-h-screen bg-soft">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-primary-800 lg:flex">
          {Brand}
          {Nav}
          {Footer}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur lg:px-8">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-xl border border-line text-ink lg:hidden"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                {APP_NAME} Admin
              </p>
              <p className="truncate text-sm font-semibold text-ink">
                {current?.label ?? "Dashboard"}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden rounded-full bg-primary-50 px-3 py-1 text-[11px] font-semibold capitalize text-primary-700 sm:inline-flex">
                {roleLabel}
              </span>
              <span className="hidden max-w-[220px] truncate text-[13px] text-muted md:block">
                {displayName}
              </span>
            </div>
          </header>

          <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>

        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col bg-primary-800">
              <div className="flex items-center justify-between pr-3">
                {Brand}
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
              {Nav}
              {Footer}
            </div>
          </div>
        ) : null}
      </div>
    </RequireAdmin>
  );
}
