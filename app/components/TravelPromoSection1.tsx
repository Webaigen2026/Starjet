"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  Bell,
  MessageCircleMore,
  Pause,
  PlaneTakeoff,
  Play,
} from "lucide-react";

const routeCodes = ["BOS", "MIA", "CAP", "PAP"];

const searchStats = [
  { initials: "MJ" },
  { initials: "RD" },
  { initials: "KL" },
];

export default function TravelPromoSection() {
  return (
    <section className="bg-background py-10 sm:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10">
        <PromoCard />

        <div className="mt-4 grid gap-4 sm:mt-5 sm:grid-cols-3">
          {/* Add stat cards here later */}
        </div>
      </div>
    </section>
  );
}

function PromoCard() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  async function toggleVideo() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      try {
        await video.play();
      } catch (error) {
        console.error("The video could not be played:", error);
      }
    } else {
      video.pause();
    }
  }

  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-[32px]
        bg-white
        p-4
        shadow-[-18px_-18px_30px_var(--color-neu-highlight),18px_18px_30px_var(--color-neu-shadow)]
        sm:p-6
        lg:p-8
      "
    >
      <span
        className="
          absolute
          right-4
          top-4
          z-20
          rounded-md
          px-2
          py-1
          text-[10px]
          font-bold
          uppercase
          tracking-wide
          text-black
        "
      >
        Featured
      </span>

      <div className="flex flex-col items-center gap-6 lg:flex-row lg:gap-10">
        {/* Video */}
        <div
          className="
            relative
            w-full
            shrink-0
            overflow-hidden
            rounded-3xl
            bg-surface
            lg:w-[400px]
            lg:h-[300px]
          "
        >
          <video
            ref={videoRef}
            src="/videos/airplane.mp4"
            muted
            playsInline
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            className="
              aspect-video
              h-auto
              w-full
              object-cover
              lg:aspect-square
            "
          />

          {/* Paused overlay */}
          <div
            aria-hidden="true"
            className={`
              pointer-events-none
              absolute
              inset-0
              bg-black/20
              transition-opacity
              duration-300
              ${isPlaying ? "opacity-0" : "opacity-100"}
            `}
          />

          {/* Main play/pause control */}
          {/* <button
            type="button"
            onClick={toggleVideo}
            aria-label={isPlaying ? "Pause video" : "Play video"}
            aria-pressed={isPlaying}
            className="
              absolute
              left-1/2
              top-1/2
              z-10
              flex
              h-16
              w-16
              -translate-x-1/2
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              border
              border-white/70
              bg-white/90
              text-[#020E63]
              shadow-[0_12px_30px_rgba(0,0,0,0.28)]
              backdrop-blur-md
              transition
              duration-200
              hover:scale-105
              hover:bg-white
              focus-visible:outline-none
              focus-visible:ring-4
              focus-visible:ring-white/60
              active:scale-95
            "
          >
            {isPlaying ? (
              <Pause
                className="h-7 w-7 fill-current"
                aria-hidden="true"
              />
            ) : (
              <Play
                className="ml-1 h-7 w-7 fill-current"
                aria-hidden="true"
              />
            )}
          </button> */}

          {/* Bottom control */}
          <button
            type="button"
            onClick={toggleVideo}
            className="
              absolute
              bottom-4
              left-4
              z-10
              inline-flex
              items-center
              gap-2
              rounded-full
              bg-black/55
              px-4
              py-2
              text-xs
              font-bold
              text-white
              backdrop-blur-md
              transition
              hover:bg-black/70
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-white
            "
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4" aria-hidden="true" />
                Pause video
              </>
            ) : (
              <>
                <Play className="h-4 w-4" aria-hidden="true" />
                Play video
              </>
            )}
          </button>
        </div>

        {/* Text content */}
        <div className="flex-1">
          <h2 className="text-2xl font-black tracking-tight text-black sm:text-3xl">
            Missed the fare drop again?
          </h2>

          <p className="mt-3 max-w-md text-sm leading-6 text-black sm:text-base">
            Turn on Flight Alerts and we&apos;ll ping you the moment prices on
            your route change — no more digging through old texts to remember
            what you paid last time.
          </p>

          <Link
            href="/flight-alerts"
            className="
              mt-5
              inline-flex
              items-center
              justify-center
              rounded-full
              bg-accent
              px-6
              py-3
              text-sm
              font-black
              text-black
              transition
              hover:bg-accent-hover
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-accent
              focus-visible:ring-offset-2
            "
          >
            Turn on alerts
          </Link>
        </div>
      </div>
    </div>
  );
}

function PromoIllustration() {
  return (
    <div className="relative flex h-40 w-full shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-border bg-accent-muted sm:h-48 lg:h-52 lg:w-64">
      <PlaneTakeoff
        className="h-16 w-16 text-accent/40 sm:h-20 sm:w-20"
        aria-hidden="true"
      />

      <span className="absolute left-6 top-6 flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold text-black shadow-sm">
        <Bell className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
        $109
      </span>

      <span className="absolute bottom-7 right-6 flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold text-black shadow-sm">
        <MessageCircleMore
          className="h-3.5 w-3.5 text-accent"
          aria-hidden="true"
        />
        Price drop
      </span>
    </div>
  );
}