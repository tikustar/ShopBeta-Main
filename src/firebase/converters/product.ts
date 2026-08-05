import type {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  WithFieldValue,
} from "firebase/firestore";
import type { ProductTag } from "@/constants/app";
import { productDocumentSchema } from "@/schemas/product.schema";
import type { Product, ProductDocument } from "@/types/product";
import { priceBeforeDiscount } from "@/utils/currency";
import {
  parseSpecificationBlock,
  stripUndefined,
  toDate,
} from "@/utils/firestore";
import { slugify } from "@/utils/string";

function deriveTags(document: ProductDocument): ProductTag[] {
  if (document.tags?.length) return document.tags;
  const tags: ProductTag[] = [];
  if (document.flashSale) tags.push("flash-sale");
  if (document.featured) tags.push("featured");
  if (document.trending) tags.push("trending");
  if (document.bestSeller) tags.push("best-seller");
  if (document.discount) tags.push("special-offer");
  return tags;
}

/** Normalize a raw `products` document into the app-level `Product` model. */
export function toProduct(id: string, raw: unknown): Product {
  const parsed = productDocumentSchema.safeParse(raw);
  const document = (parsed.success ? parsed.data : {}) as ProductDocument;
  const name = document.productName ?? id;
  const price = document.price ?? 0;
  const images = document.images ?? document.imgs ?? [];
  const reviews = document.reviews ?? [];

  return {
    id,
    name,
    slug: document.slug ?? slugify(name),
    description: document.description ?? "",
    price,
    discount: document.discount ?? 0,
    oldPrice: priceBeforeDiscount(price, document.discount),
    rating: document.rating ?? 0,
    reviewCount: document.reviewCount ?? reviews.length,
    images,
    thumbnail: document.thumbnail ?? images[0],
    category: document.category,
    categoryId: document.categoryId,
    brandId: document.brandId,
    stock: document.stock,
    sku: document.sku,
    variations: document.variation ?? [],
    specifications:
      document.specifications ?? parseSpecificationBlock(document.specification),
    reviews,
    sponsored: document.sponsored ?? false,
    officialStore: document.officialStore ?? document.officalStore ?? false,
    tags: deriveTags(document),
    featured: document.featured ?? false,
    trending: document.trending ?? false,
    flashSale: document.flashSale ?? false,
    bestSeller: document.bestSeller ?? false,
    active: document.active ?? true,
    createdAt: toDate(document.createdAt),
    updatedAt: toDate(document.updatedAt),
  };
}

/** Map an app-level `Product` back onto the existing Firestore field names. */
export function toProductDocument(
  product: Partial<Product>,
): Partial<ProductDocument> {
  return stripUndefined({
    productName: product.name,
    description: product.description,
    price: product.price,
    discount: product.discount,
    rating: product.rating,
    imgs: product.images,
    variation: product.variations,
    category: product.category,
    sponsored: product.sponsored,
    officialStore: product.officialStore,
    reviews: product.reviews,
    slug: product.slug,
    sku: product.sku,
    brandId: product.brandId,
    categoryId: product.categoryId,
    thumbnail: product.thumbnail,
    stock: product.stock,
    reviewCount: product.reviewCount,
    specifications: product.specifications,
    tags: product.tags,
    featured: product.featured,
    trending: product.trending,
    flashSale: product.flashSale,
    bestSeller: product.bestSeller,
    active: product.active,
  });
}

export const productConverter: FirestoreDataConverter<Product, ProductDocument> =
  {
    toFirestore(product: WithFieldValue<Product>) {
      return toProductDocument(product as Partial<Product>) as ProductDocument;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot<ProductDocument>) {
      return toProduct(snapshot.id, snapshot.data());
    },
  };
