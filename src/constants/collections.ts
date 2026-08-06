/**
 * Firestore collection paths for ShopBeta.
 * Catalog collections are live; commerce collections are prepared for Phase 3+.
 */
export const COLLECTIONS = {
  products: "products",
  categories: "categories",
  brands: "brands",
  users: "users",
  addresses: "addresses",
  orders: "orders",
  carts: "carts",
  wishlists: "wishlists",
  reviews: "reviews",
  notifications: "notifications",
  coupons: "coupons",
  payments: "payments",
  banners: "banners",
  auditLogs: "auditLogs",
  settings: "settings",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/** Singleton settings document id. */
export const APP_SETTINGS_DOC_ID = "app";
