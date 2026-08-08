import Image from "next/image";

const slides = [
  {
    eyebrow: "The new Kiwi.com guarantee",
    title: "Automatic check-in",
    logo: "/images/automatic-checkin-logo.png",
    plane: "/images/automatic-checkin-plane.png",
    boardingPass: "/images/automatic-checkin-pass.png",
  },
];

export default function AutomaticCheckInBanner() {
  const activeSlide = 1;

  return (
    <section
      className="mx-auto w-full max-w-[1940px] px-4 py-6 sm:px-6 lg:px-8"
      aria-label="Kiwi.com travel guarantees"
    >
      <div className="relative min-h-[345px] overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-[0_3px_14px_rgba(15,118,110,0.12)]">
        <div className="grid min-h-[345px] grid-cols-1 lg:grid-cols-[2fr_1fr]">
          {/* Text content */}
          <div className="relative z-10 flex flex-col justify-between px-8 py-10 sm:px-14 sm:py-12 lg:px-20">
            <div>
              <p className="text-2xl font-extrabold tracking-tight text-emerald-950 sm:text-3xl lg:text-[42px] lg:leading-tight">
                The new Kiwi.com guarantee
              </p>

              <h2 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[54px] lg:leading-tight">
                Automatic check-in
              </h2>
            </div>

            {/* Pagination */}
            <div
              className="mt-12 flex items-center gap-3"
              aria-label="Carousel pagination"
            >
              {[0, 1, 2, 3, 4].map((index) => {
                const isActive = index === activeSlide;

                return (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Go to slide ${index + 1}`}
                    aria-current={isActive ? "true" : undefined}
                    className={[
                      "h-4 w-4 rounded-full transition-all duration-200",
                      "focus-visible:outline-none focus-visible:ring-2",
                      "focus-visible:ring-emerald-700 focus-visible:ring-offset-2",
                      isActive
                        ? "scale-105 bg-emerald-950"
                        : "bg-slate-200 hover:bg-slate-300",
                    ].join(" ")}
                  />
                );
              })}
            </div>
          </div>

          {/* Visual panel */}
          <div className="relative min-h-[300px] overflow-hidden bg-gradient-to-br from-cyan-50 via-emerald-50 to-teal-200 lg:min-h-full">
            {/* Decorative clouds */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-28 bg-[radial-gradient(circle_at_20%_100%,rgba(255,255,255,0.95)_0,rgba(255,255,255,0.8)_18%,transparent_48%),radial-gradient(circle_at_70%_100%,rgba(255,255,255,0.9)_0,rgba(255,255,255,0.65)_22%,transparent_55%)]"
            />

            {/* Guarantee badge */}
            <div className="absolute left-[12%] top-[16%] h-44 w-40 sm:h-48 sm:w-44 lg:left-[8%]">
              <Image
                src="/images/automatic-checkin-logo.png"
                alt=""
                fill
                sizes="180px"
                className="object-contain"
              />
            </div>

            {/* Boarding pass */}
            <div className="absolute right-[4%] top-[25%] h-[230px] w-[44%] min-w-[270px] rotate-[1.5deg] overflow-hidden rounded-3xl bg-white shadow-2xl sm:right-[6%] sm:w-[48%]">
              <Image
                src="/images/automatic-checkin-pass.png"
                alt="Digital boarding pass with a QR code"
                fill
                sizes="(max-width: 1024px) 55vw, 420px"
                className="object-cover object-left-top"
              />
            </div>

            {/* Plane */}
            <div className="absolute bottom-[-12%] left-[3%] z-20 h-[230px] w-[48%] min-w-[300px]">
              <Image
                src="/images/automatic-checkin-plane.png"
                alt=""
                fill
                sizes="(max-width: 1024px) 55vw, 440px"
                className="object-contain drop-shadow-[0_18px_16px_rgba(15,23,42,0.28)]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}