import Link from "next/link";

type ResultsPageProps = {
  searchParams: Promise<{
    tripType?: string;
    originCode?: string;
    destinationCode?: string;
    departureDate?: string;
    returnDate?: string;
    passengersCount?: string;
  }>;
};

type Flight = {
  id: string;
  flightCode: string;
  airlineName: string;
  aircraftName: string | null;
  originCode: string;
  originCity: string | null;
  destinationCode: string;
  destinationCity: string | null;
  departureDate: string;
  departureTime: string;
  arrivalTime: string | null;
  duration: string | null;
  seatsAvailable: number;
  price: string;
  currency: string;
  status: string;
};

export default async function FlightResultsPage({
  searchParams,
}: ResultsPageProps) {
  const params = await searchParams;

  const query = new URLSearchParams({
    originCode: params.originCode || "",
    destinationCode: params.destinationCode || "",
    departureDate: params.departureDate || "",
    passengersCount: params.passengersCount || "1",
  });

  const response = await fetch(
    `http://localhost:3000/api/flights/search?${query.toString()}`,
    { cache: "no-store" }
  );

  const result = await response.json();
  const flights: Flight[] = result.success ? result.data : [];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">
            Flight Results
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-950">
            Available SkyBridge Flights
          </h1>

          <p className="mt-4 text-slate-600">
            Showing available flights from your database.
          </p>
        </div>

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">Trip Type</p>
              <p className="font-semibold text-slate-950">
                {params.tripType || "ROUND_TRIP"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Route</p>
              <p className="font-semibold text-slate-950">
                {params.originCode} → {params.destinationCode}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Passengers</p>
              <p className="font-semibold text-slate-950">
                {params.passengersCount || "1"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Departure</p>
              <p className="font-semibold text-slate-950">
                {params.departureDate}
              </p>
            </div>

            {params.returnDate && (
              <div>
                <p className="text-sm text-slate-500">Return</p>
                <p className="font-semibold text-slate-950">
                  {params.returnDate}
                </p>
              </div>
            )}
          </div>
        </div>

        {flights.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            No flights found for this route.
          </div>
        ) : (
          <div className="space-y-4">
            {flights.map((flight) => (
              <FlightCard
                key={flight.id}
                flight={flight}
                returnDate={params.returnDate || ""}
                passengersCount={params.passengersCount || "1"}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function FlightCard({
  flight,
  returnDate,
  passengersCount,
}: {
  flight: Flight;
  returnDate: string;
  passengersCount: string;
}) {
  const passengerUrl = `/passengers?flightId=${flight.id}&airline=${encodeURIComponent(
    flight.airlineName
  )}&originCode=${flight.originCode}&destinationCode=${
    flight.destinationCode
  }&departureDate=${flight.departureDate}&returnDate=${returnDate}&passengersCount=${passengersCount}&price=${flight.price}`;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            {flight.airlineName}
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-950">
            {flight.originCode} → {flight.destinationCode}
          </h2>

          <p className="mt-2 text-slate-600">
            {flight.departureTime}
            {flight.arrivalTime ? ` - ${flight.arrivalTime}` : ""}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Flight: {flight.flightCode}
          </p>
        </div>

        <div className="grid gap-4 text-sm text-slate-600 md:grid-cols-2">
          <div>
            <p className="text-slate-500">Aircraft</p>
            <p className="font-semibold text-slate-950">
              {flight.aircraftName || "SkyBridge Aircraft"}
            </p>
          </div>

          <div>
            <p className="text-slate-500">Duration</p>
            <p className="font-semibold text-slate-950">
              {flight.duration || "TBD"}
            </p>
          </div>

          <div>
            <p className="text-slate-500">Seats</p>
            <p className="font-semibold text-slate-950">
              {flight.seatsAvailable} available
            </p>
          </div>
        </div>

        <div className="text-left md:text-right">
          <p className="text-2xl font-bold text-slate-950">
            ${flight.price}
          </p>

          <Link
            href={passengerUrl}
            className="mt-3 inline-block rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Select Flight
          </Link>
        </div>
      </div>
    </div>
  );
}