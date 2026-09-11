"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { getOrderByNumber } from "@/services/orders.service";
import { 
  initializePaystackPayment, 
  initializeKorapayPayment,
  getPaymentProviderSettings
} from "@/services/payments.service";
import { toastError, toastSuccess } from "@/stores/toast.store";
import type { Order } from "@/types/order";
import { formatPrice } from "@/lib/utils";

function PaymentRetryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderParam = searchParams.get("order") || "";
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [providers, setProviders] = useState<{
    paystack: boolean;
    korapay: boolean;
    flutterwave: boolean;
    cod: boolean;
  } | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!orderParam) {
        setError("Missing order reference.");
        setLoading(false);
        return;
      }
      try {
        const found = await getOrderByNumber(orderParam);
        if (!active) return;
        if (!found) {
          setError("We could not find that order.");
          setLoading(false);
          return;
        }
        if (found.paymentStatus === "paid") {
          router.replace(
            `/order-success?order=${encodeURIComponent(found.orderNumber ?? found.id)}`,
          );
          return;
        }
        setOrder(found);
        
        // Load payment providers and auto-select first available
        if (!selectedProvider) {
          const settings = await getPaymentProviderSettings();
          setProviders(settings);
          
          if (settings.paystack) {
            setSelectedProvider("paystack");
          } else if (settings.korapay) {
            setSelectedProvider("korapay");
          } else if (settings.flutterwave) {
            setSelectedProvider("flutterwave");
          } else if (settings.cod) {
            setSelectedProvider("cash-on-delivery");
          }
        }
      } catch {
        if (active) setError("Could not load this order.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [orderParam, router, selectedProvider]);

  const onRetry = async () => {
    if (!order || !selectedProvider) return;
    setSubmitting(true);
    setError(null);
    try {
      const callbackUrl = `${window.location.origin}/payments/callback?order=${encodeURIComponent(order.orderNumber ?? order.id)}`;
      let init;
      
      if (selectedProvider === "paystack") {
        init = await initializePaystackPayment({
          orderId: order.id,
          callbackUrl,
        });
      } else if (selectedProvider === "korapay") {
        init = await initializeKorapayPayment({
          orderId: order.id,
          callbackUrl,
        });
      } else {
        setError("Selected payment method is not available.");
        setSubmitting(false);
        return;
      }
      
      if (!init.ok) {
        setError(init.reason);
        toastError("Could not start payment", init.reason);
        return;
      }
      
      const providerName = selectedProvider === "paystack" ? "Paystack" : 
                          selectedProvider === "korapay" ? "KoraPay" : 
                          selectedProvider === "flutterwave" ? "Flutterwave" : "payment";
      toastSuccess(`Redirecting to ${providerName}`);
      window.location.href = init.authorizationUrl;
    } catch {
      setError("Network error while starting payment.");
      toastError("Payment failed", "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sb-container">
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Checkout", href: "/checkout" },
          { label: "Retry payment" },
        ]}
        title="Retry payment"
        description="Complete Paystack checkout for your pending order. Stock is only reduced after successful payment."
      />

      <Card className="mx-auto max-w-lg">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading order…
          </div>
        ) : error && !order ? (
          <div className="space-y-4 text-center">
            <p className="text-[14px] text-primary" role="alert">
              {error}
            </p>
            <ButtonLink href="/checkout">Go to checkout</ButtonLink>
          </div>
        ) : order ? (
          <div className="space-y-5">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">
                Pending order
              </p>
              <p className="mt-1 text-lg font-semibold text-ink">
                {order.orderNumber ?? order.id}
              </p>
              <p className="mt-1 text-[14px] text-muted">
                Total{" "}
                <span className="font-semibold text-ink">
                  {formatPrice(Number(order.total ?? 0))}
                </span>
              </p>
              <p className="mt-1 text-[13px] text-muted">
                Payment status: {order.paymentStatus ?? "pending"}
              </p>
            </div>
            {error ? (
              <p className="text-[13px] text-primary" role="alert">
                {error}
              </p>
            ) : null}
            {providers && (
              <div className="space-y-3">
                <p className="text-[13px] font-medium text-ink">Payment method</p>
                <div className="space-y-2">
                  {providers.paystack && (
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="provider"
                        value="paystack"
                        checked={selectedProvider === "paystack"}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="h-4 w-4 text-primary"
                      />
                      <span className="text-[13px]">Paystack</span>
                    </label>
                  )}
                  {providers.korapay && (
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="provider"
                        value="korapay"
                        checked={selectedProvider === "korapay"}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="h-4 w-4 text-primary"
                      />
                      <span className="text-[13px]">KoraPay</span>
                    </label>
                  )}
                  {providers.flutterwave && (
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="provider"
                        value="flutterwave"
                        checked={selectedProvider === "flutterwave"}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="h-4 w-4 text-primary"
                      />
                      <span className="text-[13px]">Flutterwave</span>
                    </label>
                  )}
                  {providers.cod && (
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="provider"
                        value="cash-on-delivery"
                        checked={selectedProvider === "cash-on-delivery"}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="h-4 w-4 text-primary"
                      />
                      <span className="text-[13px]">Cash on delivery</span>
                    </label>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                size="lg"
                disabled={submitting || !selectedProvider}
                onClick={onRetry}
              >
                <RefreshCw className="h-4 w-4" aria-hidden />
                {submitting 
                  ? "Starting payment…" 
                  : selectedProvider === "paystack"
                    ? "Pay with Paystack"
                    : selectedProvider === "korapay"
                      ? "Pay with KoraPay"
                      : selectedProvider === "flutterwave"
                        ? "Pay with Flutterwave"
                        : "Place order"}
              </Button>
              <ButtonLink href="/cart" variant="outline" size="lg">
                View cart
              </ButtonLink>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

export default function PaymentRetryPage() {
  return (
    <Suspense fallback={null}>
      <PaymentRetryContent />
    </Suspense>
  );
}
