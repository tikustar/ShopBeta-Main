"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const order = searchParams.get("order") || "";
  const reference = searchParams.get("reference") || "";
  const reason =
    searchParams.get("reason") ||
    "We could not confirm this payment. Your cart was not cleared.";

  const retryHref = order
    ? `/payments/retry?order=${encodeURIComponent(order)}`
    : "/checkout";

  return (
    <div className="sb-container">
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Checkout", href: "/checkout" },
          { label: "Payment failed" },
        ]}
        title="Payment failed"
        description="No charge was completed for this attempt, or verification did not succeed."
      />
      <Card className="mx-auto max-w-lg text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-50 text-primary">
          <AlertTriangle className="h-7 w-7" aria-hidden />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-ink">
          We couldn&apos;t complete payment
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">{reason}</p>
        {order ? (
          <p className="mt-3 text-[13px] text-muted">
            Order <span className="font-medium text-ink">{order}</span> is still
            pending — you can retry without losing your cart items.
          </p>
        ) : null}
        {reference ? (
          <p className="mt-1 text-[12px] text-muted">Reference: {reference}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href={retryHref} size="lg">
            Retry payment
          </ButtonLink>
          <ButtonLink href="/checkout" variant="outline" size="lg">
            Back to checkout
          </ButtonLink>
          <ButtonLink href="/cart" variant="ghost" size="lg">
            View cart
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={null}>
      <PaymentFailedContent />
    </Suspense>
  );
}
