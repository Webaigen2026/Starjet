import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRightLeft,
  CalendarDays,
  ChevronDown,
  CircleDot,
  Clock3,
  MapPin,
  PackageCheck,
  Plane,
  PlaneTakeoff,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import TravelImageWall from "../TravelImageWall";
import FlightSearchForm from "../FlightSearchForm";

const serviceTabs = [
  { label: "Flights", href: "/flights", active: true },
  { label: "Cargo", href: "/cargo", active: false },
  { label: "Charter", href: "/charter", active: false },
];

const highlights = [
  { label: "Live request handling", icon: Clock3 },
  { label: "Cargo-ready routes", icon: PackageCheck },
  { label: "Secure booking flow", icon: ShieldCheck },
];

export default function HeroSearch() {
  return (
<section className="overflow-hidden bg-white ">
  <div className="mx-auto flex w-full max-w-full px-4 sm:px-6 lg:px-8 flex-col gap-8 xl:flex-row xl:items-stretch xl:gap-10">
    {/* Main hero */}
    <div className="min-w-0 flex-1 max-w-full mx-auto px-4 sm:px-6 lg:px-8">

      <div className="relative min-h-[680px] rounded-2xl overflow-hidden bg-white shadow-2xl shadow-slate-950/25 lg:min-h-[720px]">
        <Image
          src="/image/labadee.webp"
          alt="Aircraft over an airport runway"
          fill
          priority
          sizes="(min-width: 1280px) 75vw, 100vw"
          className="object-cover"
        />

        {/* Dark overlay for text readability */}
        {/* <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-slate-950/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/20" /> */}

        <div className="pointer-events-none absolute right-8 top-8 z-20 hidden items-center gap-3 rounded-full border border-white/15 bg-slate-950/45 px-5 py-3 text-sm font-black text-cyan-100 shadow-xl backdrop-blur-md md:flex">
          <PlaneTakeoff className="h-5 w-5" />
          Aircraft routes ready
        </div>

        <Plane className="pointer-events-none absolute bottom-16 left-[46%] z-10 hidden h-44 w-44 -rotate-12 text-white/10 lg:block" />

        <div className="relative z-10 grid  min-h-[680px] gap-12 px-5 py-8 sm:px-8 sm:py-10 lg:min-h-[720px] lg:grid-cols-[minmax(0,1fr)_minmax(420px,500px)] lg:items-center lg:py-12">
          {/* Hero copy */}
          <div className="flex  max-w-full flex-col justify-center py-8 lg:py-16">
            {/* <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-cyan-100 backdrop-blur-md">
              <Plane className="h-4 w-4 shrink-0" />
              <span>Haiti, United States and international air service</span>
            </div> */}

            <h1 className=" max-w-3xl text-4xl font-black leading-[1.03] tracking-tight text-white  my-12">
              Move people and cargo with confidence.
            </h1>

            {/* <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
              Search flights, request cargo movement, and arrange private
              charter travel through one polished StarJet experience.
            </p> */}

            {/* <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {highlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-md"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-cyan-200" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-7 flex w-fit max-w-full items-center gap-3 rounded-2xl border border-cyan-200/20 bg-slate-950/45 px-4 py-3 text-sm font-bold text-white backdrop-blur-md">
              <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-black text-slate-950">
                BOS
              </span>

              <span className="h-px w-8 bg-cyan-200/60 sm:w-12" />

              <PlaneTakeoff className="h-4 w-4 shrink-0 text-cyan-200" />

              <span className="h-px w-8 bg-cyan-200/60 sm:w-12" />

              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950">
                PAP
              </span>
            </div> */}

            <FlightSearchForm />
          </div>

          {/* Search form */}
          {/* <div className="flex w-full items-end lg:items-center">
            <form
              action="/flights/results"
              className="w-full overflow-hidden rounded-[24px] border border-white/20 bg-white shadow-2xl shadow-slate-950/35"
            >
              <div className="flex gap-1 border-b border-slate-200 bg-slate-50 p-2">
                {serviceTabs.map((tab) => (
                  <Link
                    key={tab.label}
                    href={tab.href}
                    className={`flex-1 rounded-2xl px-3 py-3 text-center text-sm font-black transition-all duration-200 sm:px-4 ${
                      tab.active
                        ? "bg-slate-950 text-white shadow-lg shadow-slate-300/60"
                        : "text-slate-500 hover:bg-white hover:text-slate-950"
                    }`}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>

              <div className="p-5 sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
                      Flight search
                    </p>

                    <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                      Where are you flying?
                    </h2>
                  </div>

                  <div className="inline-flex w-fit rounded-full bg-cyan-50 p-1 text-xs font-black text-slate-700">
                    <span className="rounded-full bg-white px-3 py-2 shadow-sm">
                      Round trip
                    </span>
                    <span className="px-3 py-2">One way</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                    <Field
                      label="From"
                      name="originCode"
                      defaultValue="BOS"
                      icon={MapPin}
                    />

                    <div className="hidden items-end pb-1 sm:flex">
                      <button
                        type="button"
                        aria-label="Swap origin and destination"
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                      >
                        <ArrowRightLeft className="h-5 w-5" />
                      </button>
                    </div>

                    <Field
                      label="To"
                      name="destinationCode"
                      defaultValue="PAP"
                      icon={CircleDot}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <DateField label="Departure" name="departureDate" />
                    <DateField label="Return" name="returnDate" />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="min-w-0">
                      <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                        Travelers
                      </label>

                      <div className="mt-2 flex h-[52px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-slate-950 shadow-sm transition focus-within:border-cyan-600 focus-within:ring-4 focus-within:ring-cyan-600/10">
                        <UsersRound className="h-5 w-5 shrink-0 text-cyan-700" />

                        <input
                          name="passengersCount"
                          type="number"
                          min={1}
                          defaultValue={1}
                          className="min-w-0 flex-1 bg-transparent font-bold outline-none"
                        />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                        Cabin
                      </label>

                      <button
                        type="button"
                        className="mt-2 flex h-[52px] w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 shadow-sm transition hover:border-cyan-300"
                      >
                        Economy
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  <input type="hidden" name="tripType" value="ROUND_TRIP" />

                  <button
                    type="submit"
                    className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-400 hover:shadow-xl active:translate-y-0"
                  >
                    <Search className="h-5 w-5" />
                    Search flights
                  </button>
                </div>
              </div>

              <div className="grid divide-y divide-slate-200 border-t border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <Link
                  href="/my-trips"
                  className="px-5 py-4 text-center transition hover:bg-white hover:text-slate-950"
                >
                  My trips
                </Link>

                <Link
                  href="/cargo"
                  className="px-5 py-4 text-center transition hover:bg-white hover:text-slate-950"
                >
                  Cargo request
                </Link>

                <Link
                  href="/charter"
                  className="px-5 py-4 text-center transition hover:bg-white hover:text-slate-950"
                >
                  Charter quote
                </Link>
              </div>
            </form>
          </div> */}



        </div>
      </div>
    </div>

    {/* Travel image wall */}
    <aside className="w-full shrink-0 xl:w-[420px] 2xl:w-[520px] ">
      <div className="h-full overflow-hidden ">
        <TravelImageWall />
      </div>
    </aside>
  </div>
</section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  icon: Icon,
}: {
  label: string;
  name: string;
  defaultValue: string;
  icon: LucideIcon;
}) {
  return (
    <div className="min-w-0">
      <label className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <div className="mt-2 flex h-[52px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-slate-950 shadow-sm focus-within:border-cyan-600">
        <Icon className="h-5 w-5 text-cyan-700" />
        <input
          name={name}
          defaultValue={defaultValue}
          className="min-w-0 flex-1 bg-transparent text-lg font-black tracking-tight outline-none"
        />
      </div>
    </div>
  );
}

function DateField({ label, name }: { label: string; name: string }) {
  return (
    <div className="min-w-0">
      <label className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <div className="mt-2 flex h-[52px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-slate-950 shadow-sm focus-within:border-cyan-600">
        <CalendarDays className="h-5 w-5 text-cyan-700" />
        <input
          name={name}
          type="date"
          className="min-w-0 flex-1 bg-transparent font-bold outline-none"
        />
      </div>
    </div>
  );
}
