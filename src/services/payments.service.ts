/**
 * Client-side payment helpers — call backend routes only (no secrets).
 */

export type InitializePaystackResponse =
  | {
      ok: true;
      authorizationUrl: string;
      accessCode?: string | null;
      reference: string;
      orderId: string;
      orderNumber?: string | null;
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

function clientPaymentLog(
  stage: string,
  message: string,
  meta?: Record<string, unknown>,
) {
  // Temporary flow diagnostics (browser console)
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      payment: { at: new Date().toISOString(), stage, message, ...meta },
    }),
  );
}

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

export async function initializePaystackPayment(input: {
  orderId: string;
  callbackUrl?: string;
}): Promise<InitializePaystackResponse> {
  clientPaymentLog("init.request", "Calling /api/payments/paystack/initialize", {
    orderId: input.orderId,
    hasCallback: Boolean(input.callbackUrl),
  });

  const result = await postJson<InitializePaystackResponse>(
    "/api/payments/paystack/initialize",
    input,
  );

  if (result.ok) {
    clientPaymentLog("init.paystack", "Initialize API success", {
      orderId: result.orderId,
      reference: result.reference,
      hasAuthorizationUrl: Boolean(result.authorizationUrl),
      hasAccessCode: Boolean(result.accessCode),
    });
  } else {
    clientPaymentLog("init.failure", "Initialize API rejected", {
      reason: result.reason,
    });
  }

  return result;
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

/**
 * Redirect checkout works without the public key (Inline JS needs it).
 * Disable explicitly with NEXT_PUBLIC_PAYSTACK_ENABLED=false.
 */
export function isClientPaystackEnabled() {
  const flag = process.env.NEXT_PUBLIC_PAYSTACK_ENABLED?.trim().toLowerCase();
  if (flag === "0" || flag === "false") return false;
  if (flag === "1" || flag === "true") return true;
  // Default: enabled when public key is set, or when not explicitly disabled
  // (server / Cloud Function still require PAYSTACK_SECRET_KEY).
  return true;
}

export function isClientCodEnabled() {
  const raw = process.env.NEXT_PUBLIC_COD_ENABLED ?? "true";
  return raw !== "0" && raw.toLowerCase() !== "false";
}

export function isClientFlutterwaveEnabled() {
  const raw = process.env.NEXT_PUBLIC_FLUTTERWAVE_ENABLED ?? "false";
  return raw === "1" || raw.toLowerCase() === "true";
}

export function isClientKorapayEnabled() {
  const raw = process.env.NEXT_PUBLIC_KORAPAY_ENABLED ?? "false";
  return raw === "1" || raw.toLowerCase() === "true";
}

export type InitializeKorapayResponse =
  | {
      ok: true;
      authorizationUrl: string;
      reference: string;
      orderId: string;
      orderNumber?: string | null;
      paymentId?: string;
    }
  | { ok: false; reason: string };

export async function initializeKorapayPayment(input: {
  orderId: string;
  callbackUrl?: string;
}): Promise<InitializeKorapayResponse> {
  clientPaymentLog("init.request", "Calling /api/payments/korapay/initialize", {
    orderId: input.orderId,
    hasCallback: Boolean(input.callbackUrl),
  });

  const result = await postJson<InitializeKorapayResponse>(
    "/api/payments/korapay/initialize",
    input,
  );

  if (result.ok) {
    clientPaymentLog("init.korapay", "Initialize API success", {
      orderId: result.orderId,
      reference: result.reference,
      hasAuthorizationUrl: Boolean(result.authorizationUrl),
    });
  } else {
    clientPaymentLog("init.failure", "Initialize API rejected", {
      reason: result.reason,
    });
  }

  return result;
}

export function verifyKorapayPayment(reference: string) {
  return postJson<VerifyPaystackResponse>("/api/payments/korapay/verify", {
    reference,
  });
}
