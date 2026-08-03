"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from "lucide-react";

import { useIsMounted } from "@/app/lib/useIsMounted";

interface TravelDeal {
  city: string;
  duration: string;
  dateRange: string;
  priceFrom: number;
  imageUrl: string;
  imageAlt: string;
}

const deals: TravelDeal[] = [
  {
    city: "Washington, D.C.",
    duration: "1h 44m, non-stop",
    dateRange: "Thu 8/20 – Mon 8/24",
    priceFrom: 109,
    imageUrl: "/location/CitadelleLaferriereHaiti.jpg",
    imageAlt: "The Capitol building reflected in the water at dusk",
  },
  {
    city: "Baltimore",
    duration: "1h 43m, non-stop",
    dateRange: "Tue 8/25 – Sat 8/29",
    priceFrom: 117,
    imageUrl: "/location/mid-beach-aerial1-1440x900.jpg",
    imageAlt: "Aerial view of Baltimore's Inner Harbor",
  },
  {
    city: "Knoxville",
    duration: "2h 28m, non-stop",
    dateRange: "Sat 8/22 – Sat 8/29",
    priceFrom: 142,
    imageUrl: "/location/Newyork.webp",
    imageAlt: "The Sunsphere lit up over downtown Knoxville",
  },
  {
    city: "Raleigh",
    duration: "2h 8m, non-stop",
    dateRange: "Mon 8/24 – Thu 8/27",
    priceFrom: 149,
    imageUrl: "/location/palas.webp",
    imageAlt: "Raleigh skyline lit up at night",
  },
];

export default function TravelDealsCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const mounted = useIsMounted();

  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = useCallback(() => {
    const track = trackRef.current;

    if (!track) return;

    const tolerance = 4;

    setAtStart(track.scrollLeft <= tolerance);
    setAtEnd(
      track.scrollLeft + track.clientWidth >= track.scrollWidth - tolerance,
    );
  }, []);

  useEffect(() => {
    updateEdges();

    window.addEventListener("resize", updateEdges);

    return () => {
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges]);

  function scrollByCard(direction: "prev" | "next") {
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
    <section className="overflow-hidden bg-background py-12 sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 xl:px-16">
        {/* Heading */}
        <div className="mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="section-title text-primary lg:text-[clamp(1.75rem,1.2rem+1.5vw,2.25rem)]">
            Travel deals under $192
          </h2>

          <Link
            href="/deals"
            className="group inline-flex w-fit items-center gap-2 text-sm font-bold text-accent transition hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4"
          >
            Explore all deals

            <ArrowUpRight
              className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* Carousel */}
        <div
          ref={trackRef}
          onScroll={updateEdges}
          className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 scroll-smooth [scrollbar-width:none] sm:-mx-6 sm:gap-6 sm:px-6 lg:mx-0 lg:gap-7 lg:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {deals.map((deal) => (
            <DealCard key={`${deal.city}-${deal.dateRange}`} deal={deal} />
          ))}
        </div>

        {/* Controls */}
        <div className="mt-3 flex items-center justify-between">
          <p className="hidden text-sm font-medium text-muted sm:block">
            Swipe or use the arrows to browse more destinations.
          </p>

          <div className="ml-auto flex gap-2">
            <NavButton
              direction="prev"
              disabled={mounted && atStart}
              onClick={() => scrollByCard("prev")}
            />

            <NavButton
              direction="next"
              disabled={mounted && atEnd}
              onClick={() => scrollByCard("next")}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function DealCard({ deal }: { deal: TravelDeal }) {
  return (
    <article className="group flex w-[88vw] max-w-[390px] shrink-0 snap-start flex-col overflow-hidden rounded-[30px] bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-xl hover:shadow-[color:var(--shadow-color)] sm:w-[380px] sm:max-w-none lg:w-[410px] xl:w-[430px]">
      {/* Image */}
      <div className="p-3 sm:p-4">
        <div className="relative h-52 cursor-pointer overflow-hidden rounded-[24px] bg-surface-muted sm:h-56 lg:h-60">
          <Image
            src={deal.imageUrl}
            alt={deal.imageAlt}
            fill
            sizes="(min-width: 1280px) 430px, (min-width: 1024px) 410px, (min-width: 640px) 380px, 88vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-5 pb-6 pt-2 sm:px-6">
        <div>
          <h3 className="text-xl font-black tracking-tight text-primary sm:text-2xl">
            {deal.city}
          </h3>

          <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-muted">
            <Clock3
              className="h-4 w-4 shrink-0 text-accent"
              aria-hidden="true"
            />

            <span>{deal.duration}</span>
          </div>

          <p className="mt-2 text-sm font-semibold text-muted">
            {deal.dateRange}
          </p>
        </div>

        <div className="mt-6 flex items-end justify-between border-t border-border pt-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Round-trip from
            </p>

            <p className="mt-1 text-2xl font-black text-primary sm:text-3xl">
              ${deal.priceFrom}
            </p>
          </div>

          <Link
            href={`/flights?destination=${encodeURIComponent(deal.city)}`}
            aria-label={`View flights to ${deal.city}`}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function NavButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous deals" : "Next deals"}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-secondary shadow-sm transition-all duration-200 hover:border-border-strong hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted disabled:opacity-70"
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}