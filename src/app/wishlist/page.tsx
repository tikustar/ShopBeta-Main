import type { Metadata } from "next";
import { Share2, ShoppingCart, Trash2 } from "lucide-react";
import { resolve, wishlistSlugs } from "@/lib/data";
import { discountPercent, formatPrice } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { EmptyState } from "@/components/ui/empty-state";
import { EmptyHeartIllustration } from "@/components/ui/illustrations";
import { ProductMedia } from "@/components/commerce/product-media";
import { WishlistButton } from "@/components/commerce/wishlist-button";

export const metadata: Metadata = {
  title: "Wishlist",
};

export default function WishlistPage() {
  const items = resolve(wishlistSlugs);

  return (
    <div className="sb-container">
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Wishlist" }]}
        title="Wishlist"
        description={`${items.length} saved items. We will tell you when any of them drop in price.`}
        action={
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4" aria-hidden />
            Share wishlist
          </Button>
        }
      />

      <div className="space-y-4">
        {items.map((product) => {
          const off = discountPercent(product.price, product.oldPrice);
          return (
            <article
              key={product.id}
              className="group flex flex-col gap-5 rounded-2xl border border-line bg-white p-4 transition-all duration-300 ease-premium hover:border-transparent hover:sb-shadow-soft sm:flex-row sm:items-center"
            >
              <div className="relative shrink-0">
                <ProductMedia
                  icon={product.icon}
                  tone={product.tone}
                  name={product.name}
                  className="h-40 w-full sm:h-28 sm:w-28"
                  iconClassName="group-hover:scale-110"
                />
                {off > 0 ? (
                  <Badge tone="primary" className="absolute left-2 top-2">
                    -{off}%
                  </Badge>
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                  {product.brand}
                </p>
                <h2 className="mt-1.5 text-[16px] font-medium tracking-[-0.01em] text-ink">
                  {product.name}
                </h2>
                <Rating value={product.rating} reviews={product.reviews} className="mt-2" />
                <div className="mt-3 flex items-center gap-2">
                  {product.stock > 5 ? (
                    <Badge tone="success">In stock</Badge>
                  ) : (
                    <Badge tone="warning">Only {product.stock} left</Badge>
                  )}
                  {off > 0 ? (
                    <span className="text-[13px] font-medium text-emerald-600">
                      Price dropped {formatPrice((product.oldPrice ?? 0) - product.price)}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                <div className="text-left sm:text-right">
                  <p className="text-xl font-semibold tracking-[-0.02em] text-ink">
                    {formatPrice(product.price)}
                  </p>
                  {product.oldPrice ? (
                    <p className="text-[13px] text-muted line-through">
                      {formatPrice(product.oldPrice)}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <WishlistButton initial />
                  <button
                    type="button"
                    aria-label={`Remove ${product.name} from wishlist`}
                    className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-muted transition-colors hover:border-primary-200 hover:text-primary"
                  >
                    <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                  </button>
                  <Button size="sm">
                    <ShoppingCart className="h-4 w-4" aria-hidden />
                    Move to cart
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className="pt-16 sm:pt-20">
        <h2 className="mb-4 text-[15px] font-semibold text-ink">
          Empty wishlist state
        </h2>
        <EmptyState
          illustration={<EmptyHeartIllustration />}
          title="Nothing saved yet"
          description="Tap the heart on any product to keep it here and get alerted when the price drops."
          actions={
            <>
              <ButtonLink href="/products">Browse products</ButtonLink>
              <ButtonLink href="/deals" variant="outline">
                See today&apos;s deals
              </ButtonLink>
            </>
          }
        />
      </section>
    </div>
  );
}
