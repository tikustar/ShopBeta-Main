/**
 * Client-side payment helpers — call backend routes only (no secrets).
 */

export type InitializePaystackResponse =
  | {
      ok: true;
      authorizationUrl: string;
      reference: string;
      orderId: string;
      orderNumber?: string;
    }
  | { ok: false; reason: string };

export type VerifyPaystackResponse =
  | {
      ok: true;
      alreadyProcessed?: boolean;
      reference: string;
      order: {
        id: string;
        orderNumber?: string;
        paymentStatus?: string;
        orderStatus?: string;
        total?: number;
      };
      payment: {
        reference: string;
        status: string;
        amount: number;
        currency: string;
        channel?: string;
      };
    }
  | {
      ok: false;
      reason: string;
      status?: string;
      orderId?: string;
      reference?: string;
      code?: string;
    };

export type ConfirmCodResponse =
  | {
      ok: true;
      alreadyProcessed?: boolean;
      order: {
        id: string;
        orderNumber?: string;
        paymentStatus?: string;
        orderStatus?: string;
        total?: number;
      };
    }
  | { ok: false; reason: string; code?: string };

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data: T;
  try {
    data = (await response.json()) as T;
  } catch {
    throw new Error("Payment service returned an invalid response.");
  }
  return data;
}

export function initializePaystackPayment(input: {
  orderId: string;
  callbackUrl?: string;
}) {
  return postJson<InitializePaystackResponse>(
    "/api/payments/paystack/initialize",
    input,
  );
}

export function verifyPaystackPayment(reference: string) {
  return postJson<VerifyPaystackResponse>("/api/payments/paystack/verify", {
    reference,
  });
}

export function confirmCashOnDelivery(orderId: string) {
  return postJson<ConfirmCodResponse>("/api/payments/cod/confirm", {
    orderId,
  });
}

export function getPaystackPublicKey() {
  return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim() ?? "";
}

export function isClientPaystackEnabled() {
  return Boolean(getPaystackPublicKey());
}

export function isClientCodEnabled() {
  const raw = process.env.NEXT_PUBLIC_COD_ENABLED ?? "true";
  return raw !== "0" && raw.toLowerCase() !== "false";
}

export function isClientFlutterwaveEnabled() {
  const raw = process.env.NEXT_PUBLIC_FLUTTERWAVE_ENABLED ?? "false";
  return raw === "1" || raw.toLowerCase() === "true";
}
