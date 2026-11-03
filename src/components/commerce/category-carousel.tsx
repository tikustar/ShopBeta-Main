"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Category } from "@/lib/data";
import { cn } from "@/lib/utils";
import { isOptimizableImage } from "@/constants/app";
import { ProductIcon } from "@/components/commerce/product-media";

function ArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Previous categories" : "Next categories"}
      disabled={disabled}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white disabled:pointer-events-none disabled:opacity-35"
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}

export function CategoryCarousel({
  categories,
  actions,
}: {
  categories: Category[];
  actions?: React.ReactNode;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const update = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setEdges({
      start: track.scrollLeft <= 4,
      end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    update();
    track?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      track?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update, categories.length]);

  const scroll = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            <span className="h-1.5 w-5 rounded-full bg-accent" aria-hidden />
            Browse
          </p>
          <h2 className="text-xl font-bold tracking-[-0.02em] text-ink sm:text-2xl">
            Shop by category
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <div className="hidden items-center gap-2 md:flex">
            <ArrowButton direction="prev" disabled={edges.start} onClick={() => scroll(-1)} />
            <ArrowButton direction="next" disabled={edges.end} onClick={() => scroll(1)} />
          </div>
        </div>
      </div>

      <div className="relative">
        <ul
          ref={trackRef}
          aria-label="Product categories"
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0"
        >
          {categories.map((category) => {
            const image = isOptimizableImage(category.image) ? category.image : undefined;
            return (
              <li key={category.slug} className="shrink-0 snap-start">
                <Link
                  href={`/category/${category.slug}`}
                  className="group flex w-[96px] flex-col items-center gap-2.5 rounded-2xl p-1.5 text-center sm:w-[112px]"
                >
                  <span
                    className={cn(
                      "relative grid h-[72px] w-[72px] place-items-center overflow-hidden rounded-2xl border border-line transition-all duration-300 ease-premium group-hover:-translate-y-0.5 group-hover:border-primary group-hover:ring-4 group-hover:ring-accent/40 sm:h-[84px] sm:w-[84px]",
                      category.tone,
                    )}
                  >
                    {image ? (
                      <Image src={image} alt="" fill sizes="84px" className="object-cover" />
                    ) : (
                      <ProductIcon
                        icon={category.icon}
                        className="h-7 w-7 text-primary transition-transform duration-300 group-hover:scale-110 sm:h-8 sm:w-8"
                      />
                    )}
                  </span>
                  <span className="line-clamp-2 min-h-[2.5em] text-[12.5px] font-medium leading-tight text-ink group-hover:text-primary">
                    {category.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <span
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 hidden w-16 bg-gradient-to-l from-white to-transparent transition-opacity lg:block",
            edges.end ? "opacity-0" : "opacity-100",
          )}
          aria-hidden
        />
      </div>
    </div>
  );
}
