import { cache } from "react";
import {
  getDoc,
  getDocs,
  limit as limitTo,
  orderBy,
  query,
  where,
  type Query,
  type QueryConstraint,
} from "firebase/firestore";
import { productDoc, productsCollection } from "@/firebase/collections";
import type { Product } from "@/types/product";

/**
 * Legacy documents have no `active` field, so "active" is expressed as
 * `active != false` client-side rather than as a Firestore predicate.
 */
async function run(...constraints: QueryConstraint[]): Promise<Product[]> {
  const snapshot = await getDocs(
    query(productsCollection(), ...constraints) as Query<Product>,
  );
  return snapshot.docs.map((document) => document.data());
}

/** Deduplicated per render pass, so a page with many sections reads once. */
const fetchAll = cache(() => run());

async function fetchActive() {
  return (await fetchAll()).filter((product) => product.active);
}

export async function getActiveProducts(max?: number): Promise<Product[]> {
  const products = await fetchActive();
  return max ? products.slice(0, max) : products;
}

/** Alias kept for callers that just want the whole catalogue. */
export const listProducts = getActiveProducts;

async function byFlag(
  flag: "featured" | "trending" | "flashSale" | "bestSeller" | "sponsored",
  max?: number,
): Promise<Product[]> {
  const matches = (await fetchActive()).filter((product) => product[flag]);
  return max ? matches.slice(0, max) : matches;
}

export const getFeaturedProducts = (max?: number) => byFlag("featured", max);
export const getTrendingProducts = (max?: number) => byFlag("trending", max);
export const getFlashSaleProducts = (max?: number) => byFlag("flashSale", max);
export const getBestSellers = (max?: number) => byFlag("bestSeller", max);
export const getSponsoredProducts = (max?: number) => byFlag("sponsored", max);

/** Products with a discount, biggest saving first. */
export async function getDiscountedProducts(max?: number): Promise<Product[]> {
  const products = (await fetchActive())
    .filter((product) => product.discount > 0)
    .sort((a, b) => b.discount - a.discount);
  return max ? products.slice(0, max) : products;
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const snapshot = await getDoc(productDoc(id));
  return snapshot.exists() ? snapshot.data() : undefined;
}

/**
 * Documents migrated by `scripts/migrate-products.mjs` carry a `slug`. Until
 * then the id and the converter-derived slug keep documents reachable.
 */
export async function getProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  const [indexed] = await run(where("slug", "==", slug), limitTo(1));
  if (indexed) return indexed;
  const byId = await getProductById(slug);
  if (byId) return byId;
  return (await fetchAll()).find((product) => product.slug === slug);
}

export async function getProductsByCategory(
  category: string,
  max?: number,
): Promise<Product[]> {
  const products = (await fetchActive()).filter(
    (product) =>
      product.categoryId === category ||
      product.category?.toLowerCase() === category.toLowerCase(),
  );
  return max ? products.slice(0, max) : products;
}

/** Same category first, then any other product, excluding the product itself. */
export async function getRelatedProducts(
  product: Product,
  max = 4,
): Promise<Product[]> {
  const products = (await fetchActive()).filter(
    (item) => item.id !== product.id,
  );
  const sameCategory = products.filter(
    (item) => item.category === product.category,
  );
  const rest = products.filter((item) => !sameCategory.includes(item));
  return [...sameCategory, ...rest].slice(0, max);
}

/**
 * Newest first. An `orderBy` on `createdAt` silently drops documents missing the
 * field, so an empty result falls back to the unordered catalogue.
 */
export async function getLatestProducts(max = 4): Promise<Product[]> {
  try {
    const products = (await run(orderBy("createdAt", "desc"), limitTo(max))).filter(
      (product) => product.active,
    );
    if (products.length) return products;
  } catch {
    // Fall through to the unordered catalogue.
  }
  return getActiveProducts(max);
}

export async function searchProducts(
  term: string,
  max?: number,
): Promise<Product[]> {
  const needle = term.trim().toLowerCase();
  if (!needle) return getActiveProducts(max);
  const products = (await fetchActive()).filter((product) =>
    [product.name, product.description, product.category ?? ""].some((field) =>
      field.toLowerCase().includes(needle),
    ),
  );
  return max ? products.slice(0, max) : products;
}
