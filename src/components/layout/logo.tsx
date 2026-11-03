import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { APP_DESCRIPTOR, APP_NAME, BRAND_LOGO } from "@/constants/app";

/** Callers set size and positioning via className (cn does not merge conflicting utilities). */
export function BrandMark({
  className = "h-10 w-10",
  tone = "dark",
  priority,
}: {
  className?: string;
  tone?: "dark" | "light";
  priority?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-block shrink-0",
        tone === "light" && "rounded-xl bg-white p-1 shadow-sm",
        className,
      )}
    >
      <span className="relative block h-full w-full">
        <Image
          src={BRAND_LOGO}
          alt=""
          fill
          sizes="64px"
          className="object-contain"
          priority={priority}
        />
      </span>
    </span>
  );
}

export function Logo({
  className,
  tone = "dark",
  compact = false,
  href = "/",
}: {
  className?: string;
  tone?: "dark" | "light";
  compact?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={`${APP_NAME} ${APP_DESCRIPTOR} home`}
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <BrandMark
        tone={tone}
        priority
        className="relative h-9 w-9 transition-transform duration-300 ease-premium group-hover:scale-105 sm:h-10 sm:w-10"
      />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[17px] font-extrabold uppercase tracking-[0.02em] sm:text-[20px]",
            tone === "dark" ? "text-primary" : "text-white",
          )}
        >
          {APP_NAME}
        </span>
        {!compact ? (
          <span
            className={cn(
              "mt-1 text-[8.5px] font-semibold uppercase tracking-[0.24em] sm:text-[9.5px] sm:tracking-[0.28em]",
              tone === "dark" ? "text-accent-700" : "text-accent",
            )}
          >
            {APP_DESCRIPTOR}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
