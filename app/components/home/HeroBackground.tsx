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
    <div className="hs-hero-media absolute inset-0">
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

      {/* Soft white atmospheric veil */}
      <div
        aria-hidden="true"
        className="
          absolute inset-0
          bg-white/8
          dark:bg-transparent
        "
      />
    </div>
  );
}