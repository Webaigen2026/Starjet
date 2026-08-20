import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "../../api/auth/[...nextauth]/route";
import { authorizeBookingAccess } from "../../lib/authorization";
import { isTicketEligible } from "../../lib/ticketAccess";
import { prisma } from "../../lib/prisma";

type Props = {
  params: Promise<{
    bookingId: string;
  }>;
};

type TicketPassenger = {
  id: string;
  firstName: string;
  lastName: string;
  seat?: {
    seatNumber?: string | null;
    seatClass?: string | null;
  } | null;
};

export default async function TicketPage({
  params,
}: Props) {
  const { bookingId } = await params;

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/tickets/${bookingId}`)}`
    );
  }

  const booking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
    include: {
      schedule: {
        include: {
          route: {
            include: {
              airline: true,
              originAirport: true,
              destinationAirport: true,
            },
          },
        },
      },
      passengers: {
        include: {
          seat: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      payments: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  const access = authorizeBookingAccess(
    session.user as { id?: string; role?: "ADMIN" | "STAFF" | "CUSTOMER" },
    booking
  );

  if (!access.authorized) {
    notFound();
  }

  if (!isTicketEligible(booking)) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="text-4xl font-bold">
        Airline Ticket
      </h1>

      <div className="mt-8 rounded-xl border p-6">
        <p>
          Booking Code:
          <strong className="ml-2">
            {booking.bookingCode}
          </strong>
        </p>

        <p className="mt-3">
          Passenger:
          <strong className="ml-2">
            {booking.customerName}
          </strong>
        </p>

        <p className="mt-3">
          Airline:
          <strong className="ml-2">
            {booking.schedule.route.airline.name}
          </strong>
        </p>

        <p className="mt-3">
          Flight:
          <strong className="ml-2">
            {booking.schedule.route.flightNumber}
          </strong>
        </p>

        <p className="mt-3">
          From:
          <strong className="ml-2">
            {booking.schedule.route.originAirport.city}
          </strong>
        </p>

        <p className="mt-3">
          To:
          <strong className="ml-2">
            {booking.schedule.route.destinationAirport.city}
          </strong>
        </p>

        <p className="mt-3">
          Departure:
          <strong className="ml-2">
            {new Date(
              booking.departureDate
            ).toLocaleString()}
          </strong>
        </p>

        <p className="mt-3">
          Total:
          <strong className="ml-2">
            ${String(booking.totalAmount ?? "")}
          </strong>
        </p>
      </div>

      <h2 className="mt-10 text-2xl font-semibold">
        Passengers
      </h2>

      <div className="mt-5 space-y-4">
        {booking.passengers.map((passenger: TicketPassenger) => (
          <div
            key={passenger.id}
            className="rounded-xl border p-5"
          >
            <h3 className="font-semibold">
              {passenger.firstName} {passenger.lastName}
            </h3>

            <p className="mt-2">
              Seat:
              <strong className="ml-2">
                {passenger.seat?.seatNumber}
              </strong>
            </p>

            <p className="mt-2">
              Class:
              <strong className="ml-2">
                {passenger.seat?.seatClass}
              </strong>
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
