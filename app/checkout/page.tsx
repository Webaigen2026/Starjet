import { prisma } from "../lib/prisma";

type CheckoutPageProps = {
  searchParams: Promise<{
    bookingId?: string;
  }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;

  const booking = params.bookingId
    ? await prisma.booking.findUnique({
        where: {
          id: params.bookingId,
        },
        include: {
          passengers: true,
        },
      })
    : null;

  if (!booking) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">
            Booking Not Found
          </h1>
          <p className="mt-4 text-slate-600">
            We could not find this booking. Please go back and try again.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">
          Checkout
        </p>

        <h1 className="text-4xl font-bold tracking-tight text-slate-950">
          Review & Payment
        </h1>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-950">
            Booking Summary
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <p><strong>Booking Code:</strong> {booking.bookingCode}</p>
            <p><strong>Airline:</strong> {booking.airlineName}</p>
            <p><strong>Route:</strong> {booking.originCode} → {booking.destinationCode}</p>
            <p><strong>Passengers:</strong> {booking.passengersCount}</p>
            <p><strong>Status:</strong> {booking.status}</p>
            <p><strong>Payment:</strong> {booking.paymentStatus}</p>
            <p><strong>Total:</strong> ${String(booking.totalAmount)}</p>
          </div>

          <button className="mt-8 rounded-xl bg-slate-950 px-8 py-4 font-semibold text-white hover:bg-slate-800">
            Continue to Payment
          </button>
        </div>
      </div>
    </main>
  );
}