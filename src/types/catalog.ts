import type { Timestamps } from "./firestore";

/** Planned `categories` collection (not present in Firestore yet). */
export type CategoryDocument = Timestamps & {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string | null;
  subcategories?: string[];
  productCount?: number;
  active?: boolean;
};

export type Category = CategoryDocument & { id: string };

/** Planned `brands` collection (not present in Firestore yet). */
export type BrandDocument = Timestamps & {
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  categoryId?: string;
  productCount?: number;
  featured?: boolean;
  active?: boolean;
};

export type Brand = BrandDocument & { id: string };
