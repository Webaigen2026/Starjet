"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "../lib/utils";

const navItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Bookings", href: "/admin/bookings" },
  { label: "Cargo", href: "/admin/cargo" },
  { label: "Charter", href: "/admin/charter" },
  { label: "Passengers", href: "/admin/passengers" },
];

export default function AdminNav() {
  const pathname = usePathname();

  const isActiveRoute = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="border-b border-border bg-surface/95">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-10">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:gap-3">
          {navItems.map((item) => {
            const active = isActiveRoute(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "nav-link shrink-0 rounded-full border px-3 py-2 text-sm transition-all duration-200 whitespace-nowrap sm:px-4",
                  active
                    ? "border-accent/30 bg-accent-muted text-accent-muted-foreground shadow-sm"
                    : "border-transparent bg-transparent text-secondary hover:border-border hover:bg-surface-muted hover:text-primary",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
