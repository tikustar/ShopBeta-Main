"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { verifyPaystackPayment } from "@/services/payments.service";
import {
  getOrderByNumber,
  watchOrderUntilPaid,
} from "@/services/orders.service";
import { useCartStore } from "@/stores/cart.store";
import { useCheckoutStore } from "@/stores/checkout.store";
import { toastError, toastSuccess } from "@/stores/toast.store";

function clientLog(stage: string, message: string, meta?: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      payment: { at: new Date().toISOString(), stage, message, ...meta },
    }),
  );
}

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clearCart = useCartStore((state) => state.clear);
  const setLastOrder = useCheckoutStore((state) => state.setLastOrder);
  const [message, setMessage] = useState("Confirming your payment…");

  useEffect(() => {
    const cancelled = searchParams.get("cancelled");
    const reference =
      searchParams.get("reference") || searchParams.get("trxref") || "";
    const orderParam = searchParams.get("order") || "";

    clientLog("callback.start", "Payment callback loaded", {
      orderParam,
      hasReference: Boolean(reference),
      cancelled,
    });

    if (cancelled === "1") {
      const query = new URLSearchParams();
      if (orderParam) query.set("order", orderParam);
      if (reference) query.set("reference", reference);
      router.replace(`/payments/cancelled?${query.toString()}`);
      return;
    }

    let active = true;

    const goSuccess = async (orderNumber: string) => {
      if (!active) return;
      clearCart();
      const fullOrder = await getOrderByNumber(orderNumber).catch(() => undefined);
      if (fullOrder) setLastOrder(fullOrder);
      clientLog("callback.success", "Navigating to order success", {
        orderNumber,
      });
      toastSuccess("Payment successful", `Order ${orderNumber}`);
      router.replace(
        `/order-success?order=${encodeURIComponent(orderNumber)}`,
      );
    };

    const goFailed = (reason: string) => {
      if (!active) return;
      clientLog("callback.failure", reason, { orderParam, reference });
      toastError("Payment not confirmed", reason);
      const query = new URLSearchParams();
      if (orderParam) query.set("order", orderParam);
      if (reference) query.set("reference", reference);
      query.set("reason", reason);
      router.replace(`/payments/failed?${query.toString()}`);
    };

    void (async () => {
      // 1) Best-effort server verify (needs Firebase Admin on the Next server).
      if (reference) {
        setMessage("Verifying payment with Paystack…");
        try {
          clientLog("callback.verify", "Calling verify API", { reference });
          const result = await verifyPaystackPayment(reference);
          if (!active) return;
          if (result.ok) {
            const orderNumber =
              result.order.orderNumber || orderParam || result.order.id;
            await goSuccess(orderNumber);
            return;
          }
          clientLog("callback.verify", "Verify API did not confirm yet", {
            reason: result.reason,
          });
        } catch (error) {
          clientLog("callback.verify", "Verify API unavailable — watching Firestore", {
            message: error instanceof Error ? error.message : "unknown",
          });
        }
      } else if (!orderParam) {
        goFailed("Missing payment reference.");
        return;
      }

      // 2) Firestore listener / poll — webhook CF marks the order paid.
      if (!orderParam && !reference) {
        goFailed("Missing payment reference.");
        return;
      }

      setMessage("Waiting for payment confirmation…");
      clientLog("callback.listener", "Watching order for paymentStatus=paid", {
        orderParam,
        reference,
      });

      const paidOrder = await watchOrderUntilPaid(orderParam || reference, {
        timeoutMs: 120_000,
        onUpdate: (order) => {
          if (!active) return;
          setMessage(
            order.paymentStatus === "paid"
              ? "Payment confirmed — redirecting…"
              : `Status: ${order.paymentStatus ?? "pending"}…`,
          );
        },
      });

      if (!active) return;

      if (paidOrder?.paymentStatus === "paid") {
        await goSuccess(paidOrder.orderNumber ?? paidOrder.id);
        return;
      }

      // 3) One more verify attempt if we have a reference.
      if (reference) {
        try {
          const result = await verifyPaystackPayment(reference);
          if (!active) return;
          if (result.ok) {
            await goSuccess(
              result.order.orderNumber || orderParam || result.order.id,
            );
            return;
          }
        } catch {
          /* ignore */
        }
      }

      goFailed(
        "Payment is still pending. If you were charged, wait a moment and open Track order, or retry payment.",
      );
    })();

    return () => {
      active = false;
    };
  }, [clearCart, router, searchParams, setLastOrder]);

  return (
    <div className="sb-container">
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Checkout", href: "/checkout" },
          { label: "Payment" },
        ]}
        title="Processing payment"
        description="Please wait while we confirm your Paystack payment."
      />
      <Card className="mx-auto flex max-w-lg flex-col items-center gap-4 py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-[15px] text-ink">{message}</p>
        <p className="text-[13px] text-muted">
          Do not close this window. You will be redirected automatically when
          payment is confirmed.
        </p>
      </Card>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="sb-container py-16 text-center text-sm text-muted">
          Loading…
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
