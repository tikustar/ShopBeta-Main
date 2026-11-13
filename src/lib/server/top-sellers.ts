import { cache } from "react";
import { Timestamp } from "firebase-admin/firestore";
import { deploymentStoreId, recordStoreId } from "@/lib/store";
import {
  getAdminDb,
  isFirebaseAdminConfigured,
} from "@/lib/server/firebase-admin";

/**
 * Product IDs ranked by quantity sold in orders paid today (store-local day
 * boundaries, matching the admin dashboard's date handling). Only orders
 * attributed to this deployment's store count; paid orders are deduplicated
 * upstream because an order is only finalized once.
 *
 * One bounded query — orders paid today only — and cached per render pass so
 * the homepage does not read the full orders collection.
 */
export const getTodaysTopSellerIds = cache(async (): Promise<string[]> => {
  if (!isFirebaseAdminConfigured()) return [];
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const snapshot = await getAdminDb()
      .collection("orders")
      .where("paidAt", ">=", Timestamp.fromDate(startOfToday))
      .get();
    const totals = new Map<string, number>();
    for (const document of snapshot.docs) {
      const order = document.data();
      if (order.paymentStatus !== "paid") continue;
      if (recordStoreId(order) !== deploymentStoreId()) continue;
      for (const line of order.products ?? order.items ?? []) {
        const quantity = Number(line?.quantity);
        if (!line?.productId || !Number.isFinite(quantity) || quantity <= 0)
          continue;
        totals.set(
          line.productId,
          (totals.get(line.productId) ?? 0) + quantity,
        );
      }
    }
    // Highest quantity first; product ID ascending breaks ties deterministically.
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([id]) => id);
  } catch {
    return [];
  }
});
