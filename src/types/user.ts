import type { FirestoreDate, Timestamps } from "./firestore";

export type Address = {
  id?: string;
  label?: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  isDefault?: boolean;
};

export type UserRole = "customer" | "admin";

/**
 * Shape of a `users` document in the existing Firestore project. The live
 * document uses snake_case (`created_time`, `display_name`) and mirrors the
 * Auth record; camelCase fields below are the ShopBeta additions.
 */
export type UserDocument = Timestamps & {
  /** Duplicates the document id, which is the Firebase Auth uid. */
  uid?: string;
  email?: string;
  /** Legacy snake_case field written by the existing app. */
  display_name?: string;
  /** Legacy snake_case creation timestamp. */
  created_time?: FirestoreDate;

  displayName?: string;
  phone?: string;
  photoUrl?: string;
  role?: UserRole;
  addresses?: Address[];
  defaultAddressId?: string;
  active?: boolean;
};

export type UserProfile = UserDocument & { id: string };
