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
 * so ThemeToggle clicks swap the asset immediately.
 */
export default function HeroAirplaneCutout() {
  const { resolvedTheme } = useTheme();
  const mounted = useIsMounted();
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div
      aria-hidden="true"
      className="
        hs-plane
        pointer-events-none
        absolute
        inset-y-0
        -left-[6%]
        w-[112%]
        z-20        
      "
    >

        {/* className="
    hs-plane
    pointer-events-none
    absolute
    left-0
    top-0
    h-[38%]
    w-full
    z-30

    sm:inset-y-0
    sm:-left-[6%]
    sm:top-auto
    sm:h-auto
    sm:w-[112%]
  " */}
      {/* Light mode */}
      <Image
        src="/airplane/airplane_day_wt_bg.png"
        alt=""
        fill
        priority
        sizes={IMAGE_SIZES}
        className={cn(
          `
            object-contain
            object-center
            drop-shadow-[0_20px_35px_rgba(15,23,42,0.35)]

            sm:object-cover
            sm:object-[72%_28%]
          `,
          isDark ? "hidden" : "block",
        )}
      />

      {/* Dark mode */}
      <Image
        src="/airplane/airplane_wt_bg.png"
        alt=""
        fill
        priority
        sizes={IMAGE_SIZES}
        className={cn(
          `
            object-contain
            object-center
            drop-shadow-[0_20px_35px_rgba(0,0,0,0.55)]

            sm:object-cover
            sm:object-[72%_28%]
          `,
          isDark ? "block" : "hidden",
        )}
      />
    </div>
  );
}