import TravelImageWall from "../TravelImageWall";
import FlightSearchForm from "../FlightSearchForm";
import HeroAirplaneCutout from "./HeroAirplaneCutout";
import HeroBackground from "./HeroBackground";

export default function HeroSearch() {
  return (
    <section className="relative w-full overflow-x-clip bg-background">
      <div className="mx-auto w-full max-w-[1800px] sm:px-[clamp(0.5rem,1vw,1rem)] sm:py-[clamp(0.75rem,1.8vw,2rem)]">
        {/*
          Mobile: only the main hero is rendered.
          md–2xl: the image wall appears below the hero.
          2xl+: the image wall becomes a side column.
        */}
        <div className="grid min-w-0 grid-cols-1 gap-[clamp(1.25rem,2.5vw,2.75rem)] bg-[#EDF1F4] dark:bg-surface sm:rounded-3xl sm:p-10 2xl:grid-cols-[minmax(0,1fr)_minmax(22rem,28vw)] 2xl:items-stretch 2xl:gap-10">
          {/* Main hero */}
          <div className="min-w-0">
            <div className="relative">
              {/* Hero card */}
              <div className="hs-hero-card relative isolate overflow-hidden sm:rounded-[clamp(1rem,2vw,1.5rem)]">
                <HeroBackground />

                {/* Subtle bottom wash for form readability */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent dark:from-[#140227]/35"
                />

                {/* Hero content */}
                <div
                  className="
                    relative z-20
                    flex min-h-[36rem] flex-col justify-end
                    px-5 pb-5 pt-40

                    sm:min-h-[min(72svh,39rem)]
                    sm:pb-[clamp(1.5rem,2.5vw,2.25rem)]
                    sm:pt-[clamp(4rem,10vw,7rem)]

                    lg:min-h-[38rem]
                    xl:min-h-[36rem]
                    2xl:min-h-[40rem]
                  "
                >
                  <div className="flex w-full max-w-5xl flex-col gap-6 sm:gap-8">
                    {/* Search form */}
                    <div className="relative z-30 w-full">
                      <FlightSearchForm />
                    </div>
                  </div>
                </div>
              </div>

           {/* Foreground airplane */}
{/* Foreground airplane */}
<div
  aria-hidden="true"
  className="
    pointer-events-none
    absolute inset-0
    z-40
    overflow-visible

    -translate-y-[5rem]

    md:translate-y-0
    mr-20
   md:mr-0
   
  "
>
  <HeroAirplaneCutout />
</div>
            </div>
          </div>

          {/* Travel image wall */}
          <aside className="hidden min-w-0 self-stretch md:block">
            <div className="mx-auto h-full w-full max-w-xl overflow-hidden px-2 py-[clamp(1rem,3vw,1.75rem)] sm:max-w-2xl sm:rounded-[clamp(1.25rem,2.2vw,1.75rem)] sm:px-4 md:max-w-3xl 2xl:max-w-none 2xl:px-1 2xl:py-2">
              <TravelImageWall />
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        /* ------------------------------------------------------------------ */
        /* Hero card                                                          */
        /* ------------------------------------------------------------------ */

        .hs-hero-card {
          border: 0;
          background: #edf1f4;
          box-shadow:
            -20px -20px 28px var(--neu-highlight),
            20px 20px 28px var(--neu-shadow);
        }

        .dark .hs-hero-card {
          background: var(--surface);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            0 18px 45px -20px rgba(229, 46, 122, 0.18);
        }

        /* ------------------------------------------------------------------ */
        /* Background image                                                   */
        /* ------------------------------------------------------------------ */

        .hs-hero-media {
          -webkit-mask-image: radial-gradient(
            ellipse 98% 94% at 50% 44%,
            #000 65%,
            rgba(0, 0, 0, 0.96) 78%,
            rgba(0, 0, 0, 0.72) 90%,
            transparent 100%
          );
          mask-image: radial-gradient(
            ellipse 98% 94% at 50% 44%,
            #000 65%,
            rgba(0, 0, 0, 0.96) 78%,
            rgba(0, 0, 0, 0.72) 90%,
            transparent 100%
          );
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
          -webkit-mask-size: 100% 100%;
          mask-size: 100% 100%;
        }

        @keyframes hs-ken-burns {
          from {
            transform: scale(1.07);
          }

          to {
            transform: scale(1);
          }
        }

        .hs-hero-image {
          animation: hs-ken-burns 14s ease-out forwards;
        }

        /* ------------------------------------------------------------------ */
        /* Centered foreground airplane                                       */
        /* ------------------------------------------------------------------ */

        .hs-plane {
          /*
            The element starts at the horizontal center of the hero.
            translateX(-50%) centers its own width around that point.
          */
          left: 50%;
          width: 100%;
          transform-origin: center center;

          --hs-plane-x: 0px;
          --hs-plane-y: -7.5rem;
          --hs-plane-scale: 0.92;

          opacity: 0;
          animation:
            hs-plane-enter 1s cubic-bezier(0.16, 1, 0.3, 1) forwards,
            hs-plane-float 7s ease-in-out infinite;
          animation-delay: 0.3s, 1.3s;
        }

        @media (min-width: 640px) {
          .hs-plane {
            --hs-plane-y: -6rem;
            --hs-plane-scale: 0.96;
          }
        }

        @media (min-width: 1024px) {
          .hs-plane {
            --hs-plane-y: -5rem;
            --hs-plane-scale: 1;
          }
        }

        @media (min-width: 1280px) {
          .hs-plane {
            --hs-plane-y: -4.5rem;
            --hs-plane-scale: 1;
          }
        }

        @keyframes hs-plane-enter {
          from {
            opacity: 0;
            transform:
              translateX(
                calc(-50% + var(--hs-plane-x, 0px) - 1.5rem)
              )
              translateY(calc(var(--hs-plane-y, 0px) + 16px))
              scale(calc(var(--hs-plane-scale, 1) * 0.96));
          }

          to {
            opacity: 1;
            transform:
              translateX(calc(-50% + var(--hs-plane-x, 0px)))
              translateY(var(--hs-plane-y, 0px))
              scale(var(--hs-plane-scale, 1));
          }
        }

        @keyframes hs-plane-float {
          0%,
          100% {
            transform:
              translateX(calc(-50% + var(--hs-plane-x, 0px)))
              translateY(var(--hs-plane-y, 0px))
              scale(var(--hs-plane-scale, 1));
          }

          50% {
            transform:
              translateX(calc(-50% + var(--hs-plane-x, 0px)))
              translateY(calc(var(--hs-plane-y, 0px) - 10px))
              scale(var(--hs-plane-scale, 1));
          }
        }

        /* ------------------------------------------------------------------ */
        /* Reduced motion                                                     */
        /* ------------------------------------------------------------------ */

        @media (prefers-reduced-motion: reduce) {
          .hs-hero-image {
            animation: none;
          }

          .hs-plane {
            opacity: 1;
            animation: none;
            transform:
              translateX(calc(-50% + var(--hs-plane-x, 0px)))
              translateY(var(--hs-plane-y, 0px))
              scale(var(--hs-plane-scale, 1));
          }
        }
      `}</style>
    </section>
  );
}