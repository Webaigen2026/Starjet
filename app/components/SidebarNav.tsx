"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Compass,
  Heart,
  Luggage,
  Menu,
  PackageCheck,
  PanelLeftClose,
  PanelLeftOpen,
  PlaneTakeoff,
} from "lucide-react";

import { cn } from "@/app/lib/utils";
import ThemeToggle from "./ThemeToggle";
import { useSidebar } from "./SidebarContext";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

const primaryNavItems: NavItem[] = [
  { label: "Flights", href: "/flights", icon: PlaneTakeoff },
  { label: "Manage Booking", href: "/my-trips", icon: Luggage },
  { label: "Cargo Services", href: "/cargo", icon: PackageCheck },
];

const secondaryNavItems: NavItem[] = [
  { label: "Explore", href: "/flights", icon: Compass },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const { collapsed, toggleSidebar } = useSidebar();

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col  bg-background transition-[width] duration-300 ease-in-out lg:flex",
        collapsed ? "w-[76px]" : "w-64",
      )}
    >
      {/* Header: menu toggle + wordmark */}
      <div
        className={cn(
          "flex h-20 items-center gap-3  px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        {!collapsed && (
          <Link
            href="/"
            className="button-text truncate text-lg font-black tracking-tight text-primary"
          >
            {/* StarJet */}
            <div className="min-w-0 flex flex-col justify-center">
    {/* Uniform Color Title with Elegant Typography */}
    <span className="truncate text-xl font-black italic tracking-wider text-primary drop-shadow-sm transition-opacity duration-300 group-hover:opacity-80 sm:text-2xl">
      StarJet<span className="not-italic text-accent">.</span>
    </span>

  
  </div>
          </Link>
        )}
      </div>

      {/* Scrollable nav body */}
      <div className="flex flex-1 flex-col justify-between overflow-y-auto py-3">
        <nav aria-label="Primary" className="flex flex-col gap-1 px-3">
          {primaryNavItems.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={pathname === item.href}
              collapsed={collapsed}
            />
          ))}

          <div
            className={cn(
              "my-2 border-t border-border",
              collapsed ? "mx-2" : "mx-1",
            )}
          />

          {secondaryNavItems.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={pathname === item.href}
              collapsed={collapsed}
            />
          ))}

          <SidebarLink
            item={{ label: "Trips", href: "/my-trips", icon: Heart }}
            active={pathname === "/my-trips"}
            collapsed={collapsed}
          />
        </nav>

        {/* Footer: theme */}
        <div className="flex flex-col gap-1 px-3 pt-3">
          <div
            className={cn(
              "mt-2 flex items-center gap-2 px-2",
              collapsed && "justify-center px-0",
            )}
          >
            <ThemeToggle compact />

            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:flex"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        collapsed && "justify-center px-0 py-3",
        active
          ? "bg-accent-gradient text-primary"
          : "text-secondary hover:bg-surface-muted hover:text-primary",
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0",
          active ? "text-primary" : "text-secondary group-hover:text-primary",
        )}
        aria-hidden="true"
      />

      {!collapsed && (
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
      )}

      {!collapsed && item.badge && (
        <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-background">
          {item.badge}
        </span>
      )}
    </Link>
  );
}