import { CURRENCY } from "@/constants/app";

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function getPaystackSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }
  return key;
}

export function getPaystackPublicKey() {
  return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim() ?? "";
}

export function getPaystackWebhookSecret() {
  return (
    process.env.PAYSTACK_WEBHOOK_SECRET?.trim() ||
    process.env.PAYSTACK_SECRET_KEY?.trim() ||
    ""
  );
}

export function getMakeWebhookUrl() {
  return (
    process.env.MAKE_WEBHOOK_URL?.trim() ||
    process.env.MAKE_COM_WEBHOOK_URL?.trim() ||
    ""
  );
}

export function isCodEnabled() {
  const raw = process.env.NEXT_PUBLIC_COD_ENABLED ?? "true";
  return raw !== "0" && raw.toLowerCase() !== "false";
}

export function isFlutterwaveEnabled() {
  const raw = process.env.NEXT_PUBLIC_FLUTTERWAVE_ENABLED ?? "false";
  return raw === "1" || raw.toLowerCase() === "true";
}

export function isPaystackConfigured() {
  return Boolean(
    process.env.PAYSTACK_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim(),
  );
}

export function defaultCurrency() {
  return process.env.NEXT_PUBLIC_CURRENCY?.trim() || CURRENCY.code;
}

/** Convert Naira major units to Paystack kobo. */
export function toKobo(amountNaira: number) {
  return Math.round(amountNaira * 100);
}

export function fromKobo(amountKobo: number) {
  return amountKobo / 100;
}
