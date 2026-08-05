/**
 * Firestore collection paths. `products` exists today; the rest are the planned
 * paths for Phase 2 and are not created or written to yet.
 */
export const COLLECTIONS = {
  products: "products",
  categories: "categories",
  brands: "brands",
  users: "users",
  orders: "orders",
  carts: "carts",
  wishlists: "wishlists",
  reviews: "reviews",
  notifications: "notifications",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
