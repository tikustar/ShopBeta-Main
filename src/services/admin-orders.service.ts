import {
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { orderDoc, ordersCollection } from "@/firebase/collections";
import { appendTimeline } from "@/lib/order-timeline";
import { writeAuditLog } from "@/services/audit.service";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";

type Actor = { id: string; email?: string };

export async function listOrdersAdmin(): Promise<Order[]> {
  const snapshot = await getDocs(ordersCollection());
  return snapshot.docs
    .map((d) => d.data())
    .sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return bTime - aTime;
    });
}

export async function getOrderAdmin(id: string) {
  const snapshot = await getDoc(orderDoc(id));
  return snapshot.exists() ? snapshot.data() : undefined;
}

function timelineEventForStatus(orderStatus: OrderStatus) {
  if (orderStatus === "shipped") return "shipped";
  if (orderStatus === "delivered") return "delivered";
  if (orderStatus === "cancelled") return "cancelled";
  if (orderStatus === "processing") return "preparing_shipment";
  if (orderStatus === "paid") return "payment_successful";
  if (orderStatus === "refunded") return "refunded";
  return "order_confirmed";
}

export async function updateOrderStatusAdmin(
  id: string,
  orderStatus: OrderStatus,
  actor: Actor,
) {
  const existing = await getOrderAdmin(id);
  if (!existing) throw new Error("Order not found.");
  const timeline = appendTimeline(
    existing.timeline,
    timelineEventForStatus(orderStatus),
  );
  await updateDoc(orderDoc(id), {
    orderStatus,
    status: orderStatus,
    timeline,
    updatedAt: serverTimestamp(),
  });
  await writeAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "order.status_update",
    resourceType: "order",
    resourceId: id,
    previousValue: existing.orderStatus ?? existing.status ?? null,
    newValue: orderStatus,
  });
}

export async function updateOrderPaymentStatusAdmin(
  id: string,
  paymentStatus: PaymentStatus,
  actor: Actor,
) {
  const existing = await getOrderAdmin(id);
  await updateDoc(orderDoc(id), {
    paymentStatus,
    updatedAt: serverTimestamp(),
  });
  await writeAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "order.payment_status_update",
    resourceType: "order",
    resourceId: id,
    previousValue: existing?.paymentStatus ?? null,
    newValue: paymentStatus,
  });
}

export async function setOrderTrackingAdmin(
  id: string,
  trackingNumber: string,
  actor: Actor,
) {
  await updateDoc(orderDoc(id), {
    trackingNumber,
    updatedAt: serverTimestamp(),
  });
  await writeAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "order.tracking_update",
    resourceType: "order",
    resourceId: id,
    newValue: { trackingNumber },
  });
}
