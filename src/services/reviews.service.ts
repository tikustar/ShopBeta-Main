import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { getFirebaseAuth } from "@/firebase/auth";
import { getDb } from "@/firebase/firestore";
import { reviewDoc, reviewsCollection } from "@/firebase/collections";
import { uploadReviewImage } from "@/services/media.service";
import type { Review } from "@/types/commerce";

/** Admin-approved reviews only — pending/rejected/legacy docs stay hidden. */
export async function listApprovedReviews(
  productId: string,
): Promise<Review[]> {
  const snapshot = await getDocs(
    query(
      reviewsCollection(),
      where("productId", "==", productId),
      where("approved", "==", true),
    ),
  );
  return snapshot.docs.map((document) => document.data());
}

export async function listReviewsByProduct(
  productId: string,
): Promise<Review[]> {
  const snapshot = await getDocs(
    query(reviewsCollection(), where("productId", "==", productId)),
  );
  return snapshot.docs.map((document) => document.data());
}

export async function getReview(id: string): Promise<Review | undefined> {
  const snapshot = await getDoc(reviewDoc(id));
  return snapshot.exists() ? snapshot.data() : undefined;
}

const MAX_REVIEW_IMAGES = 3;

let reviewSignIn: Promise<unknown> | undefined;

/** Reviews need a stable auth uid for ownership and image upload paths. */
async function ensureReviewerAuth(): Promise<string> {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  if (!auth.currentUser && !reviewSignIn) {
    reviewSignIn = signInAnonymously(auth).finally(() => {
      reviewSignIn = undefined;
    });
  }
  const user = auth.currentUser ?? ((await reviewSignIn) as { user: { uid: string } }).user;
  return user.uid;
}

export type ReviewSubmission = {
  productId: string;
  productSlug?: string;
  productName?: string;
  reviewerName: string;
  email?: string;
  rating: number;
  text: string;
  title?: string;
  images?: File[];
};

/**
 * Submit a customer review for admin moderation. The document is always
 * created unapproved/unverified — security rules reject any attempt to
 * self-approve. Email (optional) goes to the staff-only `reviewContacts`
 * collection, never onto the public review document.
 */
export async function submitReview(input: ReviewSubmission): Promise<string> {
  const name = input.reviewerName.trim();
  if (!name) throw new Error("Please enter your name.");
  if (!Number.isFinite(input.rating) || input.rating < 1 || input.rating > 5)
    throw new Error("Please choose a star rating.");
  const text = input.text.trim();
  if (!text) throw new Error("Please write your review.");

  const files = (input.images ?? []).slice(0, MAX_REVIEW_IMAGES);
  const uid = await ensureReviewerAuth();

  const imageUrls: string[] = [];
  for (const file of files) {
    imageUrls.push(await uploadReviewImage(uid, file, input.productSlug));
  }

  const db = getDb();
  const ref = doc(collection(db, "reviews"));
  await setDoc(ref, {
    productId: input.productId,
    productSlug: input.productSlug ?? "",
    productName: input.productName ?? "",
    userId: uid,
    reviewBy: name,
    rating: input.rating,
    title: input.title?.trim() || "",
    review: text,
    images: imageUrls,
    approved: false,
    rejected: false,
    verifiedPurchase: false,
    helpfulCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const email = input.email?.trim();
  if (email) {
    await setDoc(doc(db, "reviewContacts", ref.id), {
      reviewId: ref.id,
      userId: uid,
      email,
      createdAt: serverTimestamp(),
    });
  }
  return ref.id;
}
