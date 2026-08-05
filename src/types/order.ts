import type { Timestamps } from "./firestore";
import type { Address } from "./user";

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentMethod = "card" | "transfer" | "cash-on-delivery";

export type OrderItem = {
  productId: string;
  name: string;
  slug?: string;
  image?: string;
  variation?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderTotals = {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
};

/** Planned `orders` collection (not present in Firestore yet). */
export type OrderDocument = Timestamps & {
  userId: string;
  reference: string;
  items: OrderItem[];
  totals: OrderTotals;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  shippingAddress?: Address;
  trackingNumber?: string;
  notes?: string;
};

export type Order = OrderDocument & { id: string };
