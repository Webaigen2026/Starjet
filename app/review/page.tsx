import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  LockKeyhole,
  Pencil,
  Plane,
} from "lucide-react";

import { authOptions } from "../api/auth/[...nextauth]/route";
import { authorizeBookingAccess } from "../lib/authorization";
import { expireUnpaidReservation } from "../lib/reservationLifecycle";
import prisma from "../lib/prisma";
import ReviewActions from "./ReviewActions";

/* =========================================================
   TYPES
========================================================= */

type ReviewPageProps = {
  searchParams: Promise<{
    bookingId?: string;
  }>;
};

/* =========================================================
   HELPERS
========================================================= */

function formatDate(
  value: Date | string | null | undefined
) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(
  value: Date | string | null | undefined
) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatDuration(
  minutes: number | null | undefined
) {
  if (!minutes || minutes <= 0) {
    return "—";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function displayValue(
  value: string | null | undefined
) {
  const cleanValue = value?.trim();

  return cleanValue ? cleanValue : "—";
}

function maskPassport(
  value: string | null | undefined
) {
  if (!value) {
    return "—";
  }

  const cleaned = value.trim();

  if (!cleaned) {
    return "—";
  }

  if (cleaned.length <= 4) {
    return `••••${cleaned}`;
  }

  return `••••${cleaned.slice(-4)}`;
}

function travelerName(
  firstName: string,
  middleName: string | null,
  lastName: string
) {
  return [firstName, middleName, lastName]
    .filter(Boolean)
    .join(" ");
}

/* =========================================================
   PAGE
========================================================= */

export default async function ReviewPage({
  searchParams,
}: ReviewPageProps) {
  const params = await searchParams;

  const bookingId = params.bookingId;

  if (!bookingId) {
    redirect("/flights");
  }

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  await expireUnpaidReservation(prisma, bookingId);

  const booking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },

    include: {
      passengers: {
        orderBy: {
          createdAt: "asc",
        },
      },

      schedule: {
        include: {
          aircraft: true,

          route: {
            include: {
              airline: true,
              originAirport: true,
              destinationAirport: true,
            },
          },
        },
      },
    },
  });

  if (!booking) {
    redirect("/flights");
  }

  if (booking.status === "FAILED" || booking.status === "CANCELLED") {
    redirect("/flights");
  }

  const access = authorizeBookingAccess(
    session.user as { id?: string; role?: "ADMIN" | "STAFF" | "CUSTOMER" },
    booking
  );

  if (!access.authorized) {
    redirect("/flights");
  }

  /* =======================================================
     DATABASE VALUES
  ======================================================= */

  const schedule = booking.schedule;
  const route = schedule.route;
  const airline = route.airline;
  const aircraft = schedule.aircraft;

  const originAirport = route.originAirport;
  const destinationAirport =
    route.destinationAirport;

  /* =======================================================
     FLIGHT INFORMATION
  ======================================================= */

  const airlineName =
    airline.name ||
    booking.airlineName ||
    "StarJet Airlines";

  const flightNumber =
    route.flightNumber ||
    booking.flightNumber ||
    "—";

  const aircraftName = [
    aircraft.manufacturer,
    aircraft.model,
  ]
    .filter(Boolean)
    .join(" ");

  const originCode =
    originAirport.iataCode ||
    booking.originCode;

  const destinationCode =
    destinationAirport.iataCode ||
    booking.destinationCode;

  const originCity =
    originAirport.city ||
    booking.originCity ||
    originCode;

  const destinationCity =
    destinationAirport.city ||
    booking.destinationCity ||
    destinationCode;

  const baseFare = Number(
    booking.baseFare ??
      schedule.baseFare ??
      0
  );

  const currency =
    booking.currency || "USD";

  const travelerCount =
    booking.passengers.length ||
    booking.passengersCount ||
    1;

  /* =======================================================
     EDIT URL

     IMPORTANT:
     Your actual traveler page is:

       app/passengers/page.tsx

     therefore the URL must be /passengers.
  ======================================================= */

  const travelerEditUrl =
    `/passengers?bookingId=${encodeURIComponent(
      booking.id
    )}&mode=edit`;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#f5f7fa] text-slate-950">
      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1450px] px-5 py-8 sm:px-8 lg:px-10">
          <Link
            href={travelerEditUrl}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={17} />
            Edit traveler details
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[38px]">
                Review your trip
              </h1>

              <p className="mt-3 max-w-2xl text-[15px] leading-6 text-slate-500">
                Review your flight, traveler and
                contact information before continuing
                to payment.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <LockKeyhole
                size={17}
                strokeWidth={1.8}
              />

              Secure booking
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <div className="mx-auto grid max-w-[1450px] grid-cols-1 gap-7 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_370px] lg:px-10 lg:py-10">
        {/* =================================================
            LEFT COLUMN
        ================================================= */}

        <div className="space-y-6">
          {/* ===============================================
              FLIGHT
          =============================================== */}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-7 py-5">
              <h2 className="text-lg font-semibold">
                Flight
              </h2>

              <Link
                href="/flights"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
                <Pencil size={15} />
                Edit
              </Link>
            </div>

            <div className="px-7 py-7">
              {/* AIRLINE */}

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-[17px] font-semibold text-slate-950">
                    {airlineName}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {flightNumber}

                    {aircraftName && (
                      <>
                        {" "}
                        · {aircraftName}
                      </>
                    )}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                  {schedule.status}
                </span>
              </div>

              <div className="my-6 border-t border-slate-100" />

              {/* ROUTE */}

              <div className="grid grid-cols-1 items-center gap-7 md:grid-cols-[1fr_230px_1fr]">
                {/* DEPARTURE */}

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[30px] font-semibold tracking-tight">
                      {formatTime(
                        schedule.departureTime
                      )}
                    </span>

                    <span className="text-sm font-semibold text-slate-500">
                      {originCode}
                    </span>
                  </div>

                  <p className="mt-3 font-semibold">
                    {originCity}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {originAirport.name}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                    <CalendarDays size={15} />

                    {formatDate(
                      schedule.departureTime
                    )}
                  </div>

                  {schedule.departureTerminal && (
                    <p className="mt-2 text-xs text-slate-400">
                      Terminal{" "}
                      {schedule.departureTerminal}

                      {schedule.departureGate
                        ? ` · Gate ${schedule.departureGate}`
                        : ""}
                    </p>
                  )}
                </div>

                {/* FLIGHT PATH */}

                <div className="hidden md:block">
                  <p className="mb-3 text-center text-sm text-slate-500">
                    {formatDuration(
                      route.estimatedDuration
                    )}
                  </p>

                  <div className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-blue-600" />

                    <span className="h-px flex-1 bg-slate-300" />

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <Plane
                        size={17}
                        strokeWidth={1.8}
                      />
                    </span>

                    <span className="h-px flex-1 bg-slate-300" />

                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                  </div>

                  <p className="mt-3 text-center text-sm text-slate-500">
                    Nonstop
                  </p>
                </div>

                {/* ARRIVAL */}

                <div className="md:text-right">
                  <div className="flex items-baseline gap-2 md:justify-end">
                    <span className="text-[30px] font-semibold tracking-tight">
                      {formatTime(
                        schedule.arrivalTime
                      )}
                    </span>

                    <span className="text-sm font-semibold text-slate-500">
                      {destinationCode}
                    </span>
                  </div>

                  <p className="mt-3 font-semibold">
                    {destinationCity}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {destinationAirport.name}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 md:justify-end">
                    <CalendarDays size={15} />

                    {formatDate(
                      schedule.arrivalTime
                    )}
                  </div>

                  {schedule.arrivalTerminal && (
                    <p className="mt-2 text-xs text-slate-400">
                      Terminal{" "}
                      {schedule.arrivalTerminal}

                      {schedule.arrivalGate
                        ? ` · Gate ${schedule.arrivalGate}`
                        : ""}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ===============================================
              TRAVELERS
          =============================================== */}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-7 py-5">
              <div>
                <h2 className="text-lg font-semibold">
                  Traveler
                  {travelerCount > 1 ? "s" : ""}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Verify that each traveler&apos;s
                  information matches their travel
                  document.
                </p>
              </div>

              <Link
                href={travelerEditUrl}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
                <Pencil size={15} />
                Edit
              </Link>
            </div>

            {booking.passengers.length === 0 ? (
              <div className="px-7 py-8">
                <p className="text-sm text-slate-500">
                  Traveler information has not been
                  added yet.
                </p>

                <Link
                  href={travelerEditUrl}
                  className="mt-4 inline-flex text-sm font-semibold text-blue-600 hover:underline"
                >
                  Add traveler information
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {booking.passengers.map(
                  (passenger, index) => (
                    <div
                      key={passenger.id}
                      className="px-7 py-7"
                    >
                      {/* NAME */}

                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
                          {index + 1}
                        </div>

                        <div>
                          <p className="text-[17px] font-semibold text-slate-950">
                            {travelerName(
                              passenger.firstName,
                              passenger.middleName,
                              passenger.lastName
                            )}
                          </p>

                          <p className="mt-0.5 text-sm text-slate-500">
                            Traveler {index + 1}
                          </p>
                        </div>
                      </div>

                      {/* DETAILS */}

                      <dl className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                            Date of birth
                          </dt>

                          <dd className="mt-2 text-[15px] font-medium text-slate-900">
                            {formatDate(
                              passenger.dateOfBirth
                            )}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                            Gender
                          </dt>

                          <dd className="mt-2 text-[15px] font-medium capitalize text-slate-900">
                            {displayValue(
                              passenger.gender
                            )}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                            Nationality
                          </dt>

                          <dd className="mt-2 text-[15px] font-medium text-slate-900">
                            {displayValue(
                              passenger.nationality
                            )}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                            Passport number
                          </dt>

                          <dd className="mt-2 text-[15px] font-medium text-slate-900">
                            {maskPassport(
                              passenger.passportNumber
                            )}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                            Country of issue
                          </dt>

                          <dd className="mt-2 text-[15px] font-medium text-slate-900">
                            {displayValue(
                              passenger.passportCountry
                            )}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                            Passport expiry
                          </dt>

                          <dd className="mt-2 text-[15px] font-medium text-slate-900">
                            {formatDate(
                              passenger.passportExpiry
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          {/* ===============================================
              CONTACT INFORMATION
          =============================================== */}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-7 py-5">
              <div>
                <h2 className="text-lg font-semibold">
                  Contact information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Booking confirmation and important
                  trip updates will be sent here.
                </p>
              </div>

              <Link
                href={travelerEditUrl}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
                <Pencil size={15} />
                Edit
              </Link>
            </div>

            <dl className="grid gap-7 px-7 py-7 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                  Contact name
                </dt>

                <dd className="mt-2 text-[15px] font-medium text-slate-900">
                  {displayValue(
                    booking.customerName
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                  Email address
                </dt>

                <dd className="mt-2 break-all text-[15px] font-medium text-slate-900">
                  {displayValue(
                    booking.customerEmail
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                  Phone number
                </dt>

                <dd className="mt-2 text-[15px] font-medium text-slate-900">
                  {displayValue(
                    booking.customerPhone
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {/* ===============================================
              BEFORE CONTINUING
          =============================================== */}

          <section className="rounded-xl border border-slate-200 bg-white px-7 py-7 shadow-sm">
            <h2 className="text-lg font-semibold">
              Before you continue
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Check these details carefully before
              proceeding to payment.
            </p>

            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3">
                <Check
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />

                <p className="text-sm leading-6 text-slate-600">
                  Traveler names must match the travel
                  documents presented at the airport.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Check
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />

                <p className="text-sm leading-6 text-slate-600">
                  Confirm that passport details and
                  expiration dates are correct for
                  this itinerary.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Check
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />

                <p className="text-sm leading-6 text-slate-600">
                  Entry and travel-document
                  requirements may vary by destination
                  and traveler nationality.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* =================================================
            RIGHT COLUMN

            ReviewActions handles:
            - travel protection
            - promo code
            - confirmation
            - terms
            - total
            - continue to payment
        ================================================= */}

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <ReviewActions
            bookingId={booking.id}
            baseFare={baseFare}
            currency={currency}
            travelerCount={travelerCount}
            originCode={originCode}
            destinationCode={destinationCode}
            departureDate={formatDate(
              schedule.departureTime
            )}
          />
        </aside>
      </div>
    </main>
  );
}