import type { NotificationType } from "@/constants/app";
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
  /** Primary line-item array. */
  products?: CartItem[];
  /** Legacy alias for `products`. */
  items?: CartItem[];
  subtotal?: number;
};

export type Cart = CartDocument & { id: string };

export type WishlistItem = {
  productId: string;
  addedAt?: Timestamps["createdAt"];
};

/** Planned `wishlists` collection, one document per user. */
export type WishlistDocument = Timestamps & {
  userId: string;
  /** Primary product id list. */
  productIds?: string[];
  /** Legacy alias for structured items. */
  items?: WishlistItem[];
};

export type Wishlist = WishlistDocument & { id: string };

/** Standalone `reviews` collection document. */
export type ReviewDocument = Timestamps & {
  productId: string;
  /** Denormalized for admin moderation display/search. */
  productSlug?: string;
  productName?: string;
  userId?: string;
  /** Reviewer display name (legacy field name). */
  reviewBy?: string;
  rating: number;
  title?: string;
  /** Primary review body. */
  review?: string;
  /** Alias for `review`. */
  comment?: string;
  images?: string[];
  /** Set by admins only — never trusted from customer input. */
  verifiedPurchase?: boolean;
  helpfulCount?: number;
  /** Only admin-approved reviews are publicly visible. Missing = unapproved. */
  approved?: boolean;
  /** Admin moderation flag — rejected reviews stay hidden. */
  rejected?: boolean;
};

export type Review = ReviewDocument & { id: string };

/**
 * `reviewContacts` — private reviewer contact details (email). Kept out of
 * the public `reviews` document so approved reviews never expose emails.
 * Document id equals the review id; readable by staff only.
 */
export type ReviewContactDocument = {
  reviewId: string;
  userId: string;
  email?: string;
  createdAt?: unknown;
};

export type NotificationKind = NotificationType;

/** Planned `notifications` collection. */
export type NotificationDocument = Timestamps & {
  storeId?: "shopbeta" | "zenvexa";

  userId: string;
  title: string;
  /** Primary message body. */
  message?: string;
  /** Alias for `message`. */
  body?: string;
  /** Primary notification type. */
  type?: NotificationKind | string;
  /** Alias for `type`. */
  kind?: NotificationKind;
  href?: string;
  read?: boolean;
};

export type AppNotification = NotificationDocument & { id: string };
