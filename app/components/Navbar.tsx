"use client";

import Image from "next/image";
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

  const isActiveRoute = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  useEffect(() => {
    closeSidebar();
  }, [pathname]);

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
      <header className="sticky top-0 z-50 bg-white/95  backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] w-full max-w-full items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-10 xl:px-16">
          {/* Brand */}
          <Link
            href="/"
            aria-label="StarJet home"
            className="group flex min-w-0 items-center gap-2.5 sm:gap-3"
          >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-cyan-50 transition group-hover:border-cyan-300 sm:h-12 sm:w-12">
              <Image
                src="/favicon-pack/favicon-512x512.png"
                alt=""
                width={48}
                height={48}
                priority
                className="h-full w-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-base font-black tracking-tight text-slate-950 sm:text-lg">
                StarJet
              </p>

              <p className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 sm:text-xs sm:tracking-[0.25em]">
                Air & Cargo
              </p>
            </div>
          </Link>

          {/* Desktop navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 lg:flex"
          >
            {navigation.map((item) => {
              const active = isActiveRoute(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 xl:px-5 ${
                    active
                      ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200"
                      : "text-slate-600 hover:bg-white hover:text-slate-950"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 lg:inline-flex"
            >
              <UserRound className="h-4 w-4" />
              Sign in
            </Link>

            <Link
              href="/flights"
              className="hidden items-center gap-2 rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-400 lg:inline-flex"
            >
              <Search className="h-4 w-4" />
              Search flights
            </Link>

            {/* Hamburger */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={sidebarOpen}
              aria-controls="mobile-sidebar"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 lg:hidden"
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
        className={`fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          sidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* Mobile sidebar */}
      <aside
        id="mobile-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={`fixed inset-y-0 right-0 z-[70] flex w-[88%] max-w-[380px] flex-col bg-white shadow-2xl shadow-slate-950/25 transition-transform duration-300 ease-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex h-[72px] items-center justify-between border-b border-slate-200 px-5 sm:px-6">
          <Link
            href="/"
            onClick={closeSidebar}
            className="flex items-center gap-3"
          >
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-cyan-50">
              <Image
                src="/favicon-pack/favicon-512x512.png"
                alt=""
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>

            <div>
              <p className="text-base font-black tracking-tight text-slate-950">
                StarJet
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Air & Cargo
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Close navigation menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar content */}
        <div className="flex flex-1 flex-col overflow-y-auto px-5 py-6 sm:px-6">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
            Navigation
          </p>

          <nav aria-label="Mobile navigation" className="space-y-2">
            {navigation.map((item) => {
              const active = isActiveRoute(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  aria-current={active ? "page" : undefined}
                  className={`group flex min-h-14 items-center justify-between rounded-2xl px-4 py-3 text-base font-bold transition ${
                    active
                      ? "bg-cyan-50 text-cyan-900 ring-1 ring-cyan-200"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <span>{item.label}</span>

                  <ChevronRight
                    className={`h-5 w-5 transition-transform group-hover:translate-x-0.5 ${
                      active ? "text-cyan-600" : "text-slate-400"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Mobile actions */}
          <div className="mt-8 space-y-3 border-t border-slate-200 pt-6">
            <Link
              href="/login"
              onClick={closeSidebar}
              className="flex h-13 min-h-13 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
            >
              <UserRound className="h-4 w-4" />
              Sign in
            </Link>

            <Link
              href="/flights"
              onClick={closeSidebar}
              className="flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
            >
              <Search className="h-4 w-4" />
              Search flights
            </Link>
          </div>

          {/* Footer note */}
          <div className="mt-auto pt-8">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-950">
                Need travel assistance?
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Contact the StarJet team for flight, cargo, and charter support.
              </p>

              <Link
                href="/contact"
                onClick={closeSidebar}
                className="mt-3 inline-flex items-center gap-1 text-sm font-black text-cyan-700 hover:text-cyan-800"
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