"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

const NEXT_THEMES_SCRIPT_WARNING =
  "Encountered a script tag while rendering React component.";

const MARKER = "__nextThemesConsoleErrorFiltered";

type WindowWithMarker = Window & {
  [MARKER]?: boolean;
};
const win =
  typeof window !== "undefined"
    ? (window as unknown as WindowWithMarker)
    : undefined;
if (process.env.NODE_ENV === "development" && win) {
  if (!win[MARKER]) {
    const originalConsoleError = console.error.bind(console);

    console.error = (...args: unknown[]) => {
      const firstArg = args[0];

      const isNextThemesScriptWarning =
        (typeof firstArg === "string" &&
          firstArg.includes(NEXT_THEMES_SCRIPT_WARNING)) ||
        (firstArg instanceof Error &&
          firstArg.message.includes(NEXT_THEMES_SCRIPT_WARNING));

      if (isNextThemesScriptWarning) {
        return;
      }

      originalConsoleError(...args);
    };

    win[MARKER] = true;
  }
}

export default function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
