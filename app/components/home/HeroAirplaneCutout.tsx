"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { cn } from "@/app/lib/utils";
import { useIsMounted } from "@/app/lib/useIsMounted";

const IMAGE_SIZES = `
  (min-width: 1536px) min(1800px - 28vw - 5rem, calc(100vw - 28vw - 5rem)),
  (min-width: 1024px) calc(100vw - 5rem),
  100vw
`;

/**
 * Theme-aware airplane cutout. Driven by next-themes `resolvedTheme`
 * so ThemeToggle clicks swap the asset immediately (not only via CSS).
 */
export default function HeroAirplaneCutout() {
  const { resolvedTheme } = useTheme();
  const mounted = useIsMounted();
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div
      aria-hidden="true"
      className="hs-plane pointer-events-none absolute inset-0 z-20"
    >
      <Image
        src="/airplane/airplane_day_wt_bg.png"
        alt=""
        fill
        sizes={IMAGE_SIZES}
        className={cn(
          "object-contain object-top drop-shadow-[0_20px_35px_rgba(15,23,42,0.35)] sm:object-cover sm:object-[72%_28%]",
          isDark ? "hidden" : "block",
        )}
      />

      <Image
        src="/airplane/airplane_wt_bg.png"
        alt=""
        fill
        sizes={IMAGE_SIZES}
        className={cn(
          "object-contain object-top drop-shadow-[0_20px_35px_rgba(0,0,0,0.55)] sm:object-cover sm:object-[72%_28%]",
          isDark ? "block" : "hidden",
        )}
      />
    </div>
  );
}
