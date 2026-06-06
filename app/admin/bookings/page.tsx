import Link from "next/link";
import { prisma } from "../../lib/prisma";

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      passengers: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Admin / Bookings
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
            Booking Management
          </h1>

          <p className="mt-3 text-slate-600">
            View and manage customer flight bookings.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-6 py-4">Booking Code</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Airline</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {bookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-t border-slate-100 text-slate-700"
                >
                  <td className="px-6 py-4 font-semibold text-slate-950">
                    {booking.bookingCode}
                  </td>

                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-950">
                      {booking.customerName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {booking.customerEmail}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    {booking.originCode} → {booking.destinationCode}
                  </td>

                  <td className="px-6 py-4">
                    {booking.airlineName || "N/A"}
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {booking.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      {booking.paymentStatus}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    ${String(booking.totalAmount || "0")}
                  </td>

                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="font-semibold text-blue-700 hover:text-blue-900"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}

              {bookings.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-slate-500"
                  >
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}