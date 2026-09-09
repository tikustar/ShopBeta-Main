import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <Link
      href="/"
      aria-label="ShopBeta home"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <div className="relative h-9 w-9 transition-transform duration-300 ease-premium group-hover:scale-105">
        <Image
          src="/ShopBet logo icon.png"
          alt="ShopBeta logo"
          fill
          className="rounded-xl object-contain"
          priority
        />
      </div>
      <span
        className={cn(
          "text-[19px] font-semibold tracking-[-0.03em]",
          tone === "dark" ? "text-ink" : "text-white",
        )}
      >
        Shop<span className="text-primary">Beta</span>
      </span>
    </Link>
  );
}
