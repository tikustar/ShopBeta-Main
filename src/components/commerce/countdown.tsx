"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export { endOfTodayISO } from "@/lib/datetime";

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function resolveInitialSeconds(endsAt?: Date | string | number, seconds?: number) {
  if (endsAt != null) {
    const end = new Date(endsAt).getTime();
    if (!Number.isNaN(end)) {
      return Math.max(0, Math.floor((end - Date.now()) / 1000));
    }
  }
  return seconds ?? 3 * 3600 + 42 * 60 + 18;
}

export function Countdown({
  seconds,
  endsAt,
  tone = "light",
  className,
  showLabels = true,
  onExpire,
  loop = false,
}: {
  /** Fallback duration when `endsAt` is not provided. */
  seconds?: number;
  /** Absolute end time — preferred for real flash sales. */
  endsAt?: Date | string | number;
  tone?: "light" | "dark";
  className?: string;
  showLabels?: boolean;
  onExpire?: () => void;
  /** Restart the timer when it hits zero (demo/home fallback). */
  loop?: boolean;
}) {
  // Time-dependent values differ between the server render and hydration, so the
  // clock only renders real values after mount (avoids React hydration errors).
  const [mounted, setMounted] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const next = resolveInitialSeconds(endsAt, seconds);
    setRemaining(next);
    setExpired(next <= 0);
    setMounted(true);
  }, [endsAt, seconds]);

  useEffect(() => {
    if (!mounted || (expired && !loop)) return;
    const timer = setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          if (loop && seconds) return seconds;
          setExpired(true);
          onExpire?.();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [mounted, expired, loop, onExpire, seconds]);

  if (mounted && expired && !loop) {
    return (
      <p
        className={cn(
          "text-[13px] font-medium",
          tone === "dark" ? "text-white/70" : "text-muted",
          className,
        )}
        role="status"
      >
        Offer ended
      </p>
    );
  }

  const hours = Math.floor(remaining / 3600);
  const parts = [
    { label: "Hours", value: mounted ? pad(hours) : "--" },
    { label: "Mins", value: mounted ? pad(Math.floor((remaining % 3600) / 60)) : "--" },
    { label: "Secs", value: mounted ? pad(remaining % 60) : "--" },
  ];

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      aria-live="polite"
      aria-label={`Sale ends in ${hours} hours ${parts[1].value} minutes ${parts[2].value} seconds`}
    >
      {parts.map((part, index) => (
        <span key={part.label} className="flex items-center gap-2">
          <span
            className={cn(
              "flex min-w-[52px] flex-col items-center rounded-xl px-2 py-1.5",
              tone === "dark"
                ? "bg-white/10 text-white"
                : "border border-line bg-white text-ink",
            )}
          >
            <span className="text-lg font-semibold tabular-nums tracking-tight">
              {part.value}
            </span>
            {showLabels ? (
              <span
                className={cn(
                  "text-[10px] uppercase tracking-[0.1em]",
                  tone === "dark" ? "text-white/60" : "text-muted",
                )}
              >
                {part.label}
              </span>
            ) : null}
          </span>
          {index < parts.length - 1 ? (
            <span
              className={cn(
                "text-lg font-semibold",
                tone === "dark" ? "text-white/40" : "text-line",
              )}
              aria-hidden
            >
              :
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}
