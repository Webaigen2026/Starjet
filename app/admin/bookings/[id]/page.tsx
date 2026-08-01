import { prisma } from "../../../lib/prisma";
import StatusUpdateForm from "../../../api/bookings/[id]/StatusUpdateForm";

type BookingDetailsPageProps = {
  params: {
    id: string;
  };
};

export default async function BookingDetailsPage({
  params,
}: BookingDetailsPageProps) {
  const { id } = params;

  const booking = await prisma.booking.findUnique({
    where: {
      id,
    },
    include: {
      passengers: true,
      payments: true,
    },
  });

  if (!booking) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        <h1 className="text-3xl font-bold">Booking Not Found</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Booking Details
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-950">
            {booking.bookingCode}
          </h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-8 shadow-sm lg:col-span-2">
            <h2 className="mb-6 text-2xl font-bold">
              Flight Information
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <Info
                label="Airline"
                value={booking.airlineName || "N/A"}
              />

              <Info
                label="Route"
                value={`${booking.originCode} → ${booking.destinationCode}`}
              />

              <Info
                label="Departure"
                value={booking.departureDate.toDateString()}
              />

              <Info
                label="Passengers"
                value={String(booking.passengersCount)}
              />

              <Info
                label="Status"
                value={booking.status}
              />

              <Info
                label="Payment Status"
                value={booking.paymentStatus}
              />
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-bold">
              Customer
            </h2>

            <Info
              label="Name"
              value={booking.customerName}
            />

            <Info
              label="Email"
              value={booking.customerEmail}
            />

            <Info
              label="Phone"
              value={booking.customerPhone || "N/A"}
            />

            <div className="mt-6 border-t pt-6">
              <p className="text-sm text-slate-500">
                Total Amount
              </p>

              <p className="mt-2 text-4xl font-bold text-slate-950">
                ${String(booking.totalAmount || "0")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-bold">
            Passengers
          </h2>
          <StatusUpdateForm
            bookingId={booking.id}
            currentStatus={booking.status}
            currentPaymentStatus={booking.paymentStatus}
          />    

          <div className="space-y-4">
            {booking.passengers.map(
              (passenger: {
                id: string;
                firstName: string;
                lastName: string;
                passportNumber?: string | null;
                nationality?: string | null;
              }) => (
                <div
                  key={passenger.id}
                  className="rounded-2xl border p-4"
                >
                  <h3 className="font-semibold text-slate-950">
                    {passenger.firstName} {passenger.lastName}
                  </h3>

                <p className="text-sm text-slate-600">
                  Passport:{" "}
                  {passenger.passportNumber || "Not Provided"}
                </p>

                <p className="text-sm text-slate-600">
                  Nationality:{" "}
                  {passenger.nationality || "Not Provided"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}