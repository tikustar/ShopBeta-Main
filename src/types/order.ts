import type {

  OrderStatus,

  PaymentMethod,

  PaymentStatus,

} from "@/constants/app";

import type { Timestamps } from "./firestore";

import type { OrderTimelineEntry } from "./payment";

import type { Address } from "./user";



export type { OrderStatus, PaymentMethod, PaymentStatus };

export type { OrderTimelineEntry };



export type OrderItem = {

  productId: string;

  name?: string;

  slug?: string;

  image?: string;

  variation?: string;

  unitPrice?: number;

  quantity: number;

  lineTotal?: number;

};



export type OrderCustomer = {

  userId?: string;

  name?: string;

  email?: string;

  phone?: string;

};



export type OrderTotals = {

  subtotal?: number;

  discount?: number;

  shipping?: number;

  deliveryFee?: number;

  tax?: number;

  total?: number;

};



/** `orders` collection document. */

export type OrderDocument = Timestamps & {

  orderNumber?: string;

  /** Legacy reference alias for `orderNumber`. */

  reference?: string;

  userId: string;

  customer?: OrderCustomer;

  /** Primary line items. */

  products?: OrderItem[];

  /** Alias for `products`. */

  items?: OrderItem[];

  subtotal?: number;

  deliveryFee?: number;

  /** Alias for `deliveryFee`. */

  shipping?: number;

  discount?: number;

  tax?: number;

  total?: number;

  /** Nested totals object (compat with earlier shape). */

  totals?: OrderTotals;

  paymentMethod?: PaymentMethod | string;

  paymentStatus?: PaymentStatus;

  paymentReference?: string;

  paymentId?: string;

  couponCode?: string;

  deliveryOptionId?: string;

  /** Primary fulfilment status. */

  orderStatus?: OrderStatus;

  /** Alias for `orderStatus`. */

  status?: OrderStatus;

  shippingAddress?: Address;

  trackingNumber?: string;

  notes?: string;

  /** Ordered timeline of payment / fulfilment events. */

  timeline?: OrderTimelineEntry[];

  /** True once inventory has been decremented for this order. */

  inventoryReserved?: boolean;

  /** Make.com notification status */
  makeNotifyStatus?: string;

  /** Make.com notification timestamp */
  makeNotifiedAt?: unknown;

  /** Make.com notification error */
  makeNotifyError?: string;

  /** Make.com notification attempt timestamp */
  makeNotifyAttemptedAt?: unknown;

};



export type Order = OrderDocument & { id: string };


