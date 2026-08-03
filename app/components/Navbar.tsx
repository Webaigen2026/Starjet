"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Home,
  Menu,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import BrandLogo from "./BrandLogo";
import ThemeToggle from "./ThemeToggle";
import { cn } from "@/app/lib/utils";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Flights", href: "/flights" },
  { label: "Cargo", href: "/cargo" },
  { label: "Charter", href: "/charter" },
  { label: "Contact", href: "/contact" },
];

// Neumorphic shadow tokens, scaled down from the -20/20px, 28px-blur source
// spec (sized for ~230px cards) to fit navbar-scale controls (~44px buttons,
// ~48px pill). Ratio kept roughly consistent (offset ≈ blur × 0.7).
// "Raised" = Shadow 1 (drop shadow duo): reads as sitting above the surface.
const NEU_RAISED =
  "shadow-[-4px_-4px_8px_var(--color-neu-highlight),4px_4px_8px_var(--color-neu-shadow)]";
// "Pressed" = Shadow 2 (inner shadow duo): reads as sunken into the surface —
// used for the active/selected nav tab, like a pressed toggle.
const NEU_PRESSED =
  "shadow-[inset_-3px_-3px_6px_var(--color-neu-highlight),inset_3px_3px_6px_var(--color-neu-shadow)]";
// Larger raised variant for bigger surfaces (the desktop nav pill container).
const NEU_RAISED_LG =
  "shadow-[-6px_-6px_14px_var(--color-neu-highlight),6px_6px_14px_var(--color-neu-shadow)]";

export default function Navbar() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPath, setSidebarPath] = useState(pathname);

  if (sidebarPath !== pathname) {
    setSidebarPath(pathname);
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  }

  // Home needs an exact match — with the startsWith() rule alone, "/" would
  // match every route in the app (everything starts with "/"), lighting up
  // Home on every single page instead of just the homepage.
  const isActiveRoute = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  useEffect(() => {
    if (!sidebarOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSidebar();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [sidebarOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] w-full max-w-full items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-10 xl:px-16">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link
              href="/"
              aria-label="StarJet home"
              className="group flex min-w-0 items-center gap-3 sm:gap-4"
            >
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-105 sm:h-24 sm:w-24">
                <BrandLogo size={96} />
              </div>

              <div className="min-w-0 flex flex-col justify-center">
                <span className="truncate text-2xl font-black italic tracking-wider text-primary drop-shadow-sm transition-opacity duration-300 group-hover:opacity-80 sm:text-3xl">
                  StarJet<span className="not-italic text-accent">.</span>
                </span>

                <span className="truncate text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground transition-colors duration-300 group-hover:text-primary sm:text-xs">
                  Air &amp; Cargo
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop navigation — the pill itself is a raised neumorphic
              surface; the border is dropped since the dual-shadow already
              reads as an edge, and a hard border on top of it fights the
              soft-embossed look. */}
          <nav
            aria-label="Primary navigation"
            className={cn(
              "hidden items-center gap-1 rounded-full bg-surface-muted p-1 lg:flex",
              NEU_RAISED_LG,
            )}
          >
            {navigation.map((item) => {
              const active = isActiveRoute(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "nav-link rounded-full px-4 py-2 transition-all duration-200 xl:px-5",
                    active
                      ? cn("bg-surface text-primary ", NEU_PRESSED)
                      : "text-primary  hover:bg-surface hover:text-primary",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle className="hidden lg:inline-flex cursor-pointer" />

            <Link
              href="/login"
              className="button-text hidden items-center gap-2 rounded-full px-4 py-2.5 text-secondary transition hover:bg-surface-muted hover:text-primary lg:inline-flex"
            >
              <UserRound className="h-4 w-4" />
              Sign in
            </Link>

            {/* Hamburger — same raised treatment, border removed for the
                same reason as the nav pill above. */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={sidebarOpen}
              aria-controls="mobile-sidebar"
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface text-secondary transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:shadow-[inset_-2px_-2px_5px_var(--color-neu-highlight),inset_2px_2px_5px_var(--color-neu-shadow)] lg:hidden",
                NEU_RAISED,
              )}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={closeSidebar}
        className={cn(
          "fixed inset-0 z-[60] bg-overlay backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
          sidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      />

      {/* Mobile sidebar */}
      <aside
        id="mobile-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={cn(
          "fixed inset-y-0 right-0 z-[70] flex w-[88%] max-w-[380px] flex-col bg-surface shadow-2xl shadow-[color:var(--shadow-color)] transition-transform duration-300 ease-out lg:hidden",
          sidebarOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-[72px] items-center justify-between border-b border-border px-5 sm:px-6">
          <Link
            href="/"
            onClick={closeSidebar}
            className="flex items-center gap-3"
          >
            <div className="relative h-10 w-10 overflow-hidden">
              <BrandLogo size={40} />
            </div>

            <div>
              <p className="text-base font-bold tracking-tight text-primary">
                StarJet
              </p>
              <p className="caption uppercase text-muted">Air & Cargo</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle compact className="cursor-pointer" />

            <button
              type="button"
              onClick={closeSidebar}
              aria-label="Close navigation menu"
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface text-secondary transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                NEU_RAISED,
              )}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-5 py-6 sm:px-6">
          <p className="caption mb-3 uppercase text-muted">Navigation</p>

          <nav aria-label="Mobile navigation" className="space-y-2">
            {navigation.map((item) => {
              const active = isActiveRoute(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "nav-link group flex min-h-14 items-center justify-between rounded-2xl px-4 py-3 text-base transition",
                    active
                      ? cn("bg-surface-muted dark:bg-surface-muted text-accent-muted-foreground", NEU_PRESSED)
                      : "text-secondary hover:bg-surface-muted hover:text-primary",
                  )}
                >
                  <span>{item.label}</span>

                  <ChevronRight
                    className={cn(
                      "h-5 w-5 transition-transform group-hover:translate-x-0.5",
                      active ? "text-accent" : "text-muted",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 space-y-3 border-t border-border pt-6">
            <Link
              href="/login"
              onClick={closeSidebar}
              className={cn(
                "button-text flex h-13 min-h-13 items-center justify-center gap-2 rounded-2xl bg-surface px-4 py-3 text-secondary transition hover:text-primary",
                NEU_RAISED,
              )}
            >
              <UserRound className="h-4 w-4" />
              Sign in
            </Link>

            <Link
              href="/flights"
              onClick={closeSidebar}
              className="button-text flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-accent-foreground shadow-lg shadow-[color:var(--shadow-color)] transition hover:bg-accent-hover"
            >
              <Search className="h-4 w-4" />
              Search flights
            </Link>
          </div>

          <div className="mt-auto pt-8">
            <div className="rounded-2xl bg-surface-muted p-4">
              <p className="text-sm font-bold text-primary">
                Need travel assistance?
              </p>
              <p className="body-text mt-1 text-sm text-muted">
                Contact the StarJet team for flight, cargo, and charter support.
              </p>

              <Link
                href="/contact"
                onClick={closeSidebar}
                className="button-text mt-3 inline-flex items-center gap-1 text-accent-muted-foreground hover:text-accent"
              >
                Contact us
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}