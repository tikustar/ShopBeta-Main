import { HOME_HERO_PRODUCT_SLUG } from "@/constants/app";
import type { Product } from "@/types/product";

export const sellableHeroProduct = (product?: Product): product is Product =>
  !!product &&
  product.active !== false &&
  product.stock > 0 &&
  product.price > 0 &&
  !!(product.thumbnail ?? product.images?.[0]);

/**
 * Featured Hug Pick resolution:
 *   1. Highest quantity sold today (paid orders only),
 *   2. else the all-time best seller by recorded sales count,
 *   3. else the manually configured hero product, then any sellable product.
 */
export function pickHeroProduct(
  catalog: Product[],
  fallback: Product | undefined,
  todaysTopSellerIds: string[],
): Product | undefined {
  const byId = new Map(catalog.map((product) => [product.id, product]));
  for (const id of todaysTopSellerIds) {
    const product = byId.get(id);
    if (sellableHeroProduct(product)) return product;
  }
  const bestSelling = [...catalog]
    .filter(
      (product) =>
        (product.salesCount ?? 0) > 0 && sellableHeroProduct(product),
    )
    .sort(
      (a, b) =>
        (b.salesCount ?? 0) - (a.salesCount ?? 0) ||
        a.id.localeCompare(b.id),
    )[0];
  if (bestSelling) return bestSelling;
  const configured = catalog.find(
    (product) => product.slug === HOME_HERO_PRODUCT_SLUG,
  );
  if (sellableHeroProduct(configured)) return configured;
  if (sellableHeroProduct(fallback)) return fallback;
  return (
    catalog.find(
      (product) => product.featured && sellableHeroProduct(product),
    ) ?? catalog.find(sellableHeroProduct)
  );
}
