"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Calendar, Mail, MapPin, Truck } from "lucide-react";
import {
  LAST_ORDER_KEY,
  estimatedDeliveryLabel,
  readJsonStorage,
} from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SuccessIllustration } from "@/components/ui/illustrations";
import { getOrderByNumber } from "@/services/orders.service";
import { useCheckoutStore } from "@/stores/checkout.store";
import type { Order } from "@/types/order";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderParam = searchParams.get("order") ?? "";
  const lastOrder = useCheckoutStore((state) => state.lastOrder);
  const [order, setOrder] = useState<Order | null>(lastOrder);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const cached =
          lastOrder ?? readJsonStorage<Order | null>(LAST_ORDER_KEY, null);
        if (orderParam) {
          const remote = await getOrderByNumber(orderParam);
          if (!cancelled) {
            setOrder(remote ?? cached);
            if (!remote && !cached) {
              setError("We could not find that order.");
            }
          }
        } else if (!cancelled) {
          setOrder(cached);
          if (!cached) setError("No recent order to show.");
        }
      } catch {
        if (!cancelled) {
          const cached = readJsonStorage<Order | null>(LAST_ORDER_KEY, null);
          setOrder(cached);
          if (!cached) setError("Could not load order details.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [orderParam, lastOrder]);

  const facts = useMemo(() => {
    if (!order) return [];
    const address = order.shippingAddress;
    const addressLine = address
      ? [address.line1, address.city, address.country].filter(Boolean).join(", ")
      : "—";
    return [
      {
        icon: Calendar,
        label: "Estimated delivery",
        value: estimatedDeliveryLabel("express"),
      },
      {
        icon: Truck,
        label: "Order status",
        value: order.orderStatus ?? order.status ?? "pending",
      },
      {
        icon: MapPin,
        label: "Delivering to",
        value: addressLine,
      },
      {
        icon: Mail,
        label: "Confirmation sent to",
        value: order.customer?.email ?? "—",
      },
    ];
  }, [order]);

  const items = order?.products ?? order?.items ?? [];
  const orderNumber = order?.orderNumber ?? order?.id ?? "—";
  const total = order?.total ?? 0;

  return (
    <div className="sb-container">
      <section className="flex flex-col items-center py-14 text-center sm:py-20">
        <div className="w-56 sm:w-72">
          <SuccessIllustration />
        </div>
        <h1 className="mt-8 text-[30px] font-semibold tracking-[-0.03em] text-ink sm:text-display-sm">
          {error ? "Order status" : "Thank you — your order is confirmed"}
        </h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted sm:text-base">
          {loading
            ? "Loading your order…"
            : (error ??
              "We are packing it now. You will get a confirmation as soon as it leaves the warehouse.")}
        </p>

        {!loading && order ? (
          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-2xl border border-line bg-white px-7 py-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                Order number
              </p>
              <p className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">
                {orderNumber}
              </p>
            </div>
            <span className="hidden h-10 w-px bg-line sm:block" aria-hidden />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                Total
              </p>
              <p className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">
                {formatPrice(total)}
              </p>
            </div>
            <span className="hidden h-10 w-px bg-line sm:block" aria-hidden />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                Items
              </p>
              <p className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">
                {items.length}
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink
            href={
              orderNumber && orderNumber !== "—"
                ? `/track-order?order=${encodeURIComponent(orderNumber)}`
                : "/track-order"
            }
            size="lg"
          >
            Track order
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
          <ButtonLink href="/products" variant="outline" size="lg">
            Continue shopping
          </ButtonLink>
        </div>
      </section>

      {order ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map(({ icon: Icon, label, value }) => (
              <Card key={label}>
                <Icon className="h-[18px] w-[18px] text-primary" aria-hidden />
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                  {label}
                </p>
                <p className="mt-1.5 text-[14px] font-medium leading-snug text-ink">
                  {value}
                </p>
              </Card>
            ))}
          </section>

          <section className="pt-10">
            <Card padded={false}>
              <div className="border-b border-line px-5 py-4 sm:px-6">
                <h2 className="text-[15px] font-semibold text-ink">
                  Purchased items
                </h2>
              </div>
              <ul className="divide-y divide-line px-5 sm:px-6">
                {items.map((item) => (
                  <li
                    key={`${item.productId}-${item.variation ?? ""}`}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {item.name ?? item.productId}
                      </p>
                      <p className="mt-1 text-[13px] text-muted">
                        Qty {item.quantity}
                        {item.variation ? ` · ${item.variation}` : ""}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-ink">
                      {formatPrice(
                        item.lineTotal ??
                          (item.unitPrice ?? 0) * item.quantity,
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        </>
      ) : null}
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="sb-container py-16 text-center text-sm text-muted">
          Loading order…
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
