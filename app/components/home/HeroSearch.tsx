import Image from "next/image";

import TravelImageWall from "../TravelImageWall";
import FlightSearchForm from "../FlightSearchForm";

export default function HeroSearch() {
  return (
    <section className="relative w-full overflow-x-clip bg-background">
      <div className="mx-auto w-full max-w-[1800px] px-[clamp(0.875rem,2.5vw,2.5rem)] py-[clamp(0.75rem,1.8vw,2rem)]">
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
              {/* Clipped card: background photo, legibility gradients, and
                  all interactive content live inside this rounded,
                  overflow-hidden box. */}
              <div className="relative isolate overflow-hidden rounded-[clamp(1.25rem,2.2vw,1.75rem)] bg-slate-950 shadow-[0_24px_80px_-28px_rgba(2,6,23,0.55)] dark:shadow-[0_24px_80px_-28px_rgba(0,0,0,0.75)]">
                {/* Background image */}
                <Image
                  src="/airplane/hero_bg.png"
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

                {/* Directional wash: guarantees text legibility at the bottom
                    while leaving the sunset sky untouched near the top. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-transparent"
                />

                {/* Hero content */}
                <div className="relative z-10 flex min-h-[min(100svh,52rem)] flex-col justify-end px-[clamp(1rem,3vw,3rem)] pb-[clamp(1rem,2.5vw,2.5rem)] pt-[clamp(5.5rem,14vw,9rem)] sm:min-h-[min(88svh,48rem)] lg:min-h-[min(82svh,46rem)] xl:min-h-[42rem] 2xl:min-h-[44rem]">
                  <div className="flex w-full min-w-0 flex-col gap-[clamp(1.25rem,2.8vw,2.5rem)]">
                    <header className="max-w-4xl">
                      <h1 className="hero-title max-w-[18ch] text-balance text-white sm:max-w-none lg:whitespace-nowrap">
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

              {/* Foreground plane cutout — layered on top of the card and
                  shifted right so it bleeds past the rounded frame's edge.
                  Kept outside the overflow-hidden wrapper above (that's
                  what actually lets it exceed to the right — with it
                  inside, overflow-hidden would just clip the offset away).

                  The horizontal offset lives in --hs-plane-shift (a CSS
                  custom property, responsive per breakpoint) instead of a
                  translate-x utility class, because the entrance + float
                  animation below also writes to `transform`. Keeping both
                  on separate mechanisms would have the animation silently
                  overwrite the static offset; folding the offset into the
                  keyframes themselves via the custom property keeps both
                  working together. */}
              <div
                aria-hidden="true"
                className="hs-plane pointer-events-none absolute inset-0 z-20 [--hs-plane-shift:2.5rem] sm:[--hs-plane-shift:4rem] lg:[--hs-plane-shift:6rem] xl:[--hs-plane-shift:8rem]"
              >
                <Image
                  src="/airplane/airplane_wt_bg.png"
                  alt=""
                  fill
                  sizes="
                    (min-width: 1536px) min(1800px - 28vw - 5rem, calc(100vw - 28vw - 5rem)),
                    (min-width: 1024px) calc(100vw - 5rem),
                    100vw
                  "
                  className="object-cover object-[center_32%] sm:object-[center_28%] mt-[-80px]"
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

        /* Plane cutout: rises/fades in on load, holding at its responsive
           --hs-plane-shift offset, then settles into a slow, gentle float —
           same entrance-then-drift language as TravelImageWall's circles. */
        @keyframes hs-plane-enter {
          from {
            opacity: 0;
            transform: translateX(calc(var(--hs-plane-shift, 0px) - 1.5rem))
              translateY(16px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateX(var(--hs-plane-shift, 0px)) translateY(0)
              scale(1);
          }
        }

        @keyframes hs-plane-float {
          0%,
          100% {
            transform: translateX(var(--hs-plane-shift, 0px)) translateY(0);
          }
          50% {
            transform: translateX(var(--hs-plane-shift, 0px)) translateY(-10px);
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
            transform: translateX(var(--hs-plane-shift, 0px));
          }
        }
      `}</style>
    </section>
  );
}