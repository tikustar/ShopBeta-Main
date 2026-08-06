import { getDoc, setDoc } from "firebase/firestore";
import { cartDoc } from "@/firebase/collections";
import type { Cart, CartDocument } from "@/types/commerce";

export async function getCart(userId: string): Promise<Cart | undefined> {
  const snapshot = await getDoc(cartDoc(userId));
  return snapshot.exists() ? snapshot.data() : undefined;
}

/** Create or overwrite the cart document for a user (doc id = userId). */
export async function setCart(
  userId: string,
  data: Partial<CartDocument>,
): Promise<void> {
  await setDoc(
    cartDoc(userId),
    { ...data, userId, id: userId } as Cart,
    { merge: true },
  );
}
