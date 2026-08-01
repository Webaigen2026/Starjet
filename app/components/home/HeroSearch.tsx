import Image from "next/image";

import TravelImageWall from "../TravelImageWall";
import FlightSearchForm from "../FlightSearchForm";

export default function HeroSearch() {
  return (
    <section className="relative w-full overflow-x-clip bg-white">
      <div className="mx-auto w-full max-w-[1800px] px-[clamp(0.875rem,2.5vw,2.5rem)] py-[clamp(0.75rem,1.8vw,2rem)]">
        {/*
          Stack the image wall under the booking hero until 2xl so
          FlightSearchForm keeps a full-width desktop grid on laptops.
        */}
        <div className="grid min-w-0 grid-cols-1 gap-[clamp(1.25rem,2.5vw,2.75rem)] 2xl:grid-cols-[minmax(0,1fr)_minmax(22rem,28vw)] 2xl:items-stretch 2xl:gap-10">
          {/* Main hero */}
          <div className="min-w-0">
            <div className="relative isolate overflow-hidden rounded-[clamp(1.25rem,2.2vw,1.75rem)] bg-slate-950 shadow-[0_24px_80px_-28px_rgba(2,6,23,0.55)]">
              {/* Background image */}
              <Image
                src="/airplane/airplane1.jpg"
                alt="Coastal destination along the Haitian shoreline"
                fill
                priority
                sizes="
                  (min-width: 1536px) min(1800px - 28vw - 5rem, calc(100vw - 28vw - 5rem)),
                  (min-width: 1024px) calc(100vw - 5rem),
                  100vw
                "
                className="object-cover object-[center_32%] sm:object-[center_28%]"
              />

              {/* Soft atmospheric wash */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-slate-950/15"
              />

              {/* Bottom readability for headline + form */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/55 to-slate-950/10"
              />

              {/* Left vignette on larger screens */}
              <div
                aria-hidden="true"
                className="absolute inset-0 hidden bg-gradient-to-r from-slate-950/55 via-transparent to-transparent lg:block"
              />

              {/* Subtle top edge balance */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-slate-950/35 to-transparent"
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
          </div>

          {/* Travel image wall — placement / sizing only */}
          <aside className="min-w-0 self-stretch">
            <div className="mx-auto flex h-full w-full max-w-xl items-center justify-center overflow-hidden rounded-[clamp(1.25rem,2.2vw,1.75rem)]  px-2 py-[clamp(1rem,3vw,1.75rem)] sm:max-w-2xl sm:px-4 md:max-w-3xl 2xl:max-w-none 2xl:px-1 2xl:py-2">
              {/* Top padding offsets TravelImageWall’s upward translates without editing it */}
              <div className="w-full  ">
                <TravelImageWall />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
