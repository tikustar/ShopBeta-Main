import type { Metadata } from "next";
import { Flame, Percent, Timer, Zap } from "lucide-react";
import { byTag, products } from "@/lib/data";
import { discountPercent, formatPrice } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card, SectionHeading } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Countdown } from "@/components/commerce/countdown";
import { ProductCard } from "@/components/commerce/product-card";
import { ProductMedia } from "@/components/commerce/product-media";

export const metadata: Metadata = {
  title: "Deals",
};

export default function DealsPage() {
  const flash = byTag("flash-sale");
  const offers = byTag("special-offer");
  const discounted = products
    .filter((product) => product.oldPrice)
    .sort(
      (a, b) =>
        discountPercent(b.price, b.oldPrice) - discountPercent(a.price, a.oldPrice),
    );
  const headline = discounted[0];

  return (
    <div className="sb-container">
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Deals" }]}
        title="Deals"
        description="Flash sales, clearance and limited offers — refreshed every morning at 09:00."
      />

      {/* Flash sale banner */}
      <section className="relative overflow-hidden rounded-3xl bg-ink p-7 text-white sm:p-10">
        <span
          className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/30 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-lg">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]">
              <Zap className="h-3 w-3" aria-hidden />
              Flash sale live
            </p>
            <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] sm:text-display-sm">
              Up to 45% off audio, storage &amp; networking
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/65">
              Stock is limited to what is in the Lagos warehouse tonight. When it is gone,
              the price goes back up.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ButtonLink href="/products">Shop the sale</ButtonLink>
              <ButtonLink
                href="/settings"
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                Get early access with Plus
              </ButtonLink>
            </div>
          </div>
          <div className="shrink-0">
            <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/60">
              <Timer className="h-3.5 w-3.5" aria-hidden />
              Ends in
            </p>
            <Countdown tone="dark" />
          </div>
        </div>
      </section>

      {/* Deal of the day */}
      <section className="pt-16 sm:pt-20">
        <SectionHeading
          eyebrow="Deal of the day"
          title="One product, one price, until midnight"
        />
        <Card padded={false} className="overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1fr_1.2fr]">
            <ProductMedia
              icon={headline.icon}
              tone={headline.tone}
              name={headline.name}
              className="aspect-[4/3] w-full rounded-none lg:aspect-auto lg:h-full"
            />
            <div className="p-7 sm:p-10">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="primary">
                  <Flame className="h-3 w-3" aria-hidden />
                  Save {discountPercent(headline.price, headline.oldPrice)}%
                </Badge>
                <Badge tone="outline">{headline.brand}</Badge>
              </div>
              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.025em] text-ink">
                {headline.name}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                {headline.shortDescription}
              </p>
              <div className="mt-6 flex flex-wrap items-end gap-3">
                <span className="text-3xl font-semibold tracking-[-0.03em] text-ink">
                  {formatPrice(headline.price)}
                </span>
                <span className="text-lg text-muted line-through">
                  {formatPrice(headline.oldPrice ?? 0)}
                </span>
              </div>
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-[13px]">
                  <span className="font-medium text-ink">
                    {headline.stock} of 40 left at this price
                  </span>
                  <span className="text-muted">
                    {Math.round((headline.stock / 40) * 100)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-soft">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(headline.stock / 40) * 100}%` }}
                  />
                </div>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <ButtonLink href={`/product/${headline.slug}`} size="lg">
                  View deal
                </ButtonLink>
                <Countdown showLabels={false} />
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Flash sale products */}
      <section className="pt-16 sm:pt-20">
        <SectionHeading
          eyebrow="Ends tonight"
          title="Flash sale products"
          action={<Countdown showLabels={false} />}
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {flash.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Limited offers */}
      <section className="pt-16 sm:pt-20">
        <SectionHeading
          eyebrow="Limited offers"
          title="This week only"
          description="Prices return to normal on Monday at 09:00."
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {offers.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* All discounted */}
      <section className="pt-16 sm:pt-20">
        <SectionHeading
          eyebrow="Clearance"
          title="Everything on discount"
          description={`${discounted.length} products currently below their usual price.`}
          action={
            <Badge tone="outline" className="hidden sm:inline-flex">
              <Percent className="h-3 w-3" aria-hidden />
              Up to 45% off
            </Badge>
          }
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {discounted.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <Pagination current={1} total={5} className="mt-10" />
      </section>
    </div>
  );
}
