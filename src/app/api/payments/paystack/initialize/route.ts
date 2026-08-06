import { NextResponse } from "next/server";
import { initializePaystackBodySchema } from "@/schemas/payment.schema";
import { initializePaystackForOrder } from "@/lib/server/payment-service";
import { reportPaymentFailure } from "@/lib/monitoring";
import {
  clientKeyFromRequest,
  publicErrorMessage,
  rateLimit,
} from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = rateLimit({
    key: clientKeyFromRequest(request, "paystack-init"),
    limit: 20,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, reason: "Too many requests. Try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limited.retryAfterMs / 1000) || 1),
        },
      },
    );
  }

  try {
    const json = await request.json();
    const parsed = initializePaystackBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, reason: "Invalid request body." },
        { status: 400 },
      );
    }

    const result = await initializePaystackForOrder({
      orderId: parsed.data.orderId,
      callbackUrl: parsed.data.callbackUrl,
    });

    if (!result.ok) {
      reportPaymentFailure("Paystack initialize rejected", {
        orderId: parsed.data.orderId,
        reason: result.reason,
      });
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      authorizationUrl: result.authorizationUrl,
      reference: result.reference,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
    });
  } catch (error) {
    reportPaymentFailure("Paystack initialize failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      {
        ok: false,
        reason: publicErrorMessage(error, "Could not initialize payment."),
      },
      { status: 500 },
    );
  }
}
