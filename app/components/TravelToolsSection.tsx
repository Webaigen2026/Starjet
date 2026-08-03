"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BellRing,
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
  icon: React.ReactNode;
}

const travelTools: TravelTool[] = [
  {
    title: "Flight Search",
    description:
      "Find routes between Haiti, Miami, New York, Boston, and more.",
    href: "/flights",
    imageUrl: "/location/CitadelleLaferriereHaiti.jpg",
    imageAlt: "Scenic travel destination representing StarJet flight search",
    icon: <PlaneTakeoff className="h-5 w-5" aria-hidden="true" />,
  },
  {
    title: "Manage Booking",
    description:
      "Review your itinerary, update your trip, and manage your reservation.",
    href: "/manage-booking",
    imageUrl: "/location/CitadelleLaferriereHaiti.jpg",
    imageAlt: "Traveler destination representing airline booking management",
    icon: <Luggage className="h-5 w-5" aria-hidden="true" />,
  },
  {
    title: "Cargo Services",
    description:
      "Ship packages and cargo securely between Haiti and the United States.",
    href: "/cargo",
    imageUrl: "/location/CitadelleLaferriereHaiti.jpg",
    imageAlt: "Travel destination representing StarJet cargo services",
    icon: <PackageCheck className="h-5 w-5" aria-hidden="true" />,
  },
  {
    title: "Flight Alerts",
    description:
      "Stay informed with important departure, arrival, and schedule updates.",
    href: "/flight-alerts",
    imageUrl: "/location/CitadelleLaferriereHaiti.jpg",
    imageAlt: "Travel destination representing airline flight alerts",
    icon: <BellRing className="h-5 w-5" aria-hidden="true" />,
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
      track.scrollLeft + track.clientWidth >=
        track.scrollWidth - tolerance,
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
    <section className="overflow-hidden bg-background py-14 sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 xl:px-16">
        {/* Heading */}
        <div className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <h2 className="section-title text-primary lg:text-[clamp(1.75rem,1.2rem+1.5vw,2.5rem)]">
              Travel with confidence
            </h2>
          </div>

          <Link
            href="/services"
            className="group inline-flex w-fit items-center gap-2 text-sm font-black text-accent transition hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4"
          >
            View all services

            <ChevronRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* Carousel */}
        <div
          ref={trackRef}
          onScroll={updateNavigationState}
          className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 scroll-smooth [scrollbar-width:none] sm:-mx-6 sm:gap-6 sm:px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {travelTools.map((tool) => (
            <TravelToolCard key={tool.title} tool={tool} />
          ))}
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center justify-between">
          <p className="hidden text-sm font-medium text-muted sm:block">
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
      className="group flex w-[88vw] max-w-[390px] shrink-0 snap-start flex-col overflow-hidden rounded-[30px] border border-border bg-surface text-primary shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-accent/40 hover:shadow-2xl hover:shadow-[color:var(--shadow-color)] sm:w-[360px] sm:max-w-none lg:w-[380px] xl:w-[400px]"
    >
      {/* Image */}
      <div className="relative h-56 overflow-hidden bg-surface-muted sm:h-60 lg:h-64">
        <Image
          src={tool.imageUrl}
          alt={tool.imageAlt}
          fill
          sizes="(min-width: 1280px) 400px, (min-width: 1024px) 380px, (min-width: 640px) 360px, 88vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Scrim over the photo — stays fixed regardless of theme so the
            badge below stays legible against any image. */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/10 to-transparent" />

        <div className="absolute bottom-5 left-5 inline-flex items-center rounded-full border border-white/25 bg-white/90 px-3 py-1.5 text-xs font-black uppercase tracking-[0.15em] text-slate-950 shadow-sm backdrop-blur">
          StarJet
        </div>
      </div>

      {/* Content */}
      <div className="relative flex flex-1 flex-col px-5 pb-5 pt-9 sm:px-6 sm:pb-6">
        {/* Floating icon — border matches the card surface so it still
            reads as "cut into" the card in both themes. */}
        <div className="absolute -top-7 left-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-surface bg-accent text-accent-foreground shadow-lg shadow-[color:var(--shadow-color)] transition duration-300 group-hover:bg-accent-hover sm:left-6">
          {tool.icon}
        </div>

        <div>
          <h3 className="text-2xl font-black tracking-tight text-primary">
            {tool.title}
          </h3>

          <p className="mt-3 text-sm font-medium leading-6 text-secondary sm:text-base">
            {tool.description}
          </p>
        </div>

        <div className="mt-7 flex items-center justify-between border-t border-border pt-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-black text-accent-foreground transition duration-300 group-hover:bg-accent-hover">
            Explore
            <ChevronRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>

          <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Learn more
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
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-secondary shadow-sm transition-all duration-200 hover:border-accent hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted disabled:opacity-60"
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}