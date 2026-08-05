import Link from "next/link";
import { Bookmark, Trash2 } from "lucide-react";
import type { Product } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { ProductMedia } from "@/components/commerce/product-media";

export function CartItem({
  product,
  qty,
}: {
  product: Product;
  qty: number;
}) {
  return (
    <article className="flex gap-4 py-5 first:pt-0 last:pb-0">
      <Link href={`/product/${product.slug}`} className="shrink-0">
        <ProductMedia
          icon={product.icon}
          tone={product.tone}
          name={product.name}
          className="h-24 w-24 sm:h-28 sm:w-28"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
              {product.brand}
            </p>
            <h3 className="mt-1 text-[15px] font-medium leading-snug tracking-[-0.01em] text-ink">
              <Link href={`/product/${product.slug}`} className="hover:text-primary">
                {product.name}
              </Link>
            </h3>
            <p className="mt-1.5 text-[13px] text-muted">
              {product.colors[0]} · {product.subcategory}
            </p>
            <div className="mt-2">
              {product.stock > 5 ? (
                <Badge tone="success">In stock</Badge>
              ) : (
                <Badge tone="warning">Only {product.stock} left</Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[17px] font-semibold tracking-[-0.02em] text-ink">
              {formatPrice(product.price * qty)}
            </p>
            {product.oldPrice ? (
              <p className="text-[13px] text-muted line-through">
                {formatPrice(product.oldPrice * qty)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <QuantitySelector initial={qty} size="sm" max={product.stock} />
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-ink-soft transition-colors hover:bg-soft"
          >
            <Bookmark className="h-4 w-4" aria-hidden />
            Save for later
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-muted transition-colors hover:bg-primary-50 hover:text-primary"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
