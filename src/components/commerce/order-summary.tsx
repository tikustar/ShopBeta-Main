import { Tag } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function OrderSummary({
  subtotal,
  shipping = 0,
  discount = 120,
  taxRate = 0.075,
  withCoupon = false,
  title = "Order summary",
  footer,
}: {
  subtotal: number;
  shipping?: number;
  discount?: number;
  taxRate?: number;
  withCoupon?: boolean;
  title?: string;
  footer?: React.ReactNode;
}) {
  const taxes = Math.round((subtotal - discount) * taxRate);
  const total = subtotal - discount + shipping + taxes;

  return (
    <Card>
      <h2 className="text-[15px] font-semibold text-ink">{title}</h2>

      {withCoupon ? (
        <form className="mt-5 flex gap-2">
          <label className="sr-only" htmlFor="coupon">
            Coupon code
          </label>
          <div className="relative flex-1">
            <Tag
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              id="coupon"
              placeholder="Coupon code"
              defaultValue="BETA10"
              className="h-11 w-full rounded-xl border border-line pl-10 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
          <button
            type="button"
            className="h-11 shrink-0 rounded-xl bg-ink px-4 text-[13px] font-medium text-white transition-colors hover:bg-primary"
          >
            Apply
          </button>
        </form>
      ) : null}

      <dl className="mt-5 space-y-3 border-t border-line pt-5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd className="font-medium text-ink">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted">Discount (BETA10)</dt>
          <dd className="font-medium text-emerald-600">−{formatPrice(discount)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted">Delivery fee</dt>
          <dd className="font-medium text-ink">
            {shipping === 0 ? (
              <span className="text-emerald-600">Free</span>
            ) : (
              formatPrice(shipping)
            )}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted">Estimated taxes</dt>
          <dd className="font-medium text-ink">{formatPrice(taxes)}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-4">
          <dt className="text-[15px] font-semibold text-ink">Grand total</dt>
          <dd className="text-2xl font-semibold tracking-[-0.02em] text-ink">
            {formatPrice(total)}
          </dd>
        </div>
      </dl>

      {footer ? <div className="mt-6">{footer}</div> : null}
    </Card>
  );
}
