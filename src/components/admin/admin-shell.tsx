"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  X,
} from "lucide-react";
import { useState } from "react";
import { RequireAdmin } from "@/components/auth/require-admin";
import { ADMIN_NAV, hasPermission } from "@/lib/admin/rbac";
import { cn } from "@/lib/utils";
import { signOutUser } from "@/services/auth.service";
import { useUserStore } from "@/stores/user.store";
import { APP_NAME } from "@/constants/app";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const profile = useUserStore((state) => state.profile);
  const role = profile?.role;
  const [open, setOpen] = useState(false);

  const links = ADMIN_NAV.filter((item) => hasPermission(role, item.permission));

  const Nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {links.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
              active
                ? "bg-primary text-white"
                : "text-ink-soft hover:bg-white hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <RequireAdmin>
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-white lg:flex">
          <div className="flex items-center gap-2 border-b border-line px-4 py-4">
            <LayoutDashboard className="h-5 w-5 text-primary" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-ink">{APP_NAME} Admin</p>
              <p className="text-[11px] capitalize text-muted">
                {role?.replaceAll("_", " ") ?? "staff"}
              </p>
            </div>
          </div>
          {Nav}
          <div className="border-t border-line p-3">
            <Link
              href="/"
              className="mb-1 block rounded-xl px-3 py-2 text-[13px] text-muted hover:bg-soft"
            >
              View storefront
            </Link>
            <button
              type="button"
              onClick={() => void signOutUser()}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[13px] text-muted hover:bg-soft hover:text-ink"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:px-6">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full border border-line lg:hidden"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <p className="text-sm font-medium text-ink lg:hidden">
              {APP_NAME} Admin
            </p>
            <div className="ml-auto flex items-center gap-3 text-[13px] text-muted">
              <Package className="hidden h-4 w-4 sm:block" aria-hidden />
              <span className="truncate">
                {profile?.displayName || profile?.email || "Admin"}
              </span>
            </div>
          </header>

          <main id="main" className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>

        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-ink/40"
              onClick={() => setOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex w-[80%] max-w-xs flex-col bg-white">
              <div className="flex items-center justify-between border-b border-line px-4 py-4">
                <p className="text-sm font-semibold text-ink">Menu</p>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-line"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
              {Nav}
            </div>
          </div>
        ) : null}
      </div>
    </RequireAdmin>
  );
}
