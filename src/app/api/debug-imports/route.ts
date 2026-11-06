import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Temporary probe: reports which module fails to load in the serverless bundle. */
const PROBES: Record<string, () => Promise<unknown>> = {
  "firebase/auth-client": () => import("firebase/auth"),
  "firebase/firestore-client": () => import("firebase/firestore"),
  "firebase-admin/auth": () => import("firebase-admin/auth"),
  "firebase-admin/firestore": () => import("firebase-admin/firestore"),
  "@/firebase/collections": () => import("@/firebase/collections"),
  "@/services/settings.service": () => import("@/services/settings.service"),
  "@/services/orders.service": () => import("@/services/orders.service"),
  "@/lib/coupons": () => import("@/lib/coupons"),
  "@/lib/admin/rbac": () => import("@/lib/admin/rbac"),
  "@/lib/server/request-auth": () => import("@/lib/server/request-auth"),
  "@/lib/server/store-request": () => import("@/lib/server/store-request"),
  "@/lib/server/create-order": () => import("@/lib/server/create-order"),
  "@/lib/server/payment-service": () => import("@/lib/server/payment-service"),
  "@/lib/server/finalize-payment": () =>
    import("@/lib/server/finalize-payment"),
  "@/lib/server/make-webhook": () => import("@/lib/server/make-webhook"),
};

export async function GET() {
  const results: Record<string, string> = {};
  for (const [name, load] of Object.entries(PROBES)) {
    try {
      await load();
      results[name] = "ok";
    } catch (error) {
      results[name] =
        error instanceof Error
          ? `${error.name}: ${error.message}`.slice(0, 300)
          : String(error).slice(0, 300);
    }
  }
  return NextResponse.json(results);
}
