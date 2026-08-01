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
    <section className="overflow-hidden bg-white py-14 sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 xl:px-16">
        {/* Heading */}
        <div className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
         

            <h2 className="section-title text-slate-950 lg:text-[clamp(1.75rem,1.2rem+1.5vw,2.5rem)]">
              Travel with confidence
            </h2>

          </div>

          <Link
            href="/services"
            className="group inline-flex w-fit items-center gap-2 text-sm font-black text-cyan-700 transition hover:text-cyan-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-4"
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
          <p className="hidden text-sm font-medium text-slate-500 sm:block">
            Swipe or use the arrows to explore StarJet services.
          </p>

          <div className="ml-auto flex gap-2">
            <NavigationButton
              direction="previous"
              disabled={atStart}
              onClick={() => scrollCards("previous")}
            />

            <NavigationButton
              direction="next"
              disabled={atEnd}
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
      className="group flex w-[88vw] max-w-[390px] shrink-0 snap-start flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white text-slate-950 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-cyan-300 hover:shadow-2xl hover:shadow-slate-950/10 sm:w-[360px] sm:max-w-none lg:w-[380px] xl:w-[400px]"
    >
      {/* Image */}
      <div className="relative h-56 overflow-hidden bg-slate-100 sm:h-60 lg:h-64">
        <Image
          src={tool.imageUrl}
          alt={tool.imageAlt}
          fill
          sizes="(min-width: 1280px) 400px, (min-width: 1024px) 380px, (min-width: 640px) 360px, 88vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/10 to-transparent" />

        <div className="absolute bottom-5 left-5 inline-flex items-center rounded-full border border-white/25 bg-white/90 px-3 py-1.5 text-xs font-black uppercase tracking-[0.15em] text-slate-950 shadow-sm backdrop-blur">
          StarJet
        </div>
      </div>

      {/* Content */}
      <div className="relative flex flex-1 flex-col px-5 pb-5 pt-9 sm:px-6 sm:pb-6">
        {/* Floating icon */}
        <div className="absolute -top-7 left-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-white bg-cyan-600 text-white shadow-lg shadow-cyan-950/20 transition duration-300 group-hover:bg-slate-950 sm:left-6">
          {tool.icon}
        </div>

        <div>
          <h3 className="text-2xl font-black tracking-tight text-slate-950">
            {tool.title}
          </h3>

          <p className="mt-3 text-sm font-medium leading-6 text-slate-600 sm:text-base">
            {tool.description}
          </p>
        </div>

        <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition duration-300 group-hover:bg-cyan-600">
            Explore
            <ChevronRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>

          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
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
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-950 hover:bg-slate-950 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300 disabled:opacity-60"
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}