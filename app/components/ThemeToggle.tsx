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

  function cycleTheme() {
    const index = THEMES.indexOf(current);
    const next = THEMES[(index + 1) % THEMES.length];
    setTheme(next);
  }

  const label =
    current === "light"
      ? "Theme: Light. Switch to dark."
      : current === "dark"
        ? "Theme: Dark. Switch to system."
        : "Theme: System. Switch to light.";

  const Icon =
    !mounted
      ? Sun
      : current === "system"
        ? Monitor
        : resolvedTheme === "dark"
          ? Moon
          : Sun;

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={mounted ? label : "Toggle color theme"}
      title={mounted ? label : "Toggle color theme"}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-border bg-surface text-secondary shadow-sm transition",
        "hover:border-border-strong hover:bg-surface-muted hover:text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        compact ? "h-10 w-10" : "h-11 w-11",
        className,
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">
        {mounted ? label : "Toggle color theme"}
      </span>
    </button>
  );
}
