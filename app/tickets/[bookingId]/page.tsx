import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    bookingId: string;
  }>;
};

async function getTicket(bookingId: string) {
  const res = await fetch(
    `http://localhost:3000/api/tickets/${bookingId}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export default async function TicketPage({
  params,
}: Props) {
  const { bookingId } = await params;

  const response = await getTicket(bookingId);

  if (!response?.success) {
    notFound();
  }

  const booking = response.data;

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
            ${booking.totalAmount}
          </strong>
        </p>
      </div>

      <h2 className="mt-10 text-2xl font-semibold">
        Passengers
      </h2>

      <div className="mt-5 space-y-4">
        {booking.passengers.map((passenger: any) => (
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