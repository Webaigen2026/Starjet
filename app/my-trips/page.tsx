import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { prisma } from "../lib/prisma";

export default async function MyTripsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as { id?: string }).id;

  if (!userId) {
    redirect("/login");
  }

  const bookings = await prisma.booking.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { passengers: true },
  });

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-950">My Trips</h1>

        <div className="mt-8 space-y-4">
          {bookings.length === 0 ? (
            <p className="text-slate-600">No trips found.</p>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="font-semibold text-slate-950">
                  {booking.bookingCode}
                </p>
                <p className="mt-2 text-slate-600">
                  {booking.originCode} → {booking.destinationCode}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Status: {booking.status}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Payment: {booking.paymentStatus}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}