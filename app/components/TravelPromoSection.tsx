"use client";

import { useRef, useState } from "react";
import {
  Bell,
  MessageCircleMore,
  Pause,
  PlaneTakeoff,
  Play,
  Star,
} from "lucide-react";
import Image from "next/image";
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
          <StatCard
            badge={
              <div className="flex -space-x-2">
                {routeCodes.map((code) => (
                  <span
                    key={code}
                    className="
                      flex h-9 w-9 items-center justify-center
                      rounded-full border-2 border-surface
                      bg-accent-muted text-[10px] font-black
                      tracking-tight text-black
                    "
                  >
                    {code}
                  </span>
                ))}
              </div>
            }
            title="Compare every route"
            caption="Haiti, Miami, Boston, New York — one search."
          />

          <StatCard
            badge={
              <div className="flex -space-x-2">
                {searchStats.map((person) => (
                  <span
                    key={person.initials}
                    className="
                      flex h-9 w-9 items-center justify-center
                      rounded-full border-2 border-surface
                      bg-white-muted text-[11px] font-black
                      text-black
                    "
                  >
                    {person.initials}
                  </span>
                ))}
              </div>
            }
            title="10,000+"
            caption="searches this week"
          />

          <StatCard
            badge={
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className="h-5 w-5 fill-accent text-black"
                    aria-hidden="true"
                  />
                ))}
              </div>
            }
            title="Travelers love us"
            caption="Real reviews from real trips."
          />
        </div>
      </div>
    </section>
  );
}

function PromoCard() {
  return (
    <article
      className="
        relative
        overflow-hidden
        rounded-[28px]
        bg-white
        p-4
        shadow-[-6px_-6px_14px_var(--color-neu-highlight),6px_6px_14px_var(--color-neu-shadow)]

        sm:rounded-[32px]
        sm:p-6

        lg:p-8

        dark:bg-surface
        dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_50px_-24px_rgba(0,0,0,0.55)]
      "
    >
      <div className="grid items-center gap-7 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-10">
        <PromoImage />

        <div className="min-w-0 text-center lg:text-left">
    

          <h2
            className="
              text-balance
              text-2xl
              font-black
              leading-tight
              tracking-[-0.035em]
              text-black

              sm:text-3xl
              lg:text-4xl

              dark:text-white
            "
          >
            Missed the fare drop again?
          </h2>

          <p
            className="
              mx-auto
              mt-4
              max-w-xl
              text-sm
              leading-6
              text-black/75

              sm:text-base
              sm:leading-7

              lg:mx-0

              dark:text-white/75
            "
          >
            Turn on Flight Alerts and we&apos;ll notify you the moment prices
            change on your route—so you can book at the right time without
            repeatedly checking.
          </p>
        </div>
      </div>
    </article>
  );
}

function PromoImage() {
  return (
    <div
      className="
        group
        relative
        aspect-[4/3]
        w-full
        overflow-hidden
        rounded-[24px]
        bg-surface
        shadow-[0_14px_40px_rgba(15,23,42,0.12)]

        sm:rounded-[28px]

        lg:h-[300px]
        lg:aspect-auto
      "
    >
      <Image
        src="/airplane/boston.webp"
        alt="Aerial view of Boston"
        fill
        priority
        sizes="
          (max-width: 639px) calc(100vw - 4rem),
          (max-width: 1023px) calc(100vw - 6rem),
          400px
        "
        className="
          object-cover
          object-center
          transition-transform
          duration-700
          ease-out
          motion-safe:group-hover:scale-105
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0
          bg-gradient-to-t
          from-black/20
          via-transparent
          to-white/[0.05]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0
          rounded-[inherit]
          ring-1
          ring-inset
          ring-white/25
        "
      />
    </div>
  );
}
function PromoIllustration() {
  return (
    <div className="relative flex h-40 w-full shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-border bg-accent-muted sm:h-48 lg:h-52 lg:w-64">
      <PlaneTakeoff
        className="h-16 w-16 text-black/40 sm:h-20 sm:w-20"
        aria-hidden="true"
      />

      <span className="absolute left-6 top-6 flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-bold text-black shadow-sm">
        <Bell className="h-3.5 w-3.5 text-black" aria-hidden="true" />
        $109
      </span>

      <span className="absolute bottom-7 right-6 flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-bold text-black shadow-sm">
        <MessageCircleMore
          className="h-3.5 w-3.5 text-black"
          aria-hidden="true"
        />
        Price drop
      </span>
    </div>
  );
}

function StatCard({
  badge,
  title,
  caption,
}: {
  badge: React.ReactNode;
  title: string;
  caption: string;
}) {
  return (
    <div
      className="
        rounded-3xl bg-white p-6
        shadow-[-10px_-10px_18px_var(--color-neu-highlight),10px_10px_18px_var(--color-neu-shadow)]
        dark:bg-white
      "
    >
      {badge}

      <p className="mt-4 text-xl font-black tracking-tight text-black sm:text-2xl">
        {title}
      </p>

      <p className="mt-1 text-sm font-medium text-black">{caption}</p>
    </div>
  );
}