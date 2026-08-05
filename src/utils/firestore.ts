import { Timestamp } from "firebase/firestore";
import type { FirestoreDate } from "@/types/firestore";

/** Normalize any Firestore date representation to a JS Date. */
export function toDate(value: FirestoreDate | null | undefined) {
  if (value === null || value === undefined) return undefined;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function toTimestamp(value: Date | undefined) {
  return value ? Timestamp.fromDate(value) : undefined;
}

/** Drop undefined values, which Firestore rejects on write. */
export function stripUndefined<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

/** Parse the free-form `specification` blob into label/value pairs. */
export function parseSpecificationBlock(specification?: string) {
  if (!specification) return [];
  return specification
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf(":");
      if (separator === -1) return { label: line, value: "" };
      return {
        label: line.slice(0, separator).trim(),
        value: line.slice(separator + 1).trim(),
      };
    })
    .filter((entry) => entry.value.length > 0);
}
