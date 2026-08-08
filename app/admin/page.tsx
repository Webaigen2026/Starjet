import { prisma } from "../lib/prisma";

export default async function AdminPage() {
  const [bookings, cargoRequests, charterRequests, passengers] =
    await Promise.all([
      prisma.booking.findMany({
        orderBy: { createdAt: "desc" },
        include: { passengers: true },
        take: 5,
      }),
      prisma.cargoRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.charterRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.passenger.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const totalBookings = await prisma.booking.count();
  const totalCargo = await prisma.cargoRequest.count();
  const totalCharter = await prisma.charterRequest.count();
  const totalPassengers = await prisma.passenger.count();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            StarJet Admin
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
            Operations Dashboard
          </h1>
          <p className="mt-3 text-slate-600">
            Manage bookings, passengers, cargo requests, and charter requests.
          </p>
        </div>

        <section className="grid gap-6 md:grid-cols-4">
          <DashboardCard title="Bookings" value={totalBookings} />
          <DashboardCard title="Passengers" value={totalPassengers} />
          <DashboardCard title="Cargo Requests" value={totalCargo} />
          <DashboardCard title="Charter Requests" value={totalCharter} />
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-2">
          <Panel title="Recent Bookings">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="border-b border-slate-100 py-4 last:border-0"
              >
                <p className="font-semibold text-slate-950">
                  {booking.bookingCode}
                </p>
                <p className="text-sm text-slate-600">
                  {booking.originCode} → {booking.destinationCode} •{" "}
                  {booking.customerName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {booking.status} / {booking.paymentStatus}
                </p>
              </div>
            ))}
          </Panel>

          <Panel title="Recent Cargo Requests">
            {cargoRequests.map((request) => (
              <div
                key={request.id}
                className="border-b border-slate-100 py-4 last:border-0"
              >
                <p className="font-semibold text-slate-950">
                  {request.requestCode}
                </p>
                <p className="text-sm text-slate-600">
                  {request.fromCity} → {request.toCity} • {request.fullName}
                </p>
                <p className="mt-1 text-xs text-slate-500">{request.status}</p>
              </div>
            ))}
          </Panel>

          <Panel title="Recent Charter Requests">
            {charterRequests.map((request) => (
              <div
                key={request.id}
                className="border-b border-slate-100 py-4 last:border-0"
              >
                <p className="font-semibold text-slate-950">
                  {request.requestCode}
                </p>
                <p className="text-sm text-slate-600">
                  {request.departureCity} → {request.destinationCity} •{" "}
                  {request.fullName}
                </p>
                <p className="mt-1 text-xs text-slate-500">{request.status}</p>
              </div>
            ))}
          </Panel>

          <Panel title="Recent Passengers">
            {passengers.map((passenger) => (
              <div
                key={passenger.id}
                className="border-b border-slate-100 py-4 last:border-0"
              >
                <p className="font-semibold text-slate-950">
                  {passenger.firstName} {passenger.lastName}
                </p>
                <p className="text-sm text-slate-600">
                  Passport: {passenger.passportNumber || "Not provided"}
                </p>
              </div>
            ))}
          </Panel>
        </section>
      </div>
    </main>
  );
}

function DashboardCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-4xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}