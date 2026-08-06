export const APP_NAME = "ShopBeta";

/** Firestore prices are whole Naira amounts. */
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
