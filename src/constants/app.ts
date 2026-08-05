export const APP_NAME = "ShopBeta";

export const CURRENCY = {
  code: "USD",
  locale: "en-US",
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
