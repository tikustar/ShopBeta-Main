import type { Timestamps } from "./firestore";

export type CartItem = {
  productId: string;
  quantity: number;
  variation?: string;
  /** Price captured when the item was added, for change detection. */
  unitPrice?: number;
};

/** Planned `carts` collection, one document per user. */
export type CartDocument = Timestamps & {
  userId: string;
  items: CartItem[];
};

export type Cart = CartDocument & { id: string };

export type WishlistItem = {
  productId: string;
  addedAt?: Timestamps["createdAt"];
};

/** Planned `wishlists` collection, one document per user. */
export type WishlistDocument = Timestamps & {
  userId: string;
  items: WishlistItem[];
};

export type Wishlist = WishlistDocument & { id: string };

/** Planned standalone `reviews` collection (reviews are embedded today). */
export type ReviewDocument = Timestamps & {
  productId: string;
  userId?: string;
  reviewBy: string;
  rating: number;
  title?: string;
  comment: string;
  approved?: boolean;
};

export type Review = ReviewDocument & { id: string };

export type NotificationKind = "order" | "promo" | "system" | "wishlist";

/** Planned `notifications` collection. */
export type NotificationDocument = Timestamps & {
  userId: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  href?: string;
  read?: boolean;
};

export type AppNotification = NotificationDocument & { id: string };
