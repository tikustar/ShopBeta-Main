"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function WishlistButton({
  initial = false,
  label = "Save to wishlist",
  className,
  size = "md",
}: {
  initial?: boolean;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [saved, setSaved] = useState(initial);
  const dims = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" }[size];
  const icon = { sm: "h-4 w-4", md: "h-[18px] w-[18px]", lg: "h-5 w-5" }[size];

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : label}
      title={saved ? "Saved to wishlist" : label}
      onClick={() => setSaved((value) => !value)}
      className={cn(
        "grid shrink-0 place-items-center rounded-full border bg-white/90 backdrop-blur transition-all duration-200 ease-premium active:scale-90",
        dims,
        saved
          ? "border-primary-200 text-primary"
          : "border-line text-ink hover:border-primary-200 hover:text-primary",
        className,
      )}
    >
      <Heart className={cn(icon, saved && "fill-primary")} aria-hidden />
    </button>
  );
}
