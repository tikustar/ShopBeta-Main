"use client";

import type { ReactNode } from "react";

/**
 * Single composition point for client-side providers (auth listener, cart
 * hydration, toaster, ...). It renders children unchanged for now so Phase 2
 * can add providers without touching the layout.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
