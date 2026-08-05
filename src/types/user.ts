import type { Timestamps } from "./firestore";

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

/** Planned `users` collection (not present in Firestore yet). */
export type UserDocument = Timestamps & {
  email: string;
  displayName?: string;
  phone?: string;
  photoUrl?: string;
  role?: UserRole;
  addresses?: Address[];
  defaultAddressId?: string;
  active?: boolean;
};

export type UserProfile = UserDocument & { id: string };
