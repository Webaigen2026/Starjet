import Link from "next/link";
import { Bell, MessageCircleMore, PlaneTakeoff, Star } from "lucide-react";

const routeCodes = ["BOS", "MIA", "CAP", "PAP"];

const searchStats = [
  { initials: "MJ" },
  { initials: "RD" },
  { initials: "KL" },
];

export default function TravelPromoSection() {
  return (
    <section className="bg-background py-10 sm:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10">
        <PromoCard />

        <div className="mt-4 grid gap-4 sm:mt-5 sm:grid-cols-3">
          <StatCard
            badge={
              <div className="flex -space-x-2">
                {routeCodes.map((code) => (
                  <span
                    key={code}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface bg-accent-muted text-[10px] font-black tracking-tight text-black"
                  >
                    {code}
                  </span>
                ))}
              </div>
            }
            title="Compare every route"
            caption="Haiti, Miami, Boston, New York — one search."
          />

          <StatCard
            badge={
              <div className="flex -space-x-2">
                {searchStats.map((person) => (
                  <span
                    key={person.initials}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface bg-white-muted text-[11px] font-black text-black"
                  >
                    {person.initials}
                  </span>
                ))}
              </div>
            }
            title="10,000+"
            caption="searches this week"
          />

          <StatCard
            badge={
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className="h-5 w-5 fill-accent text-black"
                    aria-hidden="true"
                  />
                ))}
              </div>
            }
            title="Travelers love us"
            caption="Real reviews from real trips."
          />
        </div>
      </div>
    </section>
  );
}

function PromoCard() {
  return (
    // Neumorphic raised card: dropped the hard border + shadow-sm in favor
    // of the dual-shadow spec (--neu-highlight / --neu-shadow) plus the
    // matching neumorphic surface color (#ECF0F3 in light mode). Dark mode
    // falls back to bg-white — same reasoning as the hero section, the
    // neumorphic palette is calibrated for a light bg only.
    <div className="relative overflow-hidden rounded-[32px] bg-white p-4 shadow-[-18px_-18px_30px_var(--color-neu-highlight),18px_18px_30px_var(--color-neu-shadow)] dark:bg-white sm:p-6 lg:p-8">
      <span className="absolute right-4 top-4 rounded-md border border-border bg-white-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-black">
        Featured
      </span>

      <div className="flex flex-col items-center gap-6 lg:flex-row lg:gap-10">
        {/* <PromoIllustration /> */}
        <video src="/videos/airplane.mp4" autoPlay muted loop 
        
        className="rounded-3xl border border-border bg-white object-cover"
        width={500}
        height={500}
      
        />

        <div className="flex-1">
        

          <h2 className="text-2xl font-black tracking-tight text-black sm:text-3xl">
            Missed the fare drop again?
          </h2>

          <p className="mt-3 max-w-md text-sm leading-6 text-black sm:text-base">
            Turn on Flight Alerts and we&apos;ll ping you the moment prices on
            your route change — no more digging through old texts to
            remember what you paid last time.
          </p>

          <Link
            href="/flight-alerts"
            className="mt-5 inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-black text-black transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Turn on alerts
          </Link>
        </div>
      </div>
    </div>
  );
}

// Lightweight, self-contained illustration (no image asset required) that
// echoes the reference's "device frame + floating chat bubbles" idea,
// re-themed around flight alerts instead of copying its exact graphic.
function PromoIllustration() {
  return (
    <div className="relative flex h-40 w-full shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-border bg-accent-muted sm:h-48 lg:h-52 lg:w-64">
      <PlaneTakeoff
        className="h-16 w-16 text-black/40 sm:h-20 sm:w-20"
        aria-hidden="true"
      />

      <span className="absolute left-6 top-6 flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-bold text-black shadow-sm">
        <Bell className="h-3.5 w-3.5 text-black" aria-hidden="true" />
        $109
      </span>

      <span className="absolute bottom-7 right-6 flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-bold text-black shadow-sm">
        <MessageCircleMore
          className="h-3.5 w-3.5 text-black"
          aria-hidden="true"
        />
        Price drop
      </span>
    </div>
  );
}

function StatCard({
  badge,
  title,
  caption,
}: {
  badge: React.ReactNode;
  title: string;
  caption: string;
}) {
  return (
    // Same neumorphic treatment as PromoCard, scaled down slightly (-10px
    // offset / 18px blur instead of -18px/30px) since these are much
    // smaller cards — same ratio approach used for the navbar controls
    // earlier (large surface = full spec values, small surface = scaled).
    <div className="rounded-3xl bg-white p-6 shadow-[-10px_-10px_18px_var(--color-neu-highlight),10px_10px_18px_var(--color-neu-shadow)] dark:bg-white">
      {badge}

      <p className="mt-4 text-xl font-black tracking-tight text-black sm:text-2xl">
        {title}
      </p>

      <p className="mt-1 text-sm font-medium text-black">{caption}</p>
    </div>
  );
}