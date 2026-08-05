"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export function Countdown({
  seconds = 3 * 3600 + 42 * 60 + 18,
  tone = "light",
  className,
  showLabels = true,
}: {
  seconds?: number;
  tone?: "light" | "dark";
  className?: string;
  showLabels?: boolean;
}) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((value) => (value <= 1 ? seconds : value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const parts = [
    { label: "Hours", value: pad(Math.floor(remaining / 3600)) },
    { label: "Mins", value: pad(Math.floor((remaining % 3600) / 60)) },
    { label: "Secs", value: pad(remaining % 60) },
  ];

  return (
    <div className={cn("flex items-center gap-2", className)} aria-live="off">
      {parts.map((part, index) => (
        <span key={part.label} className="flex items-center gap-2">
          <span
            className={cn(
              "flex min-w-[52px] flex-col items-center rounded-xl px-2 py-1.5",
              tone === "dark" ? "bg-white/10 text-white" : "bg-white text-ink border border-line",
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
