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

export default async function FlightResultsPage({
  searchParams,
}: ResultsPageProps) {
  const params = await searchParams;

  const flights = [
    {
      airline: "Sunrise Airways",
      route: `${params.originCode} → ${params.destinationCode}`,
      time: "08:30 AM - 12:45 PM",
      duration: "4h 15m",
      stops: "1 Stop",
      price: "485",
    },
    {
      airline: "American Airlines",
      route: `${params.originCode} → ${params.destinationCode}`,
      time: "11:10 AM - 05:30 PM",
      duration: "6h 20m",
      stops: "1 Stop",
      price: "625",
    },
    {
      airline: "JetBlue",
      route: `${params.originCode} → ${params.destinationCode}`,
      time: "02:40 PM - 09:15 PM",
      duration: "6h 35m",
      stops: "1 Stop",
      price: "710",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">
            Flight Results
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-950">
            Available Flights
          </h1>

          <p className="mt-4 text-slate-600">
            Showing flight options for your selected route.
          </p>
        </div>

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">Trip Type</p>
              <p className="font-semibold text-slate-950">
                {params.tripType}
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
                {params.passengersCount}
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

        <div className="space-y-4">
          {flights.map((flight) => (
            <FlightCard
              key={flight.airline}
              airline={flight.airline}
              route={flight.route}
              time={flight.time}
              duration={flight.duration}
              stops={flight.stops}
              price={flight.price}
              originCode={params.originCode || ""}
              destinationCode={params.destinationCode || ""}
              departureDate={params.departureDate || ""}
              returnDate={params.returnDate || ""}
              passengersCount={params.passengersCount || "1"}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function FlightCard({
  airline,
  route,
  time,
  duration,
  stops,
  price,
  originCode,
  destinationCode,
  departureDate,
  returnDate,
  passengersCount,
}: {
  airline: string;
  route: string;
  time: string;
  duration: string;
  stops: string;
  price: string;
  originCode: string;
  destinationCode: string;
  departureDate: string;
  returnDate: string;
  passengersCount: string;
}) {
  const passengerUrl = `/passengers?airline=${encodeURIComponent(
    airline
  )}&originCode=${originCode}&destinationCode=${destinationCode}&departureDate=${departureDate}&returnDate=${returnDate}&passengersCount=${passengersCount}&price=${price}`;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            {airline}
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-950">{route}</h2>
          <p className="mt-2 text-slate-600">{time}</p>
        </div>

        <div className="grid gap-4 text-sm text-slate-600 md:grid-cols-2">
          <div>
            <p className="text-slate-500">Duration</p>
            <p className="font-semibold text-slate-950">{duration}</p>
          </div>

          <div>
            <p className="text-slate-500">Stops</p>
            <p className="font-semibold text-slate-950">{stops}</p>
          </div>
        </div>

        <div className="text-left md:text-right">
          <p className="text-2xl font-bold text-slate-950">${price}</p>

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