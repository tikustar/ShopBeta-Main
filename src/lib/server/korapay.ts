import { createHmac, timingSafeEqual } from "crypto";
import {
  fromKobo,
  getKorapaySecretKey,
  toKobo,
} from "@/lib/server/env";
import type { NormalizedPaymentResult } from "@/types/payment";

const KORAPAY_BASE = "https://api.korapay.com/merchant/api/v1";

type KorapayResponse<T> = {
  status: boolean;
  message: string;
  data: T;
};

export type KorapayInitializeResult = {
  checkout_url: string;
  reference: string;
};

export type KorapayVerifyData = {
  id: string;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  customer?: {
    name?: string;
    email?: string;
  };
  fees?: number;
  merchant_fee?: number;
  settlement_amount?: number;
  created_at?: string;
  paid_at?: string;
  metadata?: Record<string, unknown>;
};

async function korapayFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<KorapayResponse<T>> {
  const secret = getKorapaySecretKey();
  const response = await fetch(`${KORAPAY_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  let body: KorapayResponse<T>;
  try {
    body = (await response.json()) as KorapayResponse<T>;
  } catch {
    throw new Error("KoraPay returned an invalid response.");
  }

  if (!response.ok || !body.status) {
    throw new Error(body.message || `KoraPay error (${response.status}).`);
  }
  return body;
}

export async function initializeKorapayTransaction(input: {
  email: string;
  amountNaira: number;
  reference: string;
  redirectUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<KorapayInitializeResult> {
  const amountKobo = toKobo(input.amountNaira);
  if (amountKobo < 100) {
    throw new Error("Order total is too small to charge.");
  }

  const result = await korapayFetch<KorapayInitializeResult>(
    "/charges/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        amount: amountKobo,
        currency: "NGN",
        reference: input.reference,
        customer: {
          name: input.metadata?.customerName as string || "",
          email: input.email,
        },
        redirect_url: input.redirectUrl,
        metadata: input.metadata,
      }),
    },
  );

  return result.data;
}

export async function verifyKorapayTransaction(
  reference: string,
): Promise<KorapayVerifyData> {
  const result = await korapayFetch<KorapayVerifyData>(
    `/transactions/${reference}`,
  );
  return result.data;
}

export function mapKorapayStatus(
  status: string,
): NormalizedPaymentResult["status"] {
  const normalized = status.toLowerCase();
  if (normalized === "success" || normalized === "successful") return "paid";
  if (normalized === "failed" || normalized === "failure") return "failed";
  if (normalized === "cancelled") return "cancelled";
  if (normalized === "refunded") return "refunded";
  if (normalized === "pending" || normalized === "processing") {
    return "processing";
  }
  return "pending";
}

export function normalizeKorapayVerification(
  data: KorapayVerifyData,
): NormalizedPaymentResult {
  return {
    reference: data.reference,
    status: mapKorapayStatus(data.status),
    amount: fromKobo(data.amount),
    currency: data.currency || "NGN",
    gateway: "korapay",
    paidAt: data.paid_at,
    customerEmail: data.customer?.email,
    gatewayResponse: data as unknown as Record<string, unknown>,
  };
}

/** Validate KoraPay webhook signature (x-korapay-signature). */
export function verifyKorapayWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature) return false;
  const secret = getKorapaySecretKey();
  if (!secret) return false;
  
  // KoraPay signature is HMAC-SHA256 of the data object only
  const hash = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    const expected = Buffer.from(hash, "utf8");
    const provided = Buffer.from(signature, "utf8");
    return timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}

export function amountsMatch(
  expectedNaira: number,
  paidKobo: number,
): boolean {
  const expectedKobo = toKobo(expectedNaira);
  return Math.abs(expectedKobo - paidKobo) < 1; // Allow 1 kobo tolerance
}
