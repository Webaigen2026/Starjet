import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Headphones,
  PackageCheck,
  Plane,
  Radar,
} from "lucide-react";

const services = [
  {
    title: "Flight Booking",
    description:
      "Search routes between Haiti, the United States, and international destinations with a clean passenger flow.",
    href: "/flights",
    icon: Plane,
  },
  {
    title: "Cargo Requests",
    description:
      "Send cargo details, origin, destination, and shipment needs through a dedicated request path.",
    href: "/cargo",
    icon: PackageCheck,
  },
  {
    title: "Private Charter",
    description:
      "Request aircraft availability for family travel, business trips, and custom itineraries.",
    href: "/charter",
    icon: BriefcaseBusiness,
  },
];

const stats = [
  { value: "3", label: "Core services" },
  { value: "24/7", label: "Request intake" },
  { value: "BOS", label: "Featured origin" },
];

export default function Features() {
  return (
    <section className="relative overflow-hidden bg-white px-4 py-20 text-slate-950 sm:px-6">
      <div
        className="absolute inset-x-0 top-0 h-[520px] scale-110 bg-cover bg-center opacity-10 blur-sm"
        style={{ backgroundImage: "url('/image/hero-bck.jpeg')" }}
      />
      <div className="absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-white/75 via-white/90 to-white" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-700">
              StarJet services
            </p>
            <h2 className="section-title mt-4 md:text-[clamp(1.75rem,1.2rem+1.8vw,2.75rem)]">
              Built for passengers, shipments, and special missions.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              For families, operators, and businesses that need dependable air
              movement, StarJet keeps the most important travel paths close at
              hand.
            </p>

            <div className="mt-8 grid max-w-xl grid-cols-3 overflow-hidden rounded-[24px] border border-slate-200">
              {stats.map((stat) => (
                <div key={stat.label} className="border-r border-slate-200 p-5 last:border-r-0">
                  <p className="text-2xl font-black text-slate-950">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Link
                  key={service.title}
                  href={service.href}
                  className="group grid gap-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-cyan-200 hover:shadow-xl hover:shadow-cyan-950/10 sm:grid-cols-[64px_1fr_auto] sm:items-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-cyan-200">
                    <Icon className="h-7 w-7" />
                  </div>

                  <div>
                    <h3 className="text-xl font-black tracking-tight">
                      {service.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {service.description}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-50 text-cyan-800 transition group-hover:bg-cyan-500 group-hover:text-slate-950">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="relative mt-16 overflow-hidden rounded-[28px] bg-slate-950 text-white">
          <div
            className="absolute inset-0 scale-110 bg-cover bg-center opacity-20 blur-sm"
            style={{ backgroundImage: "url('/image/back.jpeg')" }}
          />
          <div className="absolute inset-0 bg-slate-950/78" />
          <div className="relative grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 sm:p-10 lg:p-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950">
                <Radar className="h-7 w-7" />
              </div>
              <h2 className="section-title mt-8 max-w-2xl md:text-[clamp(1.75rem,1.2rem+1.8vw,2.75rem)]">
                A calmer control center for complicated travel.
              </h2>
              <p className="body-text mt-5 max-w-2xl text-lg text-slate-300">
                Compare routes, prepare shipment details, and request dedicated
                aircraft support from one place before the trip gets
                complicated.
              </p>
            </div>

            <div className="grid content-center gap-3 border-t border-white/10 bg-white/[0.04] p-8 sm:p-10 lg:border-l lg:border-t-0">
              <Status icon={BadgeCheck} label="Booking flow" value="Ready" />
              <Status icon={PackageCheck} label="Cargo requests" value="Open" />
              <Status icon={Headphones} label="Support" value="Available" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Status({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BadgeCheck;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/10 p-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-cyan-200" />
        <span className="font-bold text-slate-200">{label}</span>
      </div>
      <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-black text-slate-950">
        {value}
      </span>
    </div>
  );
}
