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
    <section className="relative overflow-hidden bg-slate-950 px-4 pb-20 text-white sm:px-6">
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center opacity-20 blur-md"
        style={{ backgroundImage: "url('/image/back.jpeg')" }}
      />
      <div className="absolute inset-0 bg-slate-950/82" />
      <div className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 border-t border-white/10 pt-16 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
              Popular routes
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
              Fast route picks for frequent travelers.
            </h2>
          </div>

          <Link
            href="/flights"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-black text-white hover:bg-white hover:text-slate-950"
          >
            View all flights
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {destinations.map((item) => (
            <Link
              key={item.code}
              href={`/flights/results?originCode=BOS&destinationCode=${item.code}&passengersCount=1&tripType=ROUND_TRIP`}
              className="group overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.06] p-5 transition hover:-translate-y-1 hover:bg-white/[0.1]"
            >
              <div className={`h-2 rounded-full bg-gradient-to-r ${item.accent}`} />

              <div className="mt-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-4xl font-black tracking-tight text-white">
                    {item.code}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-400">
                    {item.country}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-950 transition group-hover:rotate-45">
                  <PlaneTakeoff className="h-5 w-5" />
                </div>
              </div>

              <h3 className="mt-8 text-xl font-black text-white">
                {item.city}
              </h3>

              <p className="mt-3 rounded-2xl bg-slate-950/60 px-4 py-3 text-sm font-bold text-slate-200">
                {item.route}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
