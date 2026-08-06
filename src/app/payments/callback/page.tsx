"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { verifyPaystackPayment } from "@/services/payments.service";
import { useCartStore } from "@/stores/cart.store";
import { useCheckoutStore } from "@/stores/checkout.store";
import { toastError, toastSuccess } from "@/stores/toast.store";
import { getOrderByNumber } from "@/services/orders.service";

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

    if (cancelled === "1") {
      const query = new URLSearchParams();
      if (orderParam) query.set("order", orderParam);
      if (reference) query.set("reference", reference);
      router.replace(`/payments/cancelled?${query.toString()}`);
      return;
    }

    if (!reference) {
      setMessage("Missing payment reference.");
      router.replace(
        `/payments/failed?order=${encodeURIComponent(orderParam)}&reason=${encodeURIComponent("Missing payment reference")}`,
      );
      return;
    }

    let active = true;
    void (async () => {
      try {
        const result = await verifyPaystackPayment(reference);
        if (!active) return;

        if (!result.ok) {
          toastError("Payment not confirmed", result.reason);
          const query = new URLSearchParams();
          if (orderParam || result.orderId) {
            query.set("order", orderParam || result.orderId || "");
          }
          query.set("reference", reference);
          query.set("reason", result.reason);
          router.replace(`/payments/failed?${query.toString()}`);
          return;
        }

        clearCart();
        const orderNumber =
          result.order.orderNumber || orderParam || result.order.id;
        const fullOrder = await getOrderByNumber(orderNumber).catch(
          () => undefined,
        );
        if (fullOrder) setLastOrder(fullOrder);

        toastSuccess(
          result.alreadyProcessed ? "Payment already confirmed" : "Payment successful",
          `Order ${orderNumber}`,
        );
        router.replace(
          `/order-success?order=${encodeURIComponent(orderNumber)}`,
        );
      } catch (error) {
        if (!active) return;
        const reason =
          error instanceof Error
            ? error.message
            : "Could not verify payment.";
        toastError("Payment verification failed", reason);
        router.replace(
          `/payments/failed?order=${encodeURIComponent(orderParam)}&reference=${encodeURIComponent(reference)}&reason=${encodeURIComponent(reason)}`,
        );
      }
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
          Do not close this window. You will be redirected automatically.
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
