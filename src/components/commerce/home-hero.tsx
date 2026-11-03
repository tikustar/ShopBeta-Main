import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CreditCard, ShieldCheck, Truck } from "lucide-react";
import type { Product } from "@/lib/data";
import { discountPercent, formatPrice } from "@/lib/utils";
import { APP_TAGLINE, isOptimizableImage } from "@/constants/app";
import { ButtonLink } from "@/components/ui/button";
import { ProductIcon } from "@/components/commerce/product-media";

const assurances = [
  { icon: CreditCard, label: "Card, transfer, USSD or POD" },
  { icon: Truck, label: "1–2 day Lagos & Abuja delivery" },
  { icon: ShieldCheck, label: "Buyer protection" },
];

function stockLabel(stock: number) {
  return stock <= 5 ? `Only ${stock} left in stock` : "In stock — ready to ship";
}

/** Product-led campaign banner. Every value shown comes from the live product record. */
export function HomeHero({ product }: { product: Product }) {
  const href = `/product/${product.slug}`;
  const image = product.thumbnail ?? product.images?.[0];
  const off = discountPercent(product.price, product.oldPrice);

  return (
    <section
      aria-labelledby="home-hero-product"
      className="relative overflow-hidden rounded-[28px] bg-primary-800 text-white"
    >
      <div className="grid lg:grid-cols-[1.05fr_1fr]">
        <div className="relative z-10 flex flex-col justify-center p-6 sm:p-10 lg:py-12 lg:pl-12 lg:pr-6">
          <h1 className="text-[13px] font-medium text-white/65">{APP_TAGLINE}</h1>
          <p className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent ring-1 ring-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            Featured Hug Pick
          </p>
          <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/55">
            {product.brand}
          </p>
          <h2
            id="home-hero-product"
            className="mt-2 max-w-xl text-[28px] font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-[38px] lg:text-[40px]"
          >
            <Link href={href} className="transition-colors hover:text-accent-100">
              {product.name}
            </Link>
          </h2>
          {product.shortDescription ? (
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/75 sm:text-base">
              {product.shortDescription}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-2">
            <p className="text-[34px] font-extrabold leading-none tracking-[-0.03em] text-accent sm:text-[40px]">
              {formatPrice(product.price)}
            </p>
            {off > 0 ? (
              <div className="flex items-center gap-2 pb-1">
                <span className="text-[15px] text-white/50 line-through">
                  {formatPrice(product.oldPrice!)}
                </span>
                <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-primary-800">
                  Save {off}%
                </span>
              </div>
            ) : null}
          </div>
          <p className="mt-3 flex items-center gap-2 text-[13px] text-white/70">
            <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
            {stockLabel(product.stock)}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href={href} variant="secondary" size="lg" className="shadow-[0_10px_24px_-12px_rgba(248,199,62,0.9)]">
              Shop now
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink
              href="/deals"
              size="lg"
              variant="ghost"
              className="text-white ring-1 ring-white/25 hover:bg-white/10"
            >
              Explore Awoof deals
            </ButtonLink>
          </div>

          <ul className="mt-10 hidden gap-5 border-t border-white/10 pt-6 sm:flex sm:flex-wrap">
            {assurances.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-[12.5px] text-white/75">
                <Icon className="h-4 w-4 text-accent" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href={href}
          aria-label={`View ${product.name}`}
          className="group relative order-first flex min-h-[260px] items-center justify-center overflow-hidden bg-primary p-6 sm:min-h-[340px] lg:order-none lg:min-h-full lg:p-10"
        >
          <span
            className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:18px_18px]"
            aria-hidden
          />
          <span
            className="absolute left-1/2 top-1/2 aspect-square w-[min(74%,460px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/90 lg:w-[min(84%,460px)]"
            aria-hidden
          />
          <span className="relative my-4 aspect-square w-[52%] max-w-[360px] sm:w-[46%] lg:my-0 lg:w-[66%] overflow-hidden rounded-[28px] bg-white shadow-[0_30px_60px_-30px_rgba(4,35,24,0.8)] ring-4 ring-white/40 transition-transform duration-500 ease-premium group-hover:-translate-y-1 group-hover:rotate-[-1deg]">
            {isOptimizableImage(image) ? (
              <Image
                src={image}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 70vw, 380px"
                className="scale-110 object-cover object-bottom"
              />
            ) : (
              <span className="grid h-full w-full place-items-center">
                <ProductIcon icon={product.icon} className="h-1/2 w-1/2 text-primary/70" />
              </span>
            )}
          </span>
          {off > 0 ? (
            <span className="absolute right-5 top-5 grid h-[72px] w-[72px] place-items-center rounded-full bg-white text-center text-primary-800 shadow-lg sm:right-8 sm:top-8">
              <span className="leading-none">
                <span className="block text-[20px] font-extrabold">-{off}%</span>
                <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.14em]">
                  Awoof
                </span>
              </span>
            </span>
          ) : null}
        </Link>
      </div>
    </section>
  );
}
