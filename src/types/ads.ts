import type { FirestoreDate } from "./firestore";

/** Advertising expense record */
export type AdDocument = {
  platform: string;
  campaignName?: string;
  amount: number;
  date: string; // YYYY-MM-DD format
  description?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
};

export type Ad = AdDocument & { id: string };

/** Form input type for creating/editing ads */
export type AdInput = {
  platform: string;
  campaignName?: string;
  amount: string;
  date: string;
  description?: string;
};

/** Validation result for ad input */
export type AdValidationResult = {
  ok: boolean;
  reason?: string;
};
