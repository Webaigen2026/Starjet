import Link from "next/link";
import { ArrowUpRight, PlaneTakeoff } from "lucide-react";

const destinations = [
  {
    city: "Port-au-Prince",
    code: "PAP",
    country: "Haiti",
    route: "Boston to Port-au-Prince",
    accent: "from-cyan-500 to-blue-700",
  },
  {
    city: "Cap-Haitien",
    code: "CAP",
    country: "Haiti",
    route: "Boston to Cap-Haitien",
    accent: "from-emerald-500 to-cyan-700",
  },
  {
    city: "Miami",
    code: "MIA",
    country: "United States",
    route: "Haiti to Miami",
    accent: "from-amber-400 to-orange-600",
  },
  {
    city: "New York",
    code: "JFK",
    country: "United States",
    route: "Haiti to New York",
    accent: "from-rose-500 to-slate-800",
  },
];

export default function PopularDestinations() {
  return (
    <section className="relative overflow-hidden bg-white px-4 py-20 text-slate-950 sm:px-6 lg:py-24">
      {/* Soft decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-[0.035] blur-sm"
          style={{ backgroundImage: "url('/image/back.jpeg')" }}
        />

        <div className="absolute -right-32 top-10 h-80 w-80 rounded-full bg-cyan-100/70 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Section heading */}
        <div className="flex flex-col justify-between gap-6 border-t border-slate-200 pt-14 md:flex-row md:items-end lg:pt-16">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-700">
              Popular routes
            </p>

            <h2 className="mt-3 text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-5xl">
              Fast route picks for frequent travelers.
            </h2>

            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              Explore frequently requested destinations and begin planning your
              next trip in just a few clicks.
            </p>
          </div>

          <Link
            href="/flights"
            className="group inline-flex w-fit items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-950 hover:bg-slate-950 hover:text-white hover:shadow-lg"
          >
            View all flights
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Destination cards */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((item) => (
            <Link
              key={item.code}
              href={`/flights/results?originCode=BOS&destinationCode=${item.code}&passengersCount=1&tripType=ROUND_TRIP`}
              className="group relative flex min-h-[290px] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/70"
            >
              <div
                className={`h-2 w-full rounded-full bg-gradient-to-r ${item.accent}`}
              />

              <div className="mt-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-4xl font-black tracking-tight text-slate-950">
                    {item.code}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {item.country}
                  </p>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white shadow-md transition-all duration-300 group-hover:rotate-45 group-hover:bg-cyan-500 group-hover:text-slate-950">
                  <PlaneTakeoff className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-auto pt-10">
                <h3 className="text-xl font-black text-slate-950">
                  {item.city}
                </h3>

                <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition-colors group-hover:border-cyan-200 group-hover:bg-cyan-50">
                  <p className="text-sm font-bold leading-5 text-slate-700">
                    {item.route}
                  </p>

                  <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cyan-700" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}