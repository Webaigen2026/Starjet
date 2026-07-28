import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Plane,
  PlaneTakeoff,
  Ticket,
  UsersRound,
} from "lucide-react";

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
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 text-white">
        <section className="relative overflow-hidden px-4 py-12 sm:px-6 lg:py-16">
          <div
            className="absolute inset-0 scale-110 bg-cover bg-center opacity-[0.24] blur-md"
            style={{ backgroundImage: "url('/image/hero-bck.jpeg')" }}
          />
          <div className="absolute inset-0 bg-slate-950/82" />
          <div className="absolute inset-x-0 top-0 h-56 bg-cyan-400/10 blur-3xl" />
          <Plane className="pointer-events-none absolute right-8 top-24 h-56 w-56 -rotate-12 text-white/5" />

          <div className="relative mx-auto max-w-6xl">
            <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
                  <PlaneTakeoff className="h-4 w-4" />
                  Flight results
                </p>

                <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
                  Available SkyBridge aircraft.
                </h1>

                <p className="mt-5 text-lg leading-8 text-slate-300">
                  Showing available flights from your database for the selected
                  route and passenger count.
                </p>
              </div>

              <Link
                href="/flights"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white hover:text-slate-950"
              >
                Modify search
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mb-8 overflow-hidden rounded-[28px] border border-white/15 bg-white text-slate-950 shadow-2xl shadow-slate-950/30">
              <div className="grid gap-0 md:grid-cols-5">
                <SummaryItem label="Trip Type" value={params.tripType || "ROUND_TRIP"} icon={<Ticket className="h-5 w-5" />} />
                <SummaryItem label="Route" value={`${params.originCode || "--"} to ${params.destinationCode || "--"}`} icon={<PlaneTakeoff className="h-5 w-5" />} />
                <SummaryItem label="Passengers" value={params.passengersCount || "1"} icon={<UsersRound className="h-5 w-5" />} />
                <SummaryItem label="Departure" value={params.departureDate || "Not set"} icon={<CalendarDays className="h-5 w-5" />} />
                <SummaryItem label="Return" value={params.returnDate || "One way"} icon={<CalendarDays className="h-5 w-5" />} />
              </div>
            </div>

            {flights.length === 0 ? (
              <div className="rounded-[28px] border border-white/15 bg-white p-8 text-slate-600 shadow-2xl shadow-slate-950/30">
                <p className="text-xl font-black text-slate-950">
                  No flights found for this route.
                </p>
                <p className="mt-2 text-sm leading-6">
                  Try another aircraft route, date, or passenger count from the
                  flight search page.
                </p>
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
        </section>
      </main>
      <Footer />
    </>
  );
}

function SummaryItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-200 p-5 md:border-b-0 md:border-r md:last:border-r-0">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-800">
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-black text-slate-950">{value}</p>
    </div>
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
    <div className="overflow-hidden rounded-[28px] border border-white/15 bg-white text-slate-950 shadow-xl shadow-slate-950/25">
      <div className="grid gap-6 p-5 md:grid-cols-[1fr_1fr_auto] md:items-center md:p-6">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-800">
            <PlaneTakeoff className="h-4 w-4" />
            {flight.airlineName}
          </p>

          <h2 className="mt-4 text-2xl font-black text-slate-950">
            {flight.originCode} to {flight.destinationCode}
          </h2>

          <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-600">
            <Clock3 className="h-4 w-4 text-cyan-700" />
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

        <div className="rounded-2xl bg-slate-50 p-4 text-left md:text-right">
          <p className="text-3xl font-black text-slate-950">
            ${flight.price}
          </p>

          <Link
            href={passengerUrl}
            className="mt-3 inline-flex h-12 items-center justify-center rounded-2xl bg-cyan-500 px-6 text-sm font-black text-slate-950 hover:bg-cyan-400"
          >
            Select Flight
          </Link>
        </div>
      </div>
    </div>
  );
}
