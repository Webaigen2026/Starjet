"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { cn } from "@/app/lib/utils";
import { useIsMounted } from "@/app/lib/useIsMounted";

const IMAGE_SIZES = `
  (min-width: 1536px) min(1800px - 28vw - 5rem, calc(100vw - 28vw - 5rem)),
  (min-width: 1024px) calc(100vw - 5rem),
  100vw
`;

// How many px of scroll (past the point the hero starts leaving the
// viewport) it takes for the plane to fully fly off and vanish.
const FLY_OFF_DISTANCE = 500;

/**
 * Theme-aware airplane cutout. Driven by next-themes `resolvedTheme`
 * so ThemeToggle clicks swap the asset immediately.
 *
 * On scroll, the plane flies off to the right and fades out — driven
 * by a separate outer wrapper so it doesn't collide with the existing
 * entrance/float CSS animations on `.hs-plane`.
 */
export default function HeroAirplaneCutout() {
  const { resolvedTheme } = useTheme();
  const mounted = useIsMounted();
  const isDark = mounted && resolvedTheme === "dark";

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0); // 0 = in place, 1 = fully flown off

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    let rafId: number | null = null;

    const updateProgress = () => {
      rafId = null;
      const el = wrapperRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      // Once the top of the plane's wrapper scrolls above the viewport
      // top, start flying off; fully gone after FLY_OFF_DISTANCE px.
      const scrolledPast = Math.max(0, -rect.top);
      const progress = Math.min(1, scrolledPast / FLY_OFF_DISTANCE);
      setScrollProgress(progress);
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  // Ease-out-ish curve so it accelerates away rather than moving linearly.
  const eased = scrollProgress * (2 - scrollProgress);
  const translateX = eased * 140; // vw-independent px-ish nudge; tune to taste
  const translateXPercent = eased * 60; // % of own width, flies further at wider sizes
  const opacity = 1 - eased;

  return (
    <div
    ref={wrapperRef}
    className="relative h-full w-full"
    style={{
      transform: `translateX(calc(${translateX}px + ${translateXPercent}%)) rotate(${eased * 8}deg)`,
      opacity,
      willChange: "transform, opacity",
    }}
  >
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
    </div>
  );
}