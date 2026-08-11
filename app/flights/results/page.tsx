import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Plane,
  PlaneTakeoff,
  Search,
  Ticket,
  UsersRound,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

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
  scheduleId?: string;

  flightCode: string;
  flightNumber?: string;

  airlineName: string;
  airlineCode?: string | null;

  aircraftName: string | null;
  aircraftId?: string | null;
  aircraftRegistration?: string | null;

  originCode: string;
  originCity: string | null;
  originAirport?: string | null;

  destinationCode: string;
  destinationCity: string | null;
  destinationAirport?: string | null;

  departureDate: string;
  departureTime: string;

  arrivalTime: string | null;

  duration: string | null;

  seatsAvailable: number;

  price: string;
  currency: string;

  status: string;

  departureTerminal?: string | null;
  departureGate?: string | null;

  arrivalTerminal?: string | null;
  arrivalGate?: string | null;
};

/* =========================================================
   PAGE
========================================================= */

export default async function FlightResultsPage({
  searchParams,
}: ResultsPageProps) {
  const params = await searchParams;

  const tripType =
    params.tripType || "ONE_WAY";

  const originCode =
    params.originCode?.trim().toUpperCase() || "";

  const destinationCode =
    params.destinationCode?.trim().toUpperCase() || "";

  const departureDate =
    params.departureDate || "";

  const returnDate =
    params.returnDate || "";

  const passengersCount =
    params.passengersCount || "1";

  /* =======================================================
     BUILD SEARCH QUERY
  ======================================================= */

  const query = new URLSearchParams({
    originCode,
    destinationCode,
    departureDate,
    passengersCount,
  });

  let flights: Flight[] = [];
  let errorMessage = "";

    /* =======================================================
     FETCH FLIGHTS
  ======================================================= */

  try {
    /**
     * IMPORTANT:
     *
     * NEXTAUTH_URL comes from the environment.
     *
     * Local:
     * NEXTAUTH_URL=http://localhost:3000
     *
     * Vercel:
     * NEXTAUTH_URL=https://starjet.vercel.app
     *
     * This prevents Vercel from trying to call localhost.
     */

    const baseUrl =
      process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
      "http://localhost:3000";

    const apiUrl =
      `${baseUrl}/api/flights/search?${query.toString()}`;

    const response = await fetch(apiUrl, {
      cache: "no-store",
    });

    let result;

    try {
      result = await response.json();
    } catch {
      throw new Error(
        `Flight search API returned an invalid response (${response.status}).`
      );
    }

    if (response.ok && result.success) {
      flights = Array.isArray(result.data)
        ? result.data
        : [];
    } else {
      errorMessage =
        result?.message ||
        "We couldn't retrieve flights for this search.";
    }
  } catch (error) {
    console.error(
      "FLIGHT RESULTS FETCH ERROR:",
      error
    );

    errorMessage =
      "Flight availability is temporarily unavailable. Please try again.";
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f6f8fb]">
        {/* ===================================================
            SEARCH HEADER
        =================================================== */}

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              {/* LEFT */}

              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                  <PlaneTakeoff className="h-4 w-4" />

                  Flight results
                </div>

                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[28px]">
                  {originCode || "Origin"}{" "}
                  <span className="font-normal text-slate-400">
                    to
                  </span>{" "}
                  {destinationCode || "Destination"}
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  {formatDate(departureDate)}

                  <span className="mx-2 text-slate-300">
                    ·
                  </span>

                  {passengersCount}{" "}
                  {Number(passengersCount) === 1
                    ? "traveler"
                    : "travelers"}
                </p>
              </div>

              {/* MODIFY */}

              <Link
                href="/flights"
                className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
              >
                <Search className="h-4 w-4" />

                Modify search
              </Link>
            </div>

            {/* ===============================================
                SEARCH SUMMARY
            =============================================== */}

            <div className="mt-7 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="grid sm:grid-cols-2 lg:grid-cols-5">
                <SummaryItem
                  icon={
                    <Ticket className="h-4 w-4" />
                  }
                  label="Trip"
                  value={formatTripType(
                    tripType
                  )}
                />

                <SummaryItem
                  icon={
                    <PlaneTakeoff className="h-4 w-4" />
                  }
                  label="Route"
                  value={`${originCode || "--"} → ${
                    destinationCode || "--"
                  }`}
                />

                <SummaryItem
                  icon={
                    <UsersRound className="h-4 w-4" />
                  }
                  label="Travelers"
                  value={passengersCount}
                />

                <SummaryItem
                  icon={
                    <CalendarDays className="h-4 w-4" />
                  }
                  label="Departure"
                  value={formatDate(
                    departureDate
                  )}
                />

                <SummaryItem
                  icon={
                    <CalendarDays className="h-4 w-4" />
                  }
                  label="Return"
                  value={
                    tripType === "ROUND_TRIP" &&
                    returnDate
                      ? formatDate(
                          returnDate
                        )
                      : "One way"
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            RESULTS
        =================================================== */}

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* ERROR */}

          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-white p-6">
              <h2 className="text-base font-semibold text-slate-950">
                Flight search unavailable
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {errorMessage}
              </p>

              <Link
                href="/flights"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Return to flight search

                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {/* NO RESULTS */}

          {!errorMessage &&
            flights.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                  <Plane className="h-5 w-5 text-slate-500" />
                </div>

                <h2 className="mt-4 text-lg font-semibold text-slate-950">
                  No flights available
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  There are currently no available
                  flights matching this route, date,
                  and traveler count.
                </p>

                <Link
                  href="/flights"
                  className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Change search

                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

          {/* FLIGHTS */}

          {!errorMessage &&
            flights.length > 0 && (
              <>
                {/* RESULT COUNT */}

                <div className="mb-4 flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-800">
                    {flights.length}{" "}
                    {flights.length === 1
                      ? "flight"
                      : "flights"}{" "}
                    available
                  </p>

                  <p className="hidden text-xs text-slate-500 sm:block">
                    Prices shown per traveler
                  </p>
                </div>

                {/* CARDS */}

                <div className="space-y-4">
                  {flights.map(
                    (flight) => (
                      <FlightCard
                        key={flight.id}
                        flight={flight}
                        tripType={tripType}
                        returnDate={
                          returnDate
                        }
                        passengersCount={
                          passengersCount
                        }
                      />
                    )
                  )}
                </div>
              </>
            )}
        </section>
      </main>

      <Footer />
    </>
  );
}

/* =========================================================
   SUMMARY ITEM
========================================================= */

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-slate-200 px-4 py-4 last:border-b-0 sm:px-5 lg:border-b-0 lg:border-r lg:last:border-r-0">
      <div className="flex items-center gap-2 text-blue-600">
        {icon}

        <span className="text-[10px] font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>

      <p className="mt-2 truncate text-sm font-medium text-slate-900">
        {value || "—"}
      </p>
    </div>
  );
}

/* =========================================================
   FLIGHT CARD
========================================================= */

function FlightCard({
  flight,
  tripType,
  returnDate,
  passengersCount,
}: {
  flight: Flight;
  tripType: string;
  returnDate: string;
  passengersCount: string;
}) {
  /* =======================================================
     PASSENGER PAGE URL

     We pass display information for the next screen,
     but the booking API must still validate scheduleId
     against the database before creating the booking.
  ======================================================= */

  const passengerParams =
    new URLSearchParams({
      scheduleId:
        flight.scheduleId ||
        flight.id,

      tripType,

      airline:
        flight.airlineName,

      airlineCode:
        flight.airlineCode || "",

      flightCode:
        flight.flightCode,

      aircraft:
        flight.aircraftName || "",

      originCode:
        flight.originCode,

      originCity:
        flight.originCity || "",

      originAirport:
        flight.originAirport || "",

      destinationCode:
        flight.destinationCode,

      destinationCity:
        flight.destinationCity || "",

      destinationAirport:
        flight.destinationAirport || "",

      departureDate:
        flight.departureDate,

      departureTime:
        flight.departureTime,

      arrivalTime:
        flight.arrivalTime || "",

      returnDate,

      passengersCount,

      price:
        flight.price,

      currency:
        flight.currency || "USD",
    });

  const passengerUrl =
    `/passengers?${passengerParams.toString()}`;

  const departureTerminal =
    cleanOperationalValue(
      flight.departureTerminal
    );

  const departureGate =
    cleanOperationalValue(
      flight.departureGate
    );

  const arrivalTerminal =
    cleanOperationalValue(
      flight.arrivalTerminal
    );

  const arrivalGate =
    cleanOperationalValue(
      flight.arrivalGate
    );

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
      {/* ===================================================
          AIRLINE HEADER
      =================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#07152f] text-white">
            <Plane className="h-[18px] w-[18px]" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">
              {flight.airlineName}
            </p>

            <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
              <span>
                {flight.flightCode}
              </span>

              {flight.aircraftName && (
                <>
                  <span>·</span>

                  <span>
                    {cleanAircraftName(
                      flight.aircraftName
                    )}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <FlightStatus
          status={flight.status}
        />
      </div>

      {/* ===================================================
          CARD BODY
      =================================================== */}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_240px]">
        {/* =================================================
            FLIGHT INFORMATION
        ================================================= */}

        <div className="min-w-0 px-5 py-6 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)] sm:items-center">
            {/* DEPARTURE */}

            <FlightLocation
              time={formatTime(
                flight.departureTime
              )}
              code={flight.originCode}
              city={flight.originCity}
              airport={
                flight.originAirport
              }
              date={formatDate(
                flight.departureTime
              )}
            />

            {/* ROUTE LINE */}

            <div className="hidden sm:block">
              <p className="text-center text-xs font-medium text-slate-500">
                {flight.duration ||
                  calculateDuration(
                    flight.departureTime,
                    flight.arrivalTime
                  )}
              </p>

              <div className="my-2 flex items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />

                <span className="h-px flex-1 bg-slate-300" />

                <PlaneTakeoff className="mx-2 h-4 w-4 shrink-0 text-blue-600" />

                <span className="h-px flex-1 bg-slate-300" />

                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              </div>

              <p className="text-center text-[11px] text-slate-400">
                Nonstop
              </p>
            </div>

            {/* ARRIVAL */}

            <FlightLocation
              right
              time={
                flight.arrivalTime
                  ? formatTime(
                      flight.arrivalTime
                    )
                  : "—"
              }
              code={
                flight.destinationCode
              }
              city={
                flight.destinationCity
              }
              airport={
                flight.destinationAirport
              }
              date={
                flight.arrivalTime
                  ? formatDate(
                      flight.arrivalTime
                    )
                  : ""
              }
            />
          </div>

          {/* =================================================
              OPERATIONAL DETAILS

              Only render values that actually exist in DB.
          ================================================= */}

          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4 border-t border-slate-100 pt-4">
            <FlightDetail
              icon={
                <Clock3 className="h-3.5 w-3.5" />
              }
              label="Duration"
              value={
                flight.duration ||
                calculateDuration(
                  flight.departureTime,
                  flight.arrivalTime
                )
              }
            />

            {flight.aircraftName && (
              <FlightDetail
                icon={
                  <Plane className="h-3.5 w-3.5" />
                }
                label="Aircraft"
                value={cleanAircraftName(
                  flight.aircraftName
                )}
              />
            )}

            {departureTerminal && (
              <FlightDetail
                label="Departure terminal"
                value={
                  departureTerminal
                }
              />
            )}

            {departureGate && (
              <FlightDetail
                label="Departure gate"
                value={
                  departureGate
                }
              />
            )}

            {arrivalTerminal && (
              <FlightDetail
                label="Arrival terminal"
                value={
                  arrivalTerminal
                }
              />
            )}

            {arrivalGate && (
              <FlightDetail
                label="Arrival gate"
                value={arrivalGate}
              />
            )}
          </div>
        </div>

        {/* =================================================
            FARE
        ================================================= */}

        <div className="flex flex-col justify-center border-t border-slate-200 bg-[#fafbfc] px-5 py-6 lg:border-l lg:border-t-0">
          <p className="text-xs text-slate-500">
            Fare per traveler
          </p>

          <p className="mt-1 text-[28px] font-semibold tracking-tight text-slate-950">
            {formatCurrency(
              flight.price,
              flight.currency
            )}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Taxes and fees calculated
            at checkout
          </p>

          <Link
            href={passengerUrl}
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Select flight

            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   FLIGHT LOCATION
========================================================= */

function FlightLocation({
  time,
  code,
  city,
  airport,
  date,
  right = false,
}: {
  time: string;
  code: string;
  city?: string | null;
  airport?: string | null;
  date: string;
  right?: boolean;
}) {
  return (
    <div
      className={
        right
          ? "min-w-0 sm:text-right"
          : "min-w-0"
      }
    >
      <div
        className={`flex flex-wrap items-baseline gap-2 ${
          right
            ? "sm:justify-end"
            : ""
        }`}
      >
        <span className="text-[26px] font-semibold tracking-tight text-slate-950">
          {time}
        </span>

        <span className="text-sm font-medium text-slate-500">
          {code}
        </span>
      </div>

      {city && (
        <p className="mt-1 text-sm font-medium text-slate-700">
          {city}
        </p>
      )}

      {airport && (
        <p
          className="mt-1 text-xs leading-5 text-slate-500"
          title={airport}
        >
          {airport}
        </p>
      )}

      {date && (
        <p className="mt-2 text-xs text-slate-400">
          {date}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   FLIGHT DETAIL
========================================================= */

function FlightDetail({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      {icon && (
        <span className="mt-0.5 text-blue-600">
          {icon}
        </span>
      )}

      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 text-xs font-medium text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   STATUS
========================================================= */

function FlightStatus({
  status,
}: {
  status: string;
}) {
  const normalized =
    status?.trim().toUpperCase();

  if (
    normalized === "SCHEDULED" ||
    normalized === "ACTIVE"
  ) {
    return (
      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
        {normalized === "ACTIVE"
          ? "Available"
          : "Scheduled"}
      </span>
    );
  }

  if (normalized === "DELAYED") {
    return (
      <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
        Delayed
      </span>
    );
  }

  if (normalized === "CANCELLED") {
    return (
      <span className="rounded-full bg-red-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
        Cancelled
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
      {formatStatus(status)}
    </span>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatTripType(
  value: string
) {
  switch (value) {
    case "ROUND_TRIP":
      return "Round trip";

    case "ONE_WAY":
      return "One way";

    case "MULTI_CITY":
      return "Multi-city";

    default:
      return value
        .replaceAll("_", " ")
        .toLowerCase();
  }
}

function formatStatus(
  value: string
) {
  if (!value) {
    return "Scheduled";
  }

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatDate(
  value:
    | string
    | Date
    | null
    | undefined
) {
  if (!value) {
    return "Not set";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Not set";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(date);
}

function formatTime(
  value:
    | string
    | Date
    | null
    | undefined
) {
  if (!value) {
    return "—";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    }
  ).format(date);
}

function formatCurrency(
  value:
    | string
    | number,
  currency = "USD"
) {
  const amount =
    Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  try {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency:
          currency || "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    ).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function calculateDuration(
  departure:
    | string
    | null,
  arrival:
    | string
    | null
) {
  if (!departure || !arrival) {
    return "—";
  }

  const start =
    new Date(departure);

  const end =
    new Date(arrival);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return "—";
  }

  const milliseconds =
    end.getTime() -
    start.getTime();

  if (milliseconds <= 0) {
    return "—";
  }

  const totalMinutes =
    Math.floor(
      milliseconds / 60000
    );

  const hours =
    Math.floor(
      totalMinutes / 60
    );

  const minutes =
    totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

function cleanAircraftName(
  value: string
) {
  const text =
    value.trim();

  /*
   * Protects against values such as:
   * "Boeing Boeing 737-800"
   */

  const words =
    text.split(/\s+/);

  if (
    words.length > 1 &&
    words[0].toLowerCase() ===
      words[1].toLowerCase()
  ) {
    words.splice(1, 1);
  }

  return words.join(" ");
}

function cleanOperationalValue(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return null;
  }

  const cleaned =
    value.trim();

  if (
    !cleaned ||
    cleaned === "-" ||
    cleaned.toLowerCase() ===
      "null" ||
    cleaned.toLowerCase() ===
      "undefined"
  ) {
    return null;
  }

  return cleaned;
}