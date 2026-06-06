import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { prisma } from "../lib/prisma";

export default async function CustomerDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const email = session.user.email;

  const [bookings, cargoRequests, charterRequests] = await Promise.all([
    prisma.booking.findMany({
      where: { customerEmail: email },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.cargoRequest.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.charterRequest.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <main className="min-h-screen bg-[#f6f8fc]">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-slate-200 bg-white px-6 py-8 lg:flex lg:flex-col">
          <div className="mb-10">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white">
                ✦
              </div>
              <div>
                <h2 className="text-xl font-black tracking-wide text-slate-950">
                  STARJET
                </h2>
                <p className="text-xs font-bold tracking-[0.3em] text-blue-600">
                  HAITI
                </p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            <SidebarLink active href="/dashboard" icon="▦" label="Dashboard" />
            <p className="px-4 pt-6 text-xs font-bold uppercase tracking-wide text-slate-400">
              My Services
            </p>
            <SidebarLink href="/my-trips" icon="✈" label="My Trips" />
            <SidebarLink href="/my-cargo" icon="□" label="My Cargo Requests" />
            <SidebarLink href="/my-charter" icon="⌁" label="My Charter Requests" />

            <p className="px-4 pt-6 text-xs font-bold uppercase tracking-wide text-slate-400">
              Account
            </p>
            <SidebarLink href="/profile" icon="♙" label="Profile" />
            <SidebarLink href="/contact" icon="☏" label="Support" />
          </nav>

          <div className="mt-auto rounded-3xl bg-blue-50 p-5">
            <p className="font-bold text-blue-700">Need Help?</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Our support team is ready to assist with trips, cargo, and charter
              requests.
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-flex rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-700"
            >
              Contact Support
            </Link>
          </div>
        </aside>

        <section className="flex-1">
          <header className="border-b border-slate-200 bg-white px-6 py-5">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Welcome back,</p>
                <p className="font-bold text-slate-950">
                  {session.user.name || session.user.email}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                {(session.user.name || session.user.email || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-6 py-10">
            <section className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-white p-8 shadow-sm">
              <div className="relative z-10">
                <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
                  Customer Dashboard
                </p>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                  Welcome back, {session.user.name || "Traveler"}! 👋
                </h1>
                <p className="mt-4 max-w-2xl text-slate-600">
                  Manage your flight bookings, cargo shipments, and private
                  charter requests from one secure dashboard.
                </p>
              </div>

              <div className="absolute right-8 top-8 hidden text-8xl opacity-10 md:block">
                ✈
              </div>
            </section>

            <section className="mt-8 grid gap-6 md:grid-cols-3">
            <StatCard
  title="My Trips"
  value={bookings.length}
  href="/my-trips"
  icon="✈"
  cta="View Trips"
/>

<StatCard
  title="My Cargo Requests"
  value={cargoRequests.length}
  href="/my-cargo"
  icon="📦"
  cta="View Requests"
/>

<StatCard
  title="My Charter Requests"
  value={charterRequests.length}
  href="/my-charter"
  icon="🚁"
  cta="View Requests"
/>
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-3">
              <ActivityPanel
                title="Recent Trips"
                emptyTitle="No trips found"
                emptyText="You haven't booked any trips yet."
                buttonText="Book a Trip"
                buttonHref="/flights"
                icon="🧳"
              >
                {bookings.map((booking) => (
                  <ActivityItem
                    key={booking.id}
                    title={booking.bookingCode}
                    subtitle={`${booking.originCode} → ${booking.destinationCode}`}
                    status={booking.status}
                  />
                ))}
              </ActivityPanel>

              <ActivityPanel
                title="Recent Cargo Requests"
                emptyTitle="No cargo requests found"
                emptyText="You haven't created any cargo requests yet."
                buttonText="New Cargo Request"
                buttonHref="/cargo"
                icon="📦"
              >
                {cargoRequests.map((request) => (
                  <ActivityItem
                    key={request.id}
                    title={request.requestCode}
                    subtitle={`${request.fromCity} → ${request.toCity}`}
                    status={request.status}
                  />
                ))}
              </ActivityPanel>

              <ActivityPanel
                title="Recent Charter Requests"
                emptyTitle="No charter requests found"
                emptyText="You haven't created any charter requests yet."
                buttonText="New Charter Request"
                buttonHref="/charter"
                icon="🚁"
              >
                {charterRequests.map((request) => (
                  <ActivityItem
                    key={request.id}
                    title={request.requestCode}
                    subtitle={`${request.departureCity} → ${request.destinationCity}`}
                    status={request.status}
                  />
                ))}
              </ActivityPanel>
            </section>

            <section className="mt-8 grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-4">
              <Feature icon="⏱" title="Fast & Reliable" text="On-time flights and deliveries you can count on." />
              <Feature icon="🛡" title="Safe & Secure" text="Your travel and shipment details stay protected." />
              <Feature icon="🎧" title="24/7 Support" text="Our team is ready to help whenever needed." />
              <Feature icon="⭐" title="Trusted Service" text="Serving Haiti travel and logistics with care." />
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold ${
        active
          ? "bg-blue-50 text-blue-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
      }`}
    >
      <span className="w-5 text-lg">{icon}</span>
      {label}
    </Link>
  );
}

function StatCard({
  title,
  value,
  href,
  icon,
  cta,
}: {
  title: string;
  value: number;
  href: string;
  icon: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
          {icon}
        </div>
        <span className="text-5xl opacity-5">{icon}</span>
      </div>

      <p className="mt-6 text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-2 text-5xl font-black text-slate-950">{value}</p>
      <p className="mt-5 text-sm font-bold text-blue-700">
        {cta} <span className="transition group-hover:ml-1">→</span>
      </p>
    </Link>
  );
}

function ActivityPanel({
  title,
  emptyTitle,
  emptyText,
  buttonText,
  buttonHref,
  icon,
  children,
}: {
  title: string;
  emptyTitle: string;
  emptyText: string;
  buttonText: string;
  buttonHref: string;
  icon: string;
  children: React.ReactNode;
}) {
  const hasItems =
    Array.isArray(children) &&
    children.some((child) => child !== null && child !== undefined);

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
      </div>

      {hasItems ? (
        <div className="space-y-3">{children}</div>
      ) : (
        <div className="flex min-h-56 flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-4xl">
            {icon}
          </div>
          <p className="mt-5 font-black text-slate-950">{emptyTitle}</p>
          <p className="mt-2 text-sm text-slate-500">{emptyText}</p>
          <Link
            href={buttonHref}
            className="mt-5 rounded-xl border border-blue-200 px-5 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"
          >
            {buttonText}
          </Link>
        </div>
      )}
    </div>
  );
}

function ActivityItem({
  title,
  subtitle,
  status,
}: {
  title: string;
  subtitle: string;
  status: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-bold text-slate-950">{title}</p>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          {status}
        </span>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-xl">
        {icon}
      </div>
      <div>
        <p className="font-black text-slate-950">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
      </div>
    </div>
  );
}