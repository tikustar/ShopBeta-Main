import Link from "next/link";
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
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white transition-transform duration-300 ease-premium group-hover:scale-105">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <path
            d="M6 8h12l-1.2 10.2A2 2 0 0 1 14.8 20H9.2a2 2 0 0 1-2-1.8L6 8Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M9 8V6.5a3 3 0 0 1 6 0V8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
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
