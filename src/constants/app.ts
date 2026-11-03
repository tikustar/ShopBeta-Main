export const APP_NAME = "Zenvexa";
export const APP_DESCRIPTOR = "Commerce Hug";
export const APP_TAGLINE = "Everything Naija needs, delivered with a warm hug.";
export const BRAND_LOGO = "/brand/zenvexa-mark.png";
export const BRAND_SOCIAL_IMAGE = "/brand/zenvexa-social.jpg";
export const BRAND_THEME_COLOR = "#0D573E";

/**
 * Homepage hero product (matches the "Featured Hug Pick" on the Zenvexa reference
 * storefront). Live price/stock always come from Firestore; if this product is
 * inactive or out of stock the homepage falls back to another sellable product.
 */
export const HOME_HERO_PRODUCT_SLUG =
  "mol-syms-20000mah-100w-power-bank-with-retractable-cable";

/** Hosts configured in next.config images.remotePatterns. */
export const OPTIMIZED_IMAGE_HOSTS = new Set([
  "cdn.dummyjson.com",
  "i.dummyjson.com",
  "m.media-amazon.com",
  "firebasestorage.googleapis.com",
  "images.unsplash.com",
  "lh3.googleusercontent.com",
]);

export function isOptimizableImage(src?: string): src is string {
  if (!src) return false;
  if (src.startsWith("/")) return true;
  try {
    return OPTIMIZED_IMAGE_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

/** Display-only: legacy catalogue copy stored in Firestore may still name the old brand. */
export function withBrandName(text: string): string;
export function withBrandName(text: string | undefined): string | undefined;
export function withBrandName(text: string | undefined) {
  return text?.replace(/\bShop ?Beta\b/g, APP_NAME);
}

/** Firestore prices are whole Naira amounts by default. */
export const CURRENCY = {
  code: "NGN",
  locale: "en-NG",
  symbol: "\u20a6",
} as const;

export const PAGINATION = {
  productsPerPage: 24,
  reviewsPerPage: 10,
} as const;

export const PRODUCT_TAGS = [
  "flash-sale",
  "featured",
  "trending",
  "new",
  "best-seller",
  "special-offer",
] as const;

export type ProductTag = (typeof PRODUCT_TAGS)[number];

export const STOCK_STATUS = [
  "in_stock",
  "low_stock",
  "out_of_stock",
  "preorder",
] as const;

export type StockStatus = (typeof STOCK_STATUS)[number];

export const LOW_STOCK_THRESHOLD = 5;

export const USER_ROLES = [
  "customer",
  "super_admin",
  "admin",
  "inventory_manager",
  "order_manager",
  "customer_support",
  "marketing_manager",
  "staff",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUS = ["active", "suspended", "deleted"] as const;
export type UserStatus = (typeof USER_STATUS)[number];

export const ORDER_STATUS = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUS)[number];

export const PAYMENT_STATUS = [
  "pending",
  "processing",
  "paid",
  "failed",
  "cancelled",
  "refunded",
  "expired",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export const PAYMENT_METHODS = [
  "paystack",
  "korapay",
  "squad",
  "monnify",
  "flutterwave",
  "bachs",
  "cash-on-delivery",
  /** @deprecated Prefer `paystack` — kept for legacy orders. */
  "card",
  "transfer",
  "wallet",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_GATEWAYS = [
  "paystack",
  "korapay",
  "squad",
  "monnify",
  "flutterwave",
  "bachs",
  "cod",
  "none",
] as const;

export type PaymentGateway = (typeof PAYMENT_GATEWAYS)[number];

/** Timeline event codes stored on orders. */
export const ORDER_TIMELINE_EVENTS = [
  "order_created",
  "payment_pending",
  "payment_processing",
  "payment_successful",
  "payment_failed",
  "payment_cancelled",
  "payment_expired",
  "order_confirmed",
  "preparing_shipment",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export type OrderTimelineEvent = (typeof ORDER_TIMELINE_EVENTS)[number];

export const NOTIFICATION_TYPES = [
  "order",
  "promo",
  "system",
  "wishlist",
  "account",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const COUPON_DISCOUNT_TYPES = ["percentage", "fixed"] as const;
export type CouponDiscountType = (typeof COUPON_DISCOUNT_TYPES)[number];

export const PRODUCT_FLAGS = [
  "sponsored",
  "officialStore",
  "featured",
  "trending",
  "flashSale",
  "bestSeller",
  "active",
] as const;

export type ProductFlag = (typeof PRODUCT_FLAGS)[number];

/** Derive stockStatus from a numeric stock count. */
export function stockStatusFromCount(
  stock: number | undefined | null,
): StockStatus {
  if (stock == null) return "out_of_stock";
  if (stock <= 0) return "out_of_stock";
  if (stock <= LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
}
