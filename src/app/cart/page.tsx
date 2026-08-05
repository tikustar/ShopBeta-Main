import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Tag, Truck } from "lucide-react";
import { cartLines, resolve, savedForLater } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { CartItem } from "@/components/commerce/cart-item";
import { ProductCard } from "@/components/commerce/product-card";
import { OrderSummary } from "@/components/commerce/order-summary";

export const metadata: Metadata = {
  title: "Shopping cart",
};

export default function CartPage() {
  const lines = cartLines
    .map(({ slug, qty }) => ({ product: resolve([slug])[0], qty }))
    .filter((line) => Boolean(line.product));
  const saved = resolve(savedForLater);

  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);

  return (
    <div className="sb-container">
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Cart" }]}
        title="Shopping cart"
        description={`${lines.length} items ready to check out. Delivery and taxes are calculated at the next step.`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
        <div className="space-y-6">
          <Alert tone="success" title="You qualify for free next-day delivery">
            Orders over $99 ship free. Your order is $
            {(subtotal - 99).toLocaleString()} above the threshold.
          </Alert>

          <Card padded={false}>
            <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
              <h2 className="text-[15px] font-semibold text-ink">
                Cart ({lines.length})
              </h2>
              <button
                type="button"
                className="text-[13px] font-medium text-muted transition-colors hover:text-primary"
              >
                Clear cart
              </button>
            </div>
            <div className="divide-y divide-line px-5 sm:px-6">
              {lines.map((line) => (
                <CartItem key={line.product.id} product={line.product} qty={line.qty} />
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-4 sm:px-6">
              <ButtonLink href="/products" variant="ghost" size="sm">
                ← Continue shopping
              </ButtonLink>
              <p className="text-[13px] text-muted">
                Subtotal{" "}
                <span className="font-semibold text-ink">{formatPrice(subtotal)}</span>
              </p>
            </div>
          </Card>

          <Card padded={false}>
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <h2 className="text-[15px] font-semibold text-ink">
                Saved for later ({saved.length})
              </h2>
              <p className="mt-1 text-[13px] text-muted">
                Items stay here until you move them back to the cart.
              </p>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              {saved.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-line p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{product.name}</p>
                    <p className="mt-1 text-[13px] text-muted">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-9 shrink-0 items-center rounded-full bg-ink px-4 text-[13px] font-medium text-white transition-colors hover:bg-primary"
                  >
                    Move to cart
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <OrderSummary
            subtotal={subtotal}
            withCoupon
            footer={
              <>
                <ButtonLink href="/checkout" size="lg" className="w-full">
                  Proceed to checkout
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </ButtonLink>
                <ul className="mt-5 space-y-2.5 text-[13px] text-muted">
                  <li className="flex items-center gap-2">
                    <Truck className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                    Free next-day delivery on this order
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                    2 year cover included on all items
                  </li>
                  <li className="flex items-center gap-2">
                    <Tag className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                    Price match within 7 days of ordering
                  </li>
                </ul>
              </>
            }
          />

          <Card className="bg-soft/60">
            <p className="text-[13px] leading-relaxed text-muted">
              Need this on a company account?{" "}
              <Link href="/help" className="font-medium text-primary hover:underline">
                Talk to our business team
              </Link>{" "}
              about invoicing and bulk pricing.
            </p>
          </Card>
        </div>
      </div>

      <section className="pt-16 sm:pt-20">
        <h2 className="mb-6 text-2xl font-semibold tracking-[-0.025em] text-ink">
          Frequently bought together
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {resolve([
            "logitech-mx-master-4s-mouse",
            "anker-prime-250w-charging-base",
            "dell-ultrasharp-32-4k-monitor",
            "keychron-q3-max-mechanical-keyboard",
          ]).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
