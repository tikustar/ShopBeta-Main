import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDb } from "@/firebase/firestore";
import { reviewDoc, reviewsCollection } from "@/firebase/collections";
import { writeAuditLog } from "@/services/audit.service";
import type { Review, ReviewContactDocument } from "@/types/commerce";

type Actor = { id: string; email?: string };

export type AdminReview = Review & {
  /** Private contact email joined from `reviewContacts` (staff only). */
  email?: string;
};

/** All reviews for moderation — staff reads bypass the approved-only rule. */
export async function listAllReviewsAdmin(): Promise<AdminReview[]> {
  const [reviewsSnap, contactsSnap] = await Promise.all([
    getDocs(query(reviewsCollection(), orderBy("createdAt", "desc"))),
    getDocs(
      query(collection(getDb(), "reviewContacts"), orderBy("createdAt", "desc")),
    ),
  ]);
  const emails = new Map<string, string>();
  for (const document of contactsSnap.docs) {
    const contact = document.data() as ReviewContactDocument;
    if (contact.email) emails.set(contact.reviewId, contact.email);
  }
  return reviewsSnap.docs.map((document) => {
    const review = document.data();
    return { ...review, email: emails.get(review.id) };
  });
}

export function reviewStatus(review: Review): "pending" | "approved" | "rejected" {
  if (review.approved === true) return "approved";
  if (review.rejected === true) return "rejected";
  return "pending";
}

async function moderate(
  id: string,
  patch: Record<string, unknown>,
  action: string,
  actor: Actor,
  previous?: Record<string, unknown>,
) {
  await updateDoc(reviewDoc(id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
  await writeAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    action,
    resourceType: "review",
    resourceId: id,
    previousValue: previous ?? null,
    newValue: patch,
  });
}

/** Approve & publish. Verified Purchase is set here — never by customers. */
export function approveReviewAdmin(id: string, actor: Actor, previous?: AdminReview) {
  return moderate(
    id,
    { approved: true, rejected: false, verifiedPurchase: true },
    "review.approve",
    actor,
    previous
      ? { approved: previous.approved ?? false, rejected: previous.rejected ?? false }
      : undefined,
  );
}

export function unapproveReviewAdmin(id: string, actor: Actor, previous?: AdminReview) {
  return moderate(
    id,
    { approved: false },
    "review.unapprove",
    actor,
    previous ? { approved: previous.approved ?? false } : undefined,
  );
}

export function rejectReviewAdmin(id: string, actor: Actor, previous?: AdminReview) {
  return moderate(
    id,
    { approved: false, rejected: true },
    "review.reject",
    actor,
    previous
      ? { approved: previous.approved ?? false, rejected: previous.rejected ?? false }
      : undefined,
  );
}

export type AdminReviewEdit = {
  reviewBy?: string;
  email?: string;
  rating?: number;
  title?: string;
  review?: string;
  productName?: string;
};

/** Edit review content / reviewer details. Email lives in reviewContacts. */
export async function updateReviewAdmin(
  id: string,
  edit: AdminReviewEdit,
  actor: Actor,
) {
  const patch: Record<string, unknown> = {};
  if (edit.reviewBy !== undefined) patch.reviewBy = edit.reviewBy.trim();
  if (edit.rating !== undefined) {
    const rating = Number(edit.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5)
      throw new Error("Rating must be between 1 and 5.");
    patch.rating = rating;
  }
  if (edit.title !== undefined) patch.title = edit.title;
  if (edit.review !== undefined) patch.review = edit.review;
  if (edit.productName !== undefined) patch.productName = edit.productName;
  await moderate(id, patch, "review.update", actor);

  if (edit.email !== undefined) {
    const ref = doc(getDb(), "reviewContacts", id);
    if (edit.email.trim()) {
      await setDoc(
        ref,
        {
          reviewId: id,
          email: edit.email.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } else {
      await deleteDoc(ref).catch(() => undefined);
    }
  }
}

export async function deleteReviewAdmin(id: string, actor: Actor) {
  await deleteDoc(reviewDoc(id));
  await deleteDoc(doc(getDb(), "reviewContacts", id)).catch(() => undefined);
  await writeAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "review.delete",
    resourceType: "review",
    resourceId: id,
  });
}
