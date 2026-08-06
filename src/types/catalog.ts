import type { Timestamps } from "./firestore";

/** `categories` collection — populated by `npm run seed:catalog`. */
export type CategoryDocument = Timestamps & {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  parentId?: string | null;
  subcategories?: string[];
  productCount?: number;
  featured?: boolean;
  active?: boolean;
};

export type Category = CategoryDocument & { id: string };

/** `brands` collection — populated by `npm run seed:catalog`. */
export type BrandDocument = Timestamps & {
  name: string;
  slug: string;
  /** Empty when a logo is unavailable. */
  logo?: string;
  logoUrl?: string;
  description?: string;
  categoryId?: string;
  productCount?: number;
  featured?: boolean;
  active?: boolean;
};

export type Brand = BrandDocument & { id: string };
