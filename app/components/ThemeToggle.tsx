"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/app/lib/utils";

const THEMES = ["light", "dark", "system"] as const;
type AppTheme = (typeof THEMES)[number];

function isAppTheme(value: string | undefined): value is AppTheme {
  return THEMES.includes(value as AppTheme);
}

function subscribe() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

function describeTheme(current: AppTheme): string {
  switch (current) {
    case "light":
      return "Theme: Light. Switch to dark.";
    case "dark":
      return "Theme: Dark. Switch to system.";
    case "system":
      return "Theme: System. Switch to light.";
  }
}

export default function ThemeToggle({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const current: AppTheme = isAppTheme(theme) ? theme : "system";
  // Stable pre-mount fallbacks so SSR HTML matches the first client render.
  const displayState: AppTheme = mounted ? current : "system";
  const label = mounted ? describeTheme(current) : "Toggle color theme";
  const iconName = !mounted
    ? "sun"
    : current === "system"
      ? "monitor"
      : resolvedTheme === "dark"
        ? "moon"
        : "sun";
  const iconClassName = cn(
    "shrink-0 transition-transform duration-200 ease-out",
    "group-hover:scale-110 group-active:scale-90",
    compact ? "h-3.5 w-3.5" : "h-4 w-4",
  );

  function cycleTheme() {
    if (!mounted) return;

    const index = THEMES.indexOf(current);
    const next = THEMES[(index + 1) % THEMES.length];
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={label}
      title={label}
      data-state={displayState}
      className={cn(
        "group inline-flex items-center justify-center rounded-full border border-border bg-surface text-secondary shadow-sm transition-colors duration-200",
        "hover:border-border-strong hover:bg-surface-muted hover:text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        compact ? "h-10 w-10" : "h-11 w-11",
        className,
      )}
    >
      {iconName === "monitor" ? (
        <Monitor className={iconClassName} aria-hidden="true" />
      ) : iconName === "moon" ? (
        <Moon className={iconClassName} aria-hidden="true" />
      ) : (
        <Sun className={iconClassName} aria-hidden="true" />
      )}
    </button>
  );
}
