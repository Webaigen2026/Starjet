"use client";

import Image from "next/image";
import { useTheme } from "next-themes";

import { useIsMounted } from "@/app/lib/useIsMounted";

/**
 * Theme-aware brand mark.
 * Light → logo_blue_upgrade.png
 * Dark  → logo_white_upgrade.png
 * Driven by next-themes `resolvedTheme` so ThemeToggle swaps it on click.
 */
export default function BrandLogo({ size = 58 }: { size?: number }) {
  const { resolvedTheme } = useTheme();
  const mounted = useIsMounted();

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Image
      key={isDark ? "logo-dark" : "logo-light"}
      src={
        isDark
          ? "/airplane/logo_white_upgrade.png"
          : "/airplane/logo_blue_upgrade.png"
      }
      alt=""
      width={size}
      height={size}
      priority
      className="h-full w-full object-contain transition-opacity duration-300"
    />
  );
}
