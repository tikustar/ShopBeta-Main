import type { Metadata } from "next";
import { Check, Copy, Headphones, MapPin, Package, Phone, Truck } from "lucide-react";
import { orderTimeline, orders } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { MapPlaceholder } from "@/components/ui/illustrations";
import { ProductMedia } from "@/components/commerce/product-media";

export const metadata: Metadata = {
  title: "Track order",
};

export default function TrackOrderPage() {
  const order = orders[0];

  return (
    <div className="sb-container">
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Track order" }]}
        title="Track your order"
        description="Enter an order number to see live progress, or pick an order from your history."
      />

      <Card className="mb-8">
        <form className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Order number, e.g. SB-72841"
              defaultValue="SB-72841"
              aria-label="Order number"
              icon={<Package className="h-[18px] w-[18px]" />}
            />
          </div>
          <div className="flex-1">
            <Input placeholder="Email or phone on the order" aria-label="Email or phone" />
          </div>
          <Button size="lg" className="sm:w-auto">
            Track
          </Button>
        </form>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                  Order {order.id}
                </p>
                <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.02em] text-ink">
                  Out for delivery
                </h2>
                <p className="mt-1 text-[13px] text-muted">{order.delivery}</p>
              </div>
              <Badge tone="info">
                <Truck className="h-3 w-3" aria-hidden />
                In transit
              </Badge>
            </div>

            <ol className="mt-7">
              {orderTimeline.map((step, index) => {
                const isLast = index === orderTimeline.length - 1;
                return (
                  <li key={step.label} className="relative flex gap-4 pb-8 last:pb-0">
                    {!isLast ? (
                      <span
                        className={
                          step.state === "done"
                            ? "absolute left-[15px] top-8 h-full w-0.5 bg-primary"
                            : "absolute left-[15px] top-8 h-full w-0.5 bg-line"
                        }
                        aria-hidden
                      />
                    ) : null}
                    <span
                      className={
                        step.state === "done"
                          ? "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-white"
                          : step.state === "current"
                            ? "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-primary bg-white"
                            : "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-white"
                      }
                    >
                      {step.state === "done" ? (
                        <Check className="h-4 w-4" aria-hidden />
                      ) : step.state === "current" ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden />
                      ) : (
                        <span className="h-2.5 w-2.5 rounded-full bg-line" aria-hidden />
                      )}
                    </span>
                    <div className="min-w-0 pt-1">
                      <p
                        className={
                          step.state === "upcoming"
                            ? "text-[15px] font-medium text-muted"
                            : "text-[15px] font-medium text-ink"
                        }
                      >
                        {step.label}
                      </p>
                      <p className="mt-1 text-[13px] text-muted">{step.description}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>

          <Card padded={false}>
            <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
              <h2 className="text-[15px] font-semibold text-ink">Live location</h2>
              <p className="text-[13px] text-muted">Updated 2 minutes ago</p>
            </div>
            <div className="p-5 sm:p-6">
              <MapPlaceholder className="aspect-[16/8]" />
              <p className="mt-4 flex items-center gap-2 text-[13px] text-muted">
                <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                4.2 km away · 3 stops before yours
              </p>
            </div>
          </Card>

          <Card padded={false}>
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <h2 className="text-[15px] font-semibold text-ink">Order details</h2>
            </div>
            <ul className="divide-y divide-line px-5 sm:px-6">
              {order.items.map((item) => (
                <li key={item.slug} className="flex items-center gap-4 py-4">
                  <ProductMedia
                    icon={item.icon}
                    tone="bg-soft"
                    name={item.name}
                    className="h-16 w-16 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                    <p className="mt-1 text-[13px] text-muted">Qty {item.qty}</p>
                  </div>
                  <p className="text-sm font-semibold text-ink">{formatPrice(item.price)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-3 border-t border-line px-5 py-5 text-sm sm:px-6">
              <div className="flex justify-between">
                <dt className="text-muted">Placed on</dt>
                <dd className="text-ink">{order.placedOn}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Payment</dt>
                <dd className="text-ink">{order.payment}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Order total</dt>
                <dd className="font-semibold text-ink">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <Card>
            <h2 className="text-[15px] font-semibold text-ink">Delivery address</h2>
            <p className="mt-4 text-[14px] leading-relaxed text-muted">
              <span className="block font-medium text-ink">Amara Bello</span>
              {order.address}
              <span className="mt-2 block">+234 801 234 5678</span>
            </p>
            <Button variant="outline" size="sm" className="mt-5">
              Change address
            </Button>
          </Card>

          <Card>
            <h2 className="text-[15px] font-semibold text-ink">Courier information</h2>
            <div className="mt-4 flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-soft text-[12px] font-semibold text-ink">
                MI
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">Musa Ibrahim</p>
                <p className="text-[13px] text-muted">ShopBeta Express · Van LG-441-KJA</p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between rounded-xl border border-line px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.1em] text-muted">Tracking</p>
                <p className="truncate text-[13px] font-medium text-ink">{order.tracking}</p>
              </div>
              <button
                type="button"
                aria-label="Copy tracking number"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-soft hover:text-ink"
              >
                <Copy className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="mt-4 grid gap-2">
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4" aria-hidden />
                Call rider
              </Button>
              <ButtonLink href="/help" variant="ghost" size="sm">
                <Headphones className="h-4 w-4" aria-hidden />
                Get help with this order
              </ButtonLink>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
