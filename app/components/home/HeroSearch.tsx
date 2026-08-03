import Image from "next/image";

import TravelImageWall from "../TravelImageWall";
import FlightSearchForm from "../FlightSearchForm";

export default function HeroSearch() {
  return (
    <section className="relative w-full overflow-x-clip bg-background">
      <div className="mx-auto w-full max-w-[1800px]   sm:px-[clamp(0.875rem,2.5vw,2.5rem)] sm:py-[clamp(0.75rem,1.8vw,2rem)] ">
        {/* px-[clamp(0.875rem,2.5vw,2.5rem)] py-[clamp(0.75rem,1.8vw,2rem)] */}
        {/*
          Image wall is dropped entirely below md (not just visually hidden)
          so phones get a single-focus hero with no reserved empty space.
          It reappears stacked below the hero from md to 2xl, then becomes
          a side-by-side sidebar at 2xl so FlightSearchForm keeps a
          full-width desktop grid on laptops.
        */}
        <div className="grid min-w-0 grid-cols-1 gap-[clamp(1.25rem,2.5vw,2.75rem)] 2xl:grid-cols-[minmax(0,1fr)_minmax(22rem,28vw)] 2xl:items-stretch 2xl:gap-10">
          {/* Main hero */}
          <div className="min-w-0">
            {/* Outer wrapper has no overflow-hidden of its own — it exists
                so the foreground plane cutout below can be positioned
                against the same box as the clipped card, while still being
                free to bleed past its right edge. The outer <section>
                keeps overflow-x-clip, so this never causes page scroll. */}
            <div className="relative">
              {/* Clipped card: background photo, atmospheric + legibility
                  layers, and all interactive content live inside this
                  rounded, overflow-hidden box. Softer slate-900 base
                  (instead of near-black slate-950) reads as an elevated
                  surface rather than a harsh void, closer to how Stripe/
                  Apple treat dark hero panels. Two stacked shadows — a
                  tight contact shadow plus a large soft ambient one — give
                  the card real depth without looking heavy. */}
              <div className="relative isolate overflow-hidden  sm:rounded-[clamp(1.25rem,2.2vw,1.75rem)]   ">

{/* rounded-[clamp(1.25rem,2.2vw,1.75rem)] bg-slate-900  */}


                {/* shadow-[0_2px_8px_rgba(2,6,23,0.25),0_32px_90px_-24px_rgba(2,6,23,0.6)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),0_32px_90px_-24px_rgba(0,0,0,0.85)] */}
                {/* Background image */}
                <Image
                  src="/airplane/hero_day_bg.png"
                  alt="A StarJet aircraft cruising above the clouds at sunset"
                  fill
                  priority
                  sizes="
                    (min-width: 1536px) min(1800px - 28vw - 5rem, calc(100vw - 28vw - 5rem)),
                    (min-width: 1024px) calc(100vw - 5rem),
                    100vw
                  "
                  className="hs-hero-image object-cover object-[center_32%] sm:object-[center_28%]"
                />

                {/* Premium sky glow: a faint cool-to-warm atmospheric tint
                    across the whole photo, tying the palette's sky-blue
                    accent into the hero itself before any darkening
                    happens. Kept very low-opacity — a wash, not a filter. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-tr from-sky-500/10 via-transparent to-sky-300/20"
                />

                {/* Directional legibility wash: dark enough at the bottom
                    for the headline and form to always read clearly, fully
                    transparent by the upper third so the sky stays bright
                    and the image doesn't feel dimmed as a whole. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/20 to-transparent"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-r from-slate-950/25 via-transparent to-transparent"
                />

                {/* Hero content */}
                <div className="relative z-10 flex min-h-[min(100svh,52rem)] flex-col justify-end px-[clamp(1rem,3vw,3rem)] pb-[clamp(1rem,2.5vw,2.5rem)] pt-[clamp(5.5rem,14vw,9rem)] sm:min-h-[min(88svh,48rem)] lg:min-h-[min(82svh,46rem)] xl:min-h-[42rem] 2xl:min-h-[44rem]">
                  <div className="flex w-full min-w-0 flex-col gap-[clamp(1.25rem,2.8vw,2.5rem)]">
                    <header className="max-w-4xl">
                      {/* Heavier weight, tighter tracking, and an elegant
                          drop shadow instead of a flat solid fill — reads
                          as confident and premium against the photo rather
                          than merely "readable". */}
                      <h1 className="hero-title max-w-[18ch] text-balance font-black tracking-tight text-white drop-shadow-[0_4px_18px_rgba(15,23,42,0.35)] sm:max-w-none lg:whitespace-nowrap">
                        Fly Smarter. Travel Better.
                      </h1>
                    </header>

                    {/* Form placement only — component logic untouched */}
                    <div className="w-full min-w-0 max-w-full">
                      <FlightSearchForm />
                    </div>
                  </div>
                </div>
              </div>

              {/* Foreground plane cutout — layered on top of the card.
                  All positioning/sizing math (shift, vertical nudge, scale)
                  lives in the .hs-plane rule in the <style> block below —
                  not here as utility classes — because the mobile values
                  need to be fluid (a calc()-based linear interpolation
                  across the 320–639px range), which is awkward and hard to
                  read as a Tailwind arbitrary-value class. Everything is
                  still funneled through the same --hs-plane-* custom
                  properties consumed inside the animation keyframes, so
                  nothing here fights with the entrance/float animation's
                  own `transform` writes. */}
              <div
                aria-hidden="true"
                className="hs-plane pointer-events-none absolute inset-0 z-20"
              >
                {/* Atmospheric tint matched to the sky glow above, so the
                    cutout reads as part of the same light environment as
                    the background instead of a flat sticker pasted on top. */}
                {/* <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/5 via-transparent to-sky-300/10 mix-blend-soft-light" /> */}

                <Image
                  src="/airplane/airplane_day_wt_bg.png"
                  alt=""
                  fill
                  sizes="
                    (min-width: 1536px) min(1800px - 28vw - 5rem, calc(100vw - 28vw - 5rem)),
                    (min-width: 1024px) calc(100vw - 5rem),
                    100vw
                  "
                  className="object-contain object-top drop-shadow-[0_20px_35px_rgba(15,23,42,0.35)] sm:object-cover sm:object-[72%_28%]"
                />
              </div>
            </div>
          </div>

          {/* Travel image wall — hidden entirely below md */}
          <aside className="hidden min-w-0 self-stretch md:block">
            <div className="mx-auto flex h-full w-full max-w-xl items-center justify-center overflow-hidden rounded-[clamp(1.25rem,2.2vw,1.75rem)] px-2 py-[clamp(1rem,3vw,1.75rem)] sm:max-w-2xl sm:px-4 md:max-w-3xl 2xl:max-w-none 2xl:px-1 2xl:py-2">
              {/* Top padding offsets TravelImageWall’s upward translates without editing it */}
              <div className="w-full">
                <TravelImageWall />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Scoped hero-only animations, mirroring the naming convention used
          in TravelImageWall (prefixed to avoid colliding with other
          components' global styles). */}
      <style>{`
        @keyframes hs-ken-burns {
          from {
            transform: scale(1.08);
          }
          to {
            transform: scale(1);
          }
        }

        .hs-hero-image {
          animation: hs-ken-burns 14s ease-out forwards;
        }

        /* --hs-plane-shift / --hs-plane-y / --hs-plane-scale drive the
           plane cutout's position and size. Below 640px they're fluid,
           linearly interpolated across a 320–639px reference range using
           calc()'s length-divided-by-length trick to get a unitless
           multiplier (100vw - 320px) / 319px goes from 0 at a 320px-wide
           phone to 1 at a 639px-wide one) — so the plane scales and nudges
           smoothly across small phones, large phones, and phablets alike,
           instead of jumping straight from one fixed mobile value to the
           sm+ desktop value. clamp() guards both ends for anything
           narrower than 320px or briefly wider than 639px.
           Tune the two endpoint numbers in each clamp() (not the vw math)
           if the fit needs adjusting on a real device. */
        .hs-plane {
          --hs-plane-shift: 0px;
          --hs-plane-y: clamp(
            -56px,
            calc(-32px - 24px * ((100vw - 320px) / 319px)),
            -20px
          );
          --hs-plane-scale: clamp(
            0.85,
            calc(0.85 + 0.25 * ((100vw - 320px) / 319px)),
            1.1
          );
        }

        @media (min-width: 640px) {
          .hs-plane {
            --hs-plane-shift: 4rem;
            --hs-plane-y: -80px;
            --hs-plane-scale: 1;
          }
        }

        @media (min-width: 1024px) {
          .hs-plane {
            --hs-plane-shift: 6rem;
          }
        }

        @media (min-width: 1280px) {
          .hs-plane {
            --hs-plane-shift: 8rem;
          }
        }

        /* Plane cutout: rises/fades in on load, holding at its responsive
           --hs-plane-shift / --hs-plane-y / --hs-plane-scale values, then
           settles into a slow, gentle float — same entrance-then-drift
           language as TravelImageWall's circles. */
        @keyframes hs-plane-enter {
          from {
            opacity: 0;
            transform: translateX(calc(var(--hs-plane-shift, 0px) - 1.5rem))
              translateY(calc(var(--hs-plane-y, 0px) + 16px))
              scale(calc(var(--hs-plane-scale, 1) * 0.96));
          }
          to {
            opacity: 1;
            transform: translateX(var(--hs-plane-shift, 0px))
              translateY(var(--hs-plane-y, 0px))
              scale(var(--hs-plane-scale, 1));
          }
        }

        @keyframes hs-plane-float {
          0%,
          100% {
            transform: translateX(var(--hs-plane-shift, 0px))
              translateY(var(--hs-plane-y, 0px))
              scale(var(--hs-plane-scale, 1));
          }
          50% {
            transform: translateX(var(--hs-plane-shift, 0px))
              translateY(calc(var(--hs-plane-y, 0px) - 10px))
              scale(var(--hs-plane-scale, 1));
          }
        }

        .hs-plane {
          opacity: 0;
          animation:
            hs-plane-enter 1s cubic-bezier(0.16, 1, 0.3, 1) forwards,
            hs-plane-float 7s ease-in-out infinite;
          animation-delay: 0.3s, 1.3s;
        }

        @media (prefers-reduced-motion: reduce) {
          .hs-hero-image {
            animation: none;
          }

          .hs-plane {
            opacity: 1;
            animation: none;
            transform: translateX(var(--hs-plane-shift, 0px))
              translateY(var(--hs-plane-y, 0px))
              scale(var(--hs-plane-scale, 1));
          }
        }
      `}</style>
    </section>
  );
}