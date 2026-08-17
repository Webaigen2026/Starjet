"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Luggage,
  PackageCheck,
  PlaneTakeoff,
} from "lucide-react";

import { useIsMounted } from "@/app/lib/useIsMounted";

interface TravelTool {
  title: string;
  description: string;
  href: string;
  imageUrl: string;
  imageAlt: string;
  icon: ReactNode;
}

const travelTools: TravelTool[] = [
  {
    title: "Flight Search",
    description:
      "Find routes between Haiti, Miami, New York, Boston, and more.",
    href: "/flights",
    imageUrl: "/travels/boston1.jpg",
    imageAlt: "Scenic travel destination representing StarJet flight search",
    icon: <PlaneTakeoff className="h-5 w-5" aria-hidden="true" />,
  },
  {
    title: "Manage Booking",
    description:
      "Review your itinerary, update your trip, and manage your reservation.",
    href: "/my-trips",
    imageUrl: "/travels/caraibe.jpg",
    imageAlt: "Traveler destination representing airline booking management",
    icon: <Luggage className="h-5 w-5" aria-hidden="true" />,
  },
  {
    title: "Cargo Services",
    description:
      "Ship packages and cargo securely between Haiti and the United States.",
    href: "/cargo",
    imageUrl: "/travels/caraibe2.png",
    imageAlt: "Travel destination representing StarJet cargo services",
    icon: <PackageCheck className="h-5 w-5" aria-hidden="true" />,
  },
];

export default function TravelToolsSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const mounted = useIsMounted();

  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateNavigationState = useCallback(() => {
    const track = trackRef.current;

    if (!track) return;

    const tolerance = 4;

    setAtStart(track.scrollLeft <= tolerance);
    setAtEnd(
      track.scrollLeft + track.clientWidth >= track.scrollWidth - tolerance,
    );
  }, []);

  useEffect(() => {
    updateNavigationState();

    window.addEventListener("resize", updateNavigationState);

    return () => {
      window.removeEventListener("resize", updateNavigationState);
    };
  }, [updateNavigationState]);

  function scrollCards(direction: "previous" | "next") {
    const track = trackRef.current;
    const firstCard = track?.firstElementChild as HTMLElement | null;

    if (!track || !firstCard) return;

    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0");
    const distance = firstCard.offsetWidth + gap;

    track.scrollBy({
      left: direction === "next" ? distance : -distance,
      behavior: "smooth",
    });
  }

  return (
    <section className="overflow-hidden bg-[#EDF1F4] py-20 dark:bg-[#140227] sm:py-20 lg:py-20">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 xl:px-10">
        {/* Heading */}
        <div className="mb-8 flex flex-col gap-5 sm:mb-20 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <h2 className="section-title text-black dark:text-white lg:text-[clamp(1.75rem,1.2rem+1.5vw,2.5rem)]">
              Travel with confidence
            </h2>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={trackRef}
          onScroll={updateNavigationState}
          className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-10 py-6 pb-20 scroll-smooth [scrollbar-width:none] sm:-mx-6 sm:gap-6 sm:px-10 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {travelTools.map((tool) => (
            <TravelToolCard key={tool.title} tool={tool} />
          ))}
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center justify-between">
          <p className="hidden text-sm font-medium text-black sm:block">
            Swipe or use the arrows to explore StarJet services.
          </p>

          <div className="ml-auto flex gap-2">
            <NavigationButton
              direction="previous"
              disabled={mounted && atStart}
              onClick={() => scrollCards("previous")}
            />

            <NavigationButton
              direction="next"
              disabled={mounted && atEnd}
              onClick={() => scrollCards("next")}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function TravelToolCard({ tool }: { tool: TravelTool }) {
  return (
    <Link
      href={tool.href}
      className="group  flex w-[88vw] max-w-[390px] shrink-0 snap-start flex-col overflow-hidden rounded-[30px] bg-white text-black shadow-[-14px_-14px_26px_var(--color-neu-highlight),14px_14px_26px_var(--color-neu-shadow)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[-18px_-18px_32px_var(--color-neu-highlight),18px_18px_32px_var(--color-neu-shadow)] dark:bg-white dark:shadow-sm dark:hover:shadow-2xl dark:hover:shadow-[color:var(--shadow-color)] sm:w-[360px] sm:max-w-none lg:w-[380px] xl:w-[400px]"
    >
      {/* Image */}
      <div className="relative h-56 overflow-hidden bg-primary-muted sm:h-60 lg:h-64">
        <Image
          src={tool.imageUrl}
          alt={tool.imageAlt}
          fill
          sizes="(min-width: 1280px) 400px, (min-width: 1024px) 380px, (min-width: 640px) 360px, 88vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/10 to-transparent" />

        <span className="absolute left-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-black shadow-sm">
          {tool.icon}
        </span>
      </div>

      {/* Content */}
      <div className="relative flex flex-1 flex-col px-5 pb-5 pt-9 sm:px-6 sm:pb-6">
        <div>
          <h3 className="text-2xl font-black tracking-tight text-black">
            {tool.title}
          </h3>
          <p className="mt-3 text-sm font-medium leading-6 text-black sm:text-base">
            {tool.description}
          </p>
        </div>

        <div className="mt-7 flex items-center justify-between pt-5">
          <span className="inline-flex items-center gap-2 text-2xl font-black tracking-tight text-black">
            Explore
            <ChevronRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

function NavigationButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "previous" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={
        direction === "previous"
          ? "View previous StarJet services"
          : "View next StarJet services"
      }
      className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[#ECF0F3] text-black shadow-[-6px_-6px_12px_var(--color-neu-highlight),6px_6px_12px_var(--color-neu-shadow)] transition-all duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#ECF0F3]/60 disabled:text-muted disabled:shadow-none dark:bg-white dark:shadow-sm dark:hover:border-accent dark:hover:bg-accent dark:hover:text-accent-foreground dark:disabled:bg-white/60 dark:disabled:opacity-60"
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}