"use client";

import Image from "next/image";

export default function TravelPromoSection() {
  return (
    <section className="bg-background py-12 sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.7fr)] lg:gap-12 xl:gap-16">
          {/* Decorative traveler artwork */}
          <div className="order-2 flex justify-center lg:order-1 lg:justify-end">
            <Image
              src="/airplane/avatars.png"
              alt="Travelers preparing for their next trip"
              width={500}
              height={500}
              sizes="
                (max-width: 639px) 240px,
                (max-width: 1023px) 320px,
                380px
              "
              className="
                h-auto
                w-full
                max-w-[240px]
                object-contain
                sm:max-w-[320px]
                lg:max-w-[380px]
              "
            />
          </div>

          {/* Promotional content */}
          <div className="order-1 min-w-0 lg:order-2">
            <PromoCard />
          </div>
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