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
 * How quickly the rendered position catches up to the scroll-derived
 * target, per frame. Lower = smoother and more "weighted", higher =
 * snappier and closer to a 1:1 scroll mapping. 0.15 reads as a gentle,
 * eased glide rather than either a lag or a rigid lockstep.
 */
const SMOOTHING = 0.15;

/**
 * Once the rendered value is this close to the target, treat it as
 * arrived and stop the animation loop instead of chasing rounding noise
 * on every frame forever.
 */
const SETTLE_THRESHOLD = 0.0008;

/**
 * Theme-aware airplane cutout.
 *
 * The outer wrapper handles scroll-based movement and opacity. The inner
 * `.hs-plane` element keeps the existing entrance and floating animations
 * defined in HeroSearch.
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

    // The hero's top offset relative to the document. Measured once on
    // mount and again on resize — never on a scroll tick — so scrolling
    // itself never forces a synchronous layout read.
    let heroTop = 0;
    let targetProgress = 0;
    let renderedProgress = 0;
    let animationFrameId: number | null = null;

    const measureHeroTop = () => {
      const rect = wrapper.getBoundingClientRect();
      heroTop = rect.top + window.scrollY;
    };

    const applyProgress = (progress: number) => {
      /*
       * Ease-out curve: starts quickly and settles toward the final
       * position.
       */
      const easedProgress = progress * (2 - progress);

      const translatePixels = easedProgress * 140;
      const translatePercent = easedProgress * 60;
      const rotation = easedProgress * 8;
      const opacity = 1 - easedProgress;

      wrapper.style.transform =
        `translateX(calc(${translatePixels}px + ${translatePercent}%)) ` +
        `rotate(${rotation}deg)`;
      wrapper.style.opacity = String(opacity);
    };

    const tick = () => {
      const delta = targetProgress - renderedProgress;

      if (Math.abs(delta) < SETTLE_THRESHOLD) {
        renderedProgress = targetProgress;
        applyProgress(renderedProgress);
        animationFrameId = null;
        return;
      }

      renderedProgress += delta * SMOOTHING;
      applyProgress(renderedProgress);
      animationFrameId = window.requestAnimationFrame(tick);
    };

    const requestTick = () => {
      if (animationFrameId === null) {
        animationFrameId = window.requestAnimationFrame(tick);
      }
    };

    const updateTarget = () => {
      const scrolledPastHero = Math.max(0, window.scrollY - heroTop);
      targetProgress = Math.min(1, scrolledPastHero / FLY_OFF_DISTANCE);
      requestTick();
    };

    const handleResize = () => {
      measureHeroTop();
      updateTarget();
    };

    measureHeroTop();
    updateTarget();
    applyProgress(renderedProgress);

    window.addEventListener("scroll", updateTarget, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", updateTarget);
      window.removeEventListener("resize", handleResize);

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