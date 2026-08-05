import { getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { productDoc, productsCollection } from "@/firebase/collections";
import type { Product } from "@/types/product";

export async function listProducts(max?: number): Promise<Product[]> {
  const collectionRef = productsCollection();
  const snapshot = await getDocs(
    max ? query(collectionRef, limit(max)) : collectionRef,
  );
  return snapshot.docs.map((document) => document.data());
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const snapshot = await getDoc(productDoc(id));
  return snapshot.exists() ? snapshot.data() : undefined;
}

/**
 * Products have no `slug` field in Firestore yet, so this falls back to the
 * document id until the Phase 2 migration backfills slugs.
 */
export async function getProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  const snapshot = await getDocs(
    query(productsCollection(), where("slug", "==", slug), limit(1)),
  );
  return snapshot.docs[0]?.data() ?? getProductById(slug);
}
