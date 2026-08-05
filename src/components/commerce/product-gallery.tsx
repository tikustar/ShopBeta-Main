"use client";

import { useState } from "react";
import { Maximize2, ZoomIn } from "lucide-react";
import type { IconKey } from "@/lib/data";
import { cn } from "@/lib/utils";
import { ProductMedia } from "@/components/commerce/product-media";

/**
 * Placeholder gallery: four angles are represented with tinted surfaces.
 * The zoom pane mirrors the active view for the real image implementation.
 */
export function ProductGallery({
  icon,
  tone,
  name,
  views = ["Front", "Side", "Ports", "In use"],
}: {
  icon: IconKey;
  tone: string;
  name: string;
  views?: string[];
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);

  return (
    <div className="flex flex-col gap-4 sm:flex-row-reverse">
      <div className="relative min-w-0 flex-1">
        <ProductMedia
          icon={icon}
          tone={tone}
          name={`${name} — ${views[active]} view`}
          className={cn(
            "aspect-square w-full rounded-2xl transition-transform duration-500 ease-premium",
            zoom && "scale-[1.35] cursor-zoom-out",
          )}
          iconClassName="h-1/2 w-1/2"
        />
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden />
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <button
            type="button"
            aria-pressed={zoom}
            aria-label={zoom ? "Zoom out" : "Zoom in"}
            onClick={() => setZoom((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white/90 text-ink backdrop-blur transition-colors hover:bg-white"
          >
            <ZoomIn className="h-[18px] w-[18px]" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Open full screen"
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white/90 text-ink backdrop-blur transition-colors hover:bg-white"
          >
            <Maximize2 className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </div>
        <p className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-muted backdrop-blur">
          {views[active]} · hover to zoom
        </p>
      </div>

      <div className="no-scrollbar flex gap-3 overflow-x-auto sm:flex-col sm:overflow-visible">
        {views.map((view, index) => (
          <button
            key={view}
            type="button"
            aria-label={`Show ${view} view`}
            aria-pressed={index === active}
            onClick={() => setActive(index)}
            className={cn(
              "shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200",
              index === active ? "border-primary" : "border-transparent hover:border-line",
            )}
          >
            <ProductMedia
              icon={icon}
              tone={tone}
              name={`${name} thumbnail ${view}`}
              className="h-20 w-20"
              iconClassName="h-2/5 w-2/5"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
