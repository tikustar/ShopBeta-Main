import type { FirestoreDate, Timestamps } from "./firestore";
import type { ProductTag } from "@/constants/app";

/** Review embedded in the existing `products` documents. */
export type EmbeddedProductReview = {
  reviewBy: string;
  rating: number;
  comment: string;
  /** Short headline stored as `nice` in the existing documents. */
  nice?: string;
  date?: FirestoreDate;
};

export type ProductVariantOption = {
  label: string;
  value: string;
  priceDelta?: number;
  stock?: number;
  sku?: string;
};

export type ProductSpecification = {
  label: string;
  value: string;
};

/**
 * Shape of a `products` document in the existing Firestore project.
 * Every field is optional because the live documents are inconsistent
 * (e.g. `officalStore` is a legacy misspelling of `officialStore`).
 */
export type ProductDocument = Timestamps & {
  productName?: string;
  description?: string;
  /** Free-form "Label: value" block, newline separated. */
  specification?: string;
  price?: number;
  /** Percentage off, 0-100. */
  discount?: number;
  rating?: number;
  imgs?: string[];
  variation?: string[];
  category?: string;
  sponsored?: boolean;
  officialStore?: boolean;
  /** Legacy misspelling still present on some documents. */
  officalStore?: boolean;
  reviews?: EmbeddedProductReview[];

  // Recommended additions (absent from the live documents today).
  slug?: string;
  sku?: string;
  barcode?: string;
  brandId?: string;
  categoryId?: string;
  subcategory?: string;
  thumbnail?: string;
  images?: string[];
  stock?: number;
  reviewCount?: number;
  specifications?: ProductSpecification[];
  variants?: ProductVariantOption[];
  tags?: ProductTag[];
  featured?: boolean;
  trending?: boolean;
  flashSale?: boolean;
  bestSeller?: boolean;
  active?: boolean;
};

/** Normalized product used by the UI layer. */
export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount: number;
  /** Price before discount, derived from `price` and `discount`. */
  oldPrice?: number;
  rating: number;
  reviewCount: number;
  images: string[];
  thumbnail?: string;
  category?: string;
  categoryId?: string;
  brandId?: string;
  stock?: number;
  sku?: string;
  variations: string[];
  specifications: ProductSpecification[];
  reviews: EmbeddedProductReview[];
  sponsored: boolean;
  officialStore: boolean;
  tags: ProductTag[];
  featured: boolean;
  trending: boolean;
  flashSale: boolean;
  bestSeller: boolean;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
