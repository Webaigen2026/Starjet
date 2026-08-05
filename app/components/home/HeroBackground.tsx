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

export default function HeroBackground() {
  const { resolvedTheme } = useTheme();
  const mounted = useIsMounted();
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className="hs-hero-media absolute inset-0 overflow-hidden">
      {/* Light mode */}
      <Image
        src="/airplane/hero_day_bg.png"
        alt="A StarJet aircraft cruising above the clouds at sunset"
        fill
        priority
        sizes={IMAGE_SIZES}
        className={cn(
          "hs-hero-image object-cover object-[center_32%] opacity-[0.92] sm:object-[center_28%]",
          isDark ? "hidden" : "block",
        )}
      />

      {/* Dark mode */}
      <Image
        src="/airplane/hero_bg.png"
        alt="A StarJet aircraft cruising above the clouds at night"
        fill
        priority
        sizes={IMAGE_SIZES}
        className={cn(
          "hs-hero-image object-cover object-[center_32%] opacity-[0.96] sm:object-[center_28%]",
          isDark ? "block" : "hidden",
        )}
      />

      {/* Soft atmospheric veil */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0",
          isDark ? "bg-black/5" : "bg-white/5",
        )}
      />

      {/* Animated bright cloud glow */}
    {/* Moving cloud glow */}
<div
  aria-hidden="true"
  className="
  dark:hidden
    cloud-glow
    pointer-events-none
    absolute
    bottom-[-4%]
    left-[-25%]
    h-[38%]
    w-[150%]
    bg-white/90
    blur-3xl
  "
/>
    </div>
  );
}