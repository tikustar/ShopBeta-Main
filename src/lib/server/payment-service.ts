import { FieldValue } from "firebase-admin/firestore";
import { COLLECTIONS } from "@/constants/collections";
import {
  getAppUrl,
  isPaystackConfigured,
  toKobo,
} from "@/lib/server/env";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { appendTimelineAdmin } from "@/lib/server/order-timeline";
import {
  initializePaystackTransaction,
  normalizePaystackVerification,
  verifyPaystackTransaction,
  amountsMatch,
} from "@/lib/server/paystack";
import {
  finalizeSuccessfulPayment,
  markPaymentFailed,
} from "@/lib/server/finalize-payment";
import type { Order } from "@/types/order";
import { stripUndefined } from "@/utils/firestore";

function paymentReferenceForOrder(order: Order) {
  const base = (order.orderNumber || order.id).replace(/[^a-zA-Z0-9]/g, "");
  return `SB_${base}_${Date.now()}`.slice(0, 100);
}

export async function initializePaystackForOrder(input: {
  orderId: string;
  callbackUrl?: string;
}) {
  if (!isPaystackConfigured()) {
    return {
      ok: false as const,
      reason: "Paystack is not configured on the server.",
    };
  }

  const db = getAdminDb();
  const orderRef = db.collection(COLLECTIONS.orders).doc(input.orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    return { ok: false as const, reason: "Order not found." };
  }

  const order = { id: orderSnap.id, ...orderSnap.data() } as Order;
  const method = String(order.paymentMethod ?? "");
  if (method !== "paystack" && method !== "card") {
    return {
      ok: false as const,
      reason: "This order is not set up for Paystack.",
    };
  }

  if (order.paymentStatus === "paid") {
    return { ok: false as const, reason: "This order is already paid." };
  }

  const email = order.customer?.email?.trim();
  if (!email) {
    return { ok: false as const, reason: "Order is missing a customer email." };
  }

  const amount = Number(order.total ?? order.totals?.total ?? 0);
  if (!(amount > 0)) {
    return { ok: false as const, reason: "Order total is invalid." };
  }

  const reference = paymentReferenceForOrder(order);
  const callbackUrl =
    input.callbackUrl ||
    `${getAppUrl()}/payments/callback?order=${encodeURIComponent(order.orderNumber ?? order.id)}`;

  const initialized = await initializePaystackTransaction({
    email,
    amountNaira: amount,
    reference,
    callbackUrl,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
    },
  });

  const paymentRef = db.collection(COLLECTIONS.payments).doc();
  await paymentRef.set(
    stripUndefined({
      orderId: order.id,
      orderNumber: order.orderNumber ?? "",
      userId: order.userId,
      gateway: "paystack",
      reference: initialized.reference,
      amount,
      amountKobo: toKobo(amount),
      currency: "NGN",
      status: "processing",
      customerEmail: email,
      metadata: {
        accessCode: initialized.access_code,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }),
  );

  await orderRef.update(
    stripUndefined({
      paymentMethod: "paystack",
      paymentStatus: "processing",
      paymentReference: initialized.reference,
      paymentId: paymentRef.id,
      timeline: appendTimelineAdmin(order.timeline, "payment_processing"),
      updatedAt: FieldValue.serverTimestamp(),
    }),
  );

  return {
    ok: true as const,
    authorizationUrl: initialized.authorization_url,
    reference: initialized.reference,
    accessCode: initialized.access_code,
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentId: paymentRef.id,
  };
}

export async function verifyPaystackForReference(reference: string) {
  if (!isPaystackConfigured()) {
    return {
      ok: false as const,
      reason: "Paystack is not configured on the server.",
    };
  }

  const db = getAdminDb();
  const paymentSnap = await db
    .collection(COLLECTIONS.payments)
    .where("reference", "==", reference)
    .limit(1)
    .get();

  let orderId: string | undefined;
  let paymentDocId: string | undefined;
  let expectedAmount: number | undefined;

  if (!paymentSnap.empty) {
    const doc = paymentSnap.docs[0]!;
    paymentDocId = doc.id;
    const data = doc.data();
    orderId = data.orderId as string;
    expectedAmount = Number(data.amount);
  }

  const verified = await verifyPaystackTransaction(reference);
  const normalized = normalizePaystackVerification(verified);

  if (!orderId) {
    const meta = verified.metadata as { orderId?: string } | undefined;
    orderId = meta?.orderId;
  }

  if (!orderId) {
    return {
      ok: false as const,
      reason: "Could not resolve the order for this payment reference.",
    };
  }

  if (normalized.status !== "paid") {
    await markPaymentFailed({
      orderId,
      reference,
      status:
        normalized.status === "cancelled"
          ? "cancelled"
          : normalized.status === "expired"
            ? "expired"
            : "failed",
      reason: verified.gateway_response || `Payment ${verified.status}`,
    });
    return {
      ok: false as const,
      reason: verified.gateway_response || `Payment ${verified.status}`,
      status: normalized.status,
      orderId,
      reference,
    };
  }

  if (
    expectedAmount != null &&
    !amountsMatch(expectedAmount, verified.amount)
  ) {
    return {
      ok: false as const,
      reason: "Paid amount does not match the recorded payment.",
      code: "amount_mismatch",
    };
  }

  const finalized = await finalizeSuccessfulPayment({
    orderId,
    payment: normalized,
    paymentDocId,
  });

  if (!finalized.ok) {
    return {
      ok: false as const,
      reason: finalized.reason,
      code: finalized.code,
      orderId,
      reference,
    };
  }

  // Best-effort Make.com notify (same path as webhook).
  const { notifyMakeOrderPaid } = await import("@/lib/server/make-webhook");
  await notifyMakeOrderPaid({
    order: finalized.order,
    reference,
  });

  return {
    ok: true as const,
    order: finalized.order,
    alreadyProcessed: finalized.alreadyProcessed,
    payment: normalized,
    reference,
  };
}
