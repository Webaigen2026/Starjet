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
    <section className="relative overflow-hidden bg-slate-950 px-4 pb-16 pt-8 text-white sm:px-6 lg:pb-20">
      <div className="absolute inset-x-0 top-0 h-40 bg-cyan-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-900 shadow-2xl shadow-slate-950/40 lg:min-h-[720px]">
          <Image
            src="/image/hero-bck.jpeg"
            alt="Aircraft over an airport runway"
            fill
            priority
            sizes="100vw"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(2,6,23,0.92)_0%,rgba(15,23,42,0.76)_42%,rgba(14,116,144,0.18)_72%,rgba(2,6,23,0.34)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
          <div className="pointer-events-none absolute right-8 top-8 hidden items-center gap-3 rounded-full border border-white/15 bg-slate-950/45 px-5 py-3 text-sm font-black text-cyan-100 shadow-2xl shadow-cyan-950/40 backdrop-blur md:flex">
            <PlaneTakeoff className="h-5 w-5" />
            Aircraft routes ready
          </div>
          <Plane className="pointer-events-none absolute bottom-16 left-[46%] hidden h-44 w-44 -rotate-12 text-white/10 lg:block" />

          <div className="relative z-10 grid content-between gap-10 px-5 py-8 sm:px-8 lg:min-h-[720px] lg:grid-cols-[minmax(0,1fr)_500px] lg:px-12 lg:py-12">
            <div className="flex max-w-3xl flex-col justify-center py-8 lg:py-16">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-cyan-100 backdrop-blur">
                <Plane className="h-4 w-4" />
                Haiti, United States and international air service
              </div>

              <h1 className="mt-7 max-w-3xl text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Move people and cargo with confidence.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
                Search flights, request cargo movement, and arrange private
                charter travel through one polished SkyBridge experience.
              </p>

              <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                {highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-cyan-200" />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-7 flex w-fit items-center gap-3 rounded-2xl border border-cyan-200/20 bg-slate-950/45 px-4 py-3 text-sm font-bold text-white backdrop-blur">
                <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-black text-slate-950">
                  BOS
                </span>
                <span className="h-px w-12 bg-cyan-200/60" />
                <PlaneTakeoff className="h-4 w-4 text-cyan-200" />
                <span className="h-px w-12 bg-cyan-200/60" />
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950">
                  PAP
                </span>
              </div>
            </div>

            <div className="flex items-end lg:items-center">
              <form
                action="/flights/results"
                className="w-full overflow-hidden rounded-[24px] border border-white/20 bg-white shadow-2xl shadow-slate-950/35"
              >
                <div className="flex border-b border-slate-200 bg-slate-50 p-2">
                  {serviceTabs.map((tab) => (
                    <Link
                      key={tab.label}
                      href={tab.href}
                      className={`flex-1 rounded-2xl px-4 py-3 text-center text-sm font-black transition ${
                        tab.active
                          ? "bg-slate-950 text-white shadow-lg shadow-slate-200"
                          : "text-slate-500 hover:bg-white hover:text-slate-950"
                      }`}
                    >
                      {tab.label}
                    </Link>
                  ))}
                </div>

                <div className="p-5 sm:p-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
                        Flight search
                      </p>
                      <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                        Where are you flying?
                      </h2>
                    </div>
                    <div className="inline-flex rounded-full bg-cyan-50 p-1 text-xs font-black text-slate-700">
                      <span className="rounded-full bg-white px-3 py-2 shadow-sm">
                        Round trip
                      </span>
                      <span className="px-3 py-2">One way</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                      <Field
                        label="From"
                        name="originCode"
                        defaultValue="BOS"
                        icon={MapPin}
                      />
                      <div className="hidden items-end pb-2 sm:flex">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500">
                          <ArrowRightLeft className="h-5 w-5" />
                        </div>
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
                        <div className="mt-2 flex h-[52px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-slate-950 shadow-sm focus-within:border-cyan-600">
                          <UsersRound className="h-5 w-5 text-cyan-700" />
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
                        <div className="mt-2 flex h-[52px] items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 shadow-sm">
                          Economy
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    </div>

                    <input type="hidden" name="tripType" value="ROUND_TRIP" />

                    <button className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400">
                      <Search className="h-5 w-5" />
                      Search flights
                    </button>
                  </div>
                </div>

                <div className="grid border-t border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 sm:grid-cols-3">
                  <Link href="/my-trips" className="px-5 py-4 hover:bg-white">
                    My trips
                  </Link>
                  <Link href="/cargo" className="px-5 py-4 hover:bg-white">
                    Cargo request
                  </Link>
                  <Link href="/charter" className="px-5 py-4 hover:bg-white">
                    Charter quote
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
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
