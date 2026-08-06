import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as limitTo,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { COLLECTIONS } from "@/constants/collections";
import { getDb } from "@/firebase/firestore";
import { orderDoc, ordersCollection } from "@/firebase/collections";
import type { CartLine } from "@/lib/cart";
import { generateOrderNumber } from "@/lib/cart";
import { clientTimelineEntry } from "@/lib/order-timeline";
import type { Order, OrderDocument, OrderItem } from "@/types/order";
import type { Address } from "@/types/user";
import type { ProductDocument } from "@/types/product";

export async function getOrderById(id: string): Promise<Order | undefined> {
  const snapshot = await getDoc(orderDoc(id));
  return snapshot.exists() ? snapshot.data() : undefined;
}

export async function listOrdersByUser(userId: string): Promise<Order[]> {
  const snapshot = await getDocs(
    query(ordersCollection(), where("userId", "==", userId)),
  );
  return snapshot.docs.map((document) => document.data());
}

export async function getOrderByNumber(
  orderNumber: string,
): Promise<Order | undefined> {
  const normalized = orderNumber.trim().toUpperCase();
  if (!normalized) return undefined;

  const snapshot = await getDocs(
    query(
      ordersCollection(),
      where("orderNumber", "==", normalized),
      limitTo(1),
    ),
  );
  if (snapshot.docs[0]) return snapshot.docs[0].data();

  return getOrderById(orderNumber.trim());
}

export type PlaceOrderInput = {
  userId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  lines: CartLine[];
  shippingAddress: Address;
  deliveryFee: number;
  discount: number;
  tax: number;
  subtotal: number;
  total: number;
  paymentMethod: string;
  notes?: string;
  deliveryOptionId?: string;
  couponCode?: string;
};

export type PlaceOrderResult =
  | { ok: true; order: Order }
  | { ok: false; reason: string };

/**
 * Create a pending order without reducing stock.
 * Stock is reserved after Paystack verification or COD confirmation (server).
 */
export async function createPendingOrder(
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  if (!input.lines.length) {
    return { ok: false, reason: "Your cart is empty." };
  }

  const db = getDb();
  const orderNumber = generateOrderNumber();
  const orderRef = doc(collection(db, COLLECTIONS.orders));

  try {
    const order = await runTransaction(db, async (transaction) => {
      const products: OrderItem[] = [];

      for (const line of input.lines) {
        const productRef = doc(db, COLLECTIONS.products, line.productId);
        const snapshot = await transaction.get(productRef);
        if (!snapshot.exists()) {
          throw new Error(
            `"${line.name}" is no longer available. Remove it from your cart.`,
          );
        }

        const data = snapshot.data() as ProductDocument;
        if (data.active === false) {
          throw new Error(`"${line.name}" is unavailable.`);
        }

        const stock = Number(data.stock ?? 0);
        if (stock < line.quantity) {
          throw new Error(
            stock <= 0
              ? `"${line.name}" is out of stock.`
              : `Only ${stock} of "${line.name}" left in stock.`,
          );
        }

        const unitPrice = Number(data.price ?? line.price);
        products.push({
          productId: line.productId,
          name: data.productName ?? line.name,
          slug: data.slug ?? line.slug,
          image: data.thumbnail ?? line.thumbnail,
          variation: line.variation,
          unitPrice,
          quantity: line.quantity,
          lineTotal: unitPrice * line.quantity,
        });
      }

      const timeline = [
        clientTimelineEntry("order_created"),
        clientTimelineEntry("payment_pending"),
      ];

      const document: OrderDocument = {
        orderNumber,
        reference: orderNumber,
        userId: input.userId,
        customer: {
          userId: input.userId,
          name: input.customer.name,
          email: input.customer.email,
          phone: input.customer.phone,
        },
        products,
        items: products,
        subtotal: input.subtotal,
        deliveryFee: input.deliveryFee,
        shipping: input.deliveryFee,
        discount: input.discount,
        tax: input.tax,
        total: input.total,
        totals: {
          subtotal: input.subtotal,
          deliveryFee: input.deliveryFee,
          shipping: input.deliveryFee,
          discount: input.discount,
          tax: input.tax,
          total: input.total,
        },
        paymentMethod: input.paymentMethod,
        paymentStatus: "pending",
        orderStatus: "pending",
        status: "pending",
        shippingAddress: input.shippingAddress,
        notes: input.notes,
        deliveryOptionId: input.deliveryOptionId,
        couponCode: input.couponCode,
        timeline,
        inventoryReserved: false,
        createdAt: serverTimestamp() as OrderDocument["createdAt"],
        updatedAt: serverTimestamp() as OrderDocument["updatedAt"],
      };

      transaction.set(orderRef, document);

      return {
        id: orderRef.id,
        ...document,
        createdAt: new Date(),
        updatedAt: new Date(),
      } satisfies Order;
    });

    return { ok: true, order };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not place your order. Please try again.";
    return { ok: false, reason: message };
  }
}

/**
 * @deprecated Prefer `createPendingOrder` + payment APIs.
 * Kept as an alias so existing call sites keep compiling during migration.
 */
export async function placeOrder(
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  return createPendingOrder(input);
}
