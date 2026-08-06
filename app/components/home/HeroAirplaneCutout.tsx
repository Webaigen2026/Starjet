"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

import { cn } from "@/app/lib/utils";
import { useIsMounted } from "@/app/lib/useIsMounted";

const IMAGE_SIZES = `
  (min-width: 1536px) min(
    1800px - 28vw - 5rem,
    calc(100vw - 28vw - 5rem)
  ),
  (min-width: 1024px) calc(100vw - 5rem),
  100vw
`;

/**
 * Number of pixels the hero must scroll past the top of the viewport
 * before the airplane has completely flown away.
 */
const FLY_OFF_DISTANCE = 500;

/**
 * Theme-aware airplane cutout.
 *
 * The outer wrapper handles scroll-based movement and opacity.
 * The inner `.hs-plane` element keeps the existing entrance and floating
 * animations defined in HeroSearch.
 */
export default function HeroAirplaneCutout() {
  const { resolvedTheme } = useTheme();
  const mounted = useIsMounted();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const isDark = mounted && resolvedTheme === "dark";

  useEffect(() => {
    const wrapper = wrapperRef.current;

    if (!wrapper) return;

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    if (reducedMotionQuery.matches) {
      wrapper.style.transform = "none";
      wrapper.style.opacity = "1";
      return;
    }

    let animationFrameId: number | null = null;

    const updateAirplanePosition = () => {
      animationFrameId = null;

      const element = wrapperRef.current;

      if (!element) return;

      const rect = element.getBoundingClientRect();

      /*
       * Begin the fly-off animation once the hero starts moving above the
       * viewport. Progress is clamped between 0 and 1.
       */
      const scrolledPastHero = Math.max(0, -rect.top);
      const progress = Math.min(
        1,
        scrolledPastHero / FLY_OFF_DISTANCE,
      );

      /*
       * Ease-out curve:
       * starts quickly and settles toward the final position.
       */
      const easedProgress = progress * (2 - progress);

      const translatePixels = easedProgress * 140;
      const translatePercent = easedProgress * 60;
      const rotation = easedProgress * 8;
      const opacity = 1 - easedProgress;

      element.style.transform = `
        translateX(
          calc(${translatePixels}px + ${translatePercent}%)
        )
        rotate(${rotation}deg)
      `;

      element.style.opacity = String(opacity);
    };

    const requestUpdate = () => {
      if (animationFrameId !== null) return;

      animationFrameId = window.requestAnimationFrame(
        updateAirplanePosition,
      );
    };

    updateAirplanePosition();

    window.addEventListener("scroll", requestUpdate, {
      passive: true,
    });

    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="
        pointer-events-none
        absolute inset-0 z-40
        transform-gpu
      "
      style={{
        opacity: 1,
        willChange: "transform, opacity",
      }}
    >
      <div
        className="
          hs-plane
          pointer-events-none
          absolute inset-y-0
          -left-[6%]
          w-[112%]
        "
      >
        {/* Light-mode airplane */}
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

        {/* Dark-mode airplane */}
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