import { reportEvent } from "@/lib/monitoring";

/** Structured payment / webhook logging for production diagnosis. */
export function paymentLog(
  stage:
    | "webhook.incoming"
    | "webhook.signature"
    | "webhook.event"
    | "webhook.verify"
    | "webhook.firestore"
    | "webhook.make"
    | "webhook.success"
    | "webhook.failure"
    | "webhook.ignored",
  message: string,
  meta?: Record<string, unknown>,
) {
  const level =
    stage === "webhook.failure" || stage === "webhook.signature"
      ? "error"
      : stage === "webhook.ignored"
        ? "warning"
        : "info";

  reportEvent({
    level,
    source: "payment",
    message: `[${stage}] ${message}`,
    code: stage,
    meta,
  });

  if (process.env.NODE_ENV !== "test") {
    const line = {
      at: new Date().toISOString(),
      stage,
      message,
      ...meta,
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ payment: line }));
  }
}
