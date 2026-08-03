import TravelImageWall from "../TravelImageWall";
import FlightSearchForm from "../FlightSearchForm";
import HeroAirplaneCutout from "./HeroAirplaneCutout";
import HeroBackground from "./HeroBackground";

export default function HeroSearch() {
  return (
    <section className="relative w-full overflow-x-clip bg-background">
      <div className="mx-auto w-full max-w-[1800px] sm:px-[clamp(0.875rem,2.5vw,2.5rem)] sm:py-[clamp(0.75rem,1.8vw,2rem)]">
        {/*
          The travel image wall is removed below md so mobile receives a
          focused, single-column hero without reserved sidebar space.

          From md to 2xl it appears below the hero. At 2xl it becomes a
          side column.
        */}
        <div className="grid min-w-0 grid-cols-1 gap-[clamp(1.25rem,2.5vw,2.75rem)] 2xl:grid-cols-[minmax(0,1fr)_minmax(22rem,28vw)] 2xl:items-stretch 2xl:gap-10">
          {/* Main hero */}
          <div className="min-w-0">
            <div className="relative">
              {/* Soft ambient glow behind the hero card */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-3 -z-10 rounded-[clamp(2rem,3.5vw,2.75rem)] bg-sky-200/40 blur-3xl dark:bg-cyan-400/10 sm:-inset-5"
              />

              {/* Floating hero card */}
              <div className="hs-hero-card relative isolate overflow-hidden sm:rounded-[clamp(1.5rem,2.8vw,2.25rem)]">
                <HeroBackground />

                {/* Soft atmospheric sky tint */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-sky-500/[0.06] via-transparent to-sky-300/[0.14] dark:from-sky-950/[0.14] dark:to-indigo-400/[0.07]"
                />

                {/* Bottom readability fade */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/35 via-slate-900/[0.08] to-transparent dark:from-black/50 dark:via-slate-950/[0.13]"
                />

                {/* Gentle left-side readability fade */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/[0.12] via-transparent to-transparent dark:from-black/20"
                />

                {/* Soft perimeter dissolve into the page background */}
                <div
                  aria-hidden="true"
                  className="hs-hero-edge-fade pointer-events-none absolute inset-0"
                />

                {/* Faint highlight along the top rim */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/20 to-transparent dark:from-white/[0.06]"
                />

                {/* Hero content */}
                <div
                  className="
                    relative z-10
                    flex min-h-[36rem] flex-col justify-end
                    px-5 pb-5 pt-40

                    sm:min-h-[min(72svh,39rem)]
                    sm:px-[clamp(1.5rem,3vw,3rem)]
                    sm:pb-[clamp(1.5rem,2.5vw,2.25rem)]
                    sm:pt-[clamp(4rem,10vw,7rem)]

                    lg:min-h-[min(72svh,40rem)]
                    xl:min-h-[36rem]
                    2xl:min-h-[44rem]
                  "
                >



           
                  <div className="flex w-full max-w-5xl flex-col gap-6 sm:gap-8">
                    {/* Hero heading — tablet and desktop only */}
                    <header className="hidden sm:block">
                      <h2 className="hero-title max-w-3xl font-heading text-[clamp(2rem,4vw,3.25rem)] font-extrabold leading-[0.94] tracking-[-0.045em] text-white drop-shadow-[0_4px_20px_rgba(15,23,42,0.28)]">
                        Fly Smarter.
                        <br className="lg:hidden" />
                        <span className="lg:ml-2">Travel Better.</span>
                      </h2>
                    </header>

                    {/* Search form */}
                    <div className="relative z-30 w-full">
                      <FlightSearchForm />
                    </div>
                  </div>
                </div>
              </div>

              {/* Foreground airplane */}
              <HeroAirplaneCutout />
            </div>
          </div>

          {/* Travel image wall — stretches to match the adjacent hero card */}
          <aside className="hidden min-w-0 self-stretch md:block">
            <div className="mx-auto h-full w-full max-w-xl overflow-hidden px-2 py-[clamp(1rem,3vw,1.75rem)] sm:max-w-2xl sm:rounded-[clamp(1.25rem,2.2vw,1.75rem)] sm:px-4 md:max-w-3xl 2xl:max-w-none 2xl:px-1 2xl:py-2">
              <TravelImageWall />
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        .hs-hero-card {
          border: 0;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.42),
            inset 0 0 0 1px rgba(255, 255, 255, 0.16),
            0 2px 6px rgba(148, 163, 184, 0.1),
            0 18px 48px -12px rgba(125, 211, 252, 0.38),
            0 40px 90px -28px rgba(148, 163, 184, 0.24);
        }

        .dark .hs-hero-card {
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.09),
            inset 0 0 0 1px rgba(255, 255, 255, 0.05),
            0 2px 8px rgba(0, 0, 0, 0.32),
            0 18px 48px -12px rgba(34, 211, 238, 0.12),
            0 40px 90px -24px rgba(0, 0, 0, 0.5);
        }

        /*
          Fade the outer edge of the background media while keeping the
          center fully visible and sharp.
        */
        .hs-hero-media {
          -webkit-mask-image: radial-gradient(
            ellipse 96% 92% at 50% 42%,
            #000 60%,
            rgba(0, 0, 0, 0.94) 74%,
            rgba(0, 0, 0, 0.58) 87%,
            transparent 100%
          );
          mask-image: radial-gradient(
            ellipse 96% 92% at 50% 42%,
            #000 60%,
            rgba(0, 0, 0, 0.94) 74%,
            rgba(0, 0, 0, 0.58) 87%,
            transparent 100%
          );
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
          -webkit-mask-size: 100% 100%;
          mask-size: 100% 100%;
        }

        .hs-hero-edge-fade {
          background: radial-gradient(
            ellipse 100% 100% at 50% 50%,
            transparent 64%,
            color-mix(in srgb, var(--background) 48%, transparent) 100%
          );
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

        /*
          Foreground airplane positioning and scale.
        */
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

        @keyframes hs-plane-enter {
          from {
            opacity: 0;
            transform:
              translateX(calc(var(--hs-plane-shift, 0px) - 1.5rem))
              translateY(calc(var(--hs-plane-y, 0px) + 16px))
              scale(calc(var(--hs-plane-scale, 1) * 0.96));
          }

          to {
            opacity: 1;
            transform:
              translateX(var(--hs-plane-shift, 0px))
              translateY(var(--hs-plane-y, 0px))
              scale(var(--hs-plane-scale, 1));
          }
        }

        @keyframes hs-plane-float {
          0%,
          100% {
            transform:
              translateX(var(--hs-plane-shift, 0px))
              translateY(var(--hs-plane-y, 0px))
              scale(var(--hs-plane-scale, 1));
          }

          50% {
            transform:
              translateX(var(--hs-plane-shift, 0px))
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
            transform:
              translateX(var(--hs-plane-shift, 0px))
              translateY(var(--hs-plane-y, 0px))
              scale(var(--hs-plane-scale, 1));
          }
        }
      `}</style>
    </section>
  );
}