import type { Metadata } from "next";
import { ArrowRight, Calendar, Mail, MapPin, Truck } from "lucide-react";
import { byTag } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SuccessIllustration } from "@/components/ui/illustrations";
import { ProductCard } from "@/components/commerce/product-card";

export const metadata: Metadata = {
  title: "Order confirmed",
};

const facts = [
  { icon: Calendar, label: "Estimated delivery", value: "Thursday, 7 August" },
  { icon: Truck, label: "Shipping method", value: "Express — free" },
  { icon: MapPin, label: "Delivering to", value: "18 Adeola Odeku Street, Lagos" },
  { icon: Mail, label: "Confirmation sent to", value: "amara.bello@example.com" },
];

export default function OrderSuccessPage() {
  const recommended = byTag("best-seller", 4);

  return (
    <div className="sb-container">
      <section className="flex flex-col items-center py-14 text-center sm:py-20">
        <div className="w-56 sm:w-72">
          <SuccessIllustration />
        </div>
        <h1 className="mt-8 text-[30px] font-semibold tracking-[-0.03em] text-ink sm:text-display-sm">
          Thank you — your order is confirmed
        </h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted sm:text-base">
          We are packing it now. You will get a text and an email the moment it leaves the
          warehouse.
        </p>

        <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-2xl border border-line bg-white px-7 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Order number
            </p>
            <p className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">SB-72905</p>
          </div>
          <span className="hidden h-10 w-px bg-line sm:block" aria-hidden />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Total paid
            </p>
            <p className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">
              {formatPrice(2437)}
            </p>
          </div>
          <span className="hidden h-10 w-px bg-line sm:block" aria-hidden />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Arrives
            </p>
            <p className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">7 August</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/track-order" size="lg">
            Track order
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
          <ButtonLink href="/products" variant="outline" size="lg">
            Continue shopping
          </ButtonLink>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <Icon className="h-[18px] w-[18px] text-primary" aria-hidden />
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
              {label}
            </p>
            <p className="mt-1.5 text-[14px] font-medium leading-snug text-ink">{value}</p>
          </Card>
        ))}
      </section>

      <section className="pt-16 sm:pt-20">
        <h2 className="mb-6 text-2xl font-semibold tracking-[-0.025em] text-ink">
          Recommended for you
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {recommended.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
