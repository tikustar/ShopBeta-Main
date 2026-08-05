"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantitySelector({
  initial = 1,
  max = 10,
  size = "md",
  className,
}: {
  initial?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const [qty, setQty] = useState(initial);
  const dims = size === "sm" ? "h-9" : "h-12";
  const btn = size === "sm" ? "h-9 w-9" : "h-12 w-12";

  return (
    <div
      className={cn(
        "inline-flex items-center overflow-hidden rounded-full border border-line bg-white",
        dims,
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => setQty((q) => Math.max(1, q - 1))}
        disabled={qty <= 1}
        className={cn(
          "grid place-items-center text-ink transition-colors hover:bg-soft disabled:opacity-35",
          btn,
        )}
      >
        <Minus className="h-4 w-4" aria-hidden />
      </button>
      <span
        aria-live="polite"
        className={cn(
          "min-w-8 text-center text-sm font-semibold tabular-nums text-ink",
          size === "sm" && "min-w-6 text-[13px]",
        )}
      >
        {qty}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => setQty((q) => Math.min(max, q + 1))}
        disabled={qty >= max}
        className={cn(
          "grid place-items-center text-ink transition-colors hover:bg-soft disabled:opacity-35",
          btn,
        )}
      >
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
