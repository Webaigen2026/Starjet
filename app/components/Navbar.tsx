"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
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
  {
    label: "Flights",
    href: "/flights",
  },
  {
    label: "Cargo",
    href: "/cargo",
  },
  {
    label: "Charter",
    href: "/charter",
  },
  {
    label: "Contact",
    href: "/contact",
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPath, setSidebarPath] = useState(pathname);

  // Close the drawer when the route changes (render-time sync, no effect).
  if (sidebarPath !== pathname) {
    setSidebarPath(pathname);
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  }

  const isActiveRoute = (href: string) => {
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
      <header className="sticky top-0 z-50  bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] w-full max-w-full items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-10 xl:px-16">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Desktop sidebar toggle */}
            {/* <button
              type="button"
              onClick={toggleSidebar}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-pressed={!collapsed}
              className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-secondary shadow-sm transition hover:border-border-strong hover:bg-surface-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:inline-flex"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
              )}
            </button> */}

            {/* Brand */}
          {/* Brand */}
{/* Brand */}
<Link
  href="/"
  aria-label="StarJet home"
  className="group flex min-w-0 items-center gap-3 sm:gap-4"
>
  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-105 sm:h-24 sm:w-24">
    <BrandLogo size={96} />
  </div>

  <div className="min-w-0 flex flex-col justify-center">
    {/* Uniform Color Title with Elegant Typography */}
    <span className="truncate text-2xl font-black italic tracking-wider text-primary drop-shadow-sm transition-opacity duration-300 group-hover:opacity-80 sm:text-3xl">
      StarJet<span className="not-italic text-accent">.</span>
    </span>

    {/* Uniform Subtext with Aviation Letter-Spacing */}
    <span className="truncate text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground transition-colors duration-300 group-hover:text-primary sm:text-xs">
      Air &amp; Cargo
    </span>
  </div>
</Link>
          </div>

          {/* Desktop navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-1 rounded-full border border-border bg-surface-muted p-1 lg:flex"
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
                      ? "bg-surface text-primary shadow-sm ring-1 ring-border"
                      : "text-secondary hover:bg-surface hover:text-primary",
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

            <Link
              href="/flights"
              className="button-text rounded-full flex shrink-0 cursor-pointer items-center justify-center gap-2 bg-accent px-8 py-4 text-accent-foreground transition-all duration-200 hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus-ring active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 "
      
            >
              <Search className="h-4 w-4" />
              Search flights
            </Link>

            {/* Hamburger (mobile drawer — unrelated to the desktop sidebar) */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={sidebarOpen}
              aria-controls="mobile-sidebar"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-secondary shadow-sm transition hover:border-border-strong hover:bg-surface-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:hidden"
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
        {/* Sidebar header */}
        <div className="flex h-[72px] items-center justify-between border-b border-border px-5 sm:px-6">
          <Link
            href="/"
            onClick={closeSidebar}
            className="flex items-center gap-3"
          >
            <div className="relative h-10 w-10 overflow-hidden ">
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-secondary transition hover:bg-surface-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Sidebar content */}
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
                      ? "bg-accent-muted text-accent-muted-foreground ring-1 ring-accent/30"
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

          {/* Mobile actions */}
          <div className="mt-8 space-y-3 border-t border-border pt-6">
            <Link
              href="/login"
              onClick={closeSidebar}
              className="button-text flex h-13 min-h-13 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-secondary transition hover:bg-surface-muted hover:text-primary"
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

          {/* Footer note */}
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