import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  LockKeyhole,
  Pencil,
  Plane,
} from "lucide-react";

import { authOptions } from "../api/auth/[...nextauth]/route";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { authorizeBookingAccess } from "../lib/authorization";
import { expireUnpaidReservation } from "../lib/reservationLifecycle";
import { prisma } from "../lib/prisma";

/* =========================================================
   TYPES
========================================================= */

type CheckoutPageProps = {
  searchParams: Promise<{
    bookingId?: string;
  }>;
};

/* =========================================================
   PAGE
========================================================= */

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const params = await searchParams;

  const bookingId = params.bookingId?.trim();

  if (!bookingId) {
    notFound();
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
        include: {
          seat: true,
        },
      },

      schedule: {
        include: {
          route: {
            include: {
              airline: true,
              originAirport: true,
              destinationAirport: true,
            },
          },

          aircraft: true,
        },
      },

      payments: true,
    },
  });

  if (!booking) {
    notFound();
  }

  if (booking.status === "FAILED" || booking.status === "CANCELLED") {
    notFound();
  }

  const access = authorizeBookingAccess(
    session.user as { id?: string; role?: "ADMIN" | "STAFF" | "CUSTOMER" },
    booking
  );

  if (!access.authorized) {
    notFound();
  }

  /* =======================================================
     DATABASE DATA
  ======================================================= */

  const schedule = booking.schedule;

  const route = schedule?.route;

  const originAirport =
    route?.originAirport;

  const destinationAirport =
    route?.destinationAirport;

  const aircraft =
    schedule?.aircraft;

  const departureTime =
    schedule?.departureTime ??
    booking.departureDate;

  const arrivalTime =
    schedule?.arrivalTime ?? null;

  const currency =
    booking.currency || "USD";

  /*
   * IMPORTANT:
   *
   * Your Booking.baseFare is currently being saved
   * as the PER-PASSENGER fare by /api/bookings.
   */

  const baseFarePerPassenger =
    Number(booking.baseFare || 0);

  const baseFareTotal =
    baseFarePerPassenger *
    booking.passengersCount;

  const taxes =
    Number(booking.taxes || 0);

  const serviceFee =
    Number(booking.serviceFee || 0);

  const totalAmount =
    Number(booking.totalAmount || 0);

  /* =======================================================
     EDIT URL
  ======================================================= */

  const editTravelerUrl =
    `/passengers?bookingId=${encodeURIComponent(
      booking.id
    )}`;

  /* =======================================================
     PAYMENT URL
  ======================================================= */

  const paymentUrl =
    `/payment?bookingId=${encodeURIComponent(
      booking.id
    )}`;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f5f7fa] text-slate-950">
        {/* =================================================
            BOOKING STEPS
        ================================================= */}

        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <div className="overflow-x-auto">
              <div className="flex min-w-max items-center py-4">
                <BookingStep
                  number={1}
                  label="Flight"
                  completed
                />

                <StepLine />

                <BookingStep
                  number={2}
                  label="Travelers"
                  completed
                />

                <StepLine />

                <BookingStep
                  number={3}
                  label="Review"
                  active
                />

                <StepLine />

                <BookingStep
                  number={4}
                  label="Payment"
                />
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 lg:px-8">
            <Link
              href={editTravelerUrl}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />

              Back to traveler details
            </Link>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                  Review & confirm
                </p>

                <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-950 sm:text-3xl">
                  Review your booking
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Check the flight and traveler information
                  before continuing to payment.
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                <LockKeyhole className="h-4 w-4" />

                Secure checkout
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
            {/* ===============================================
                LEFT COLUMN
            =============================================== */}

            <div className="min-w-0 space-y-5">
              {/* =============================================
                  FLIGHT DETAILS
              ============================================= */}

              <SectionCard
                title="Flight details"
                subtitle={`${booking.airlineName} · ${
                  booking.flightNumber || "Flight"
                }`}
              >
                {/* ROUTE */}

                <div className="grid gap-6 md:grid-cols-[1fr_170px_1fr] md:items-center">
                  {/* DEPARTURE */}

                  <AirportBlock
                    time={formatTime(
                      departureTime
                    )}
                    airportCode={
                      booking.originCode
                    }
                    city={
                      booking.originCity ||
                      originAirport?.city ||
                      ""
                    }
                    airportName={
                      originAirport?.name || ""
                    }
                    date={formatDate(
                      departureTime
                    )}
                  />

                  {/* FLIGHT PATH */}

                  <div className="hidden md:block">
                    <p className="mb-2 text-center text-xs font-medium text-slate-500">
                      {calculateDuration(
                        departureTime,
                        arrivalTime
                      )}
                    </p>

                    <div className="flex items-center">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />

                      <div className="h-px flex-1 bg-slate-300" />

                      <div className="mx-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                        <Plane className="h-3.5 w-3.5 rotate-90" />
                      </div>

                      <div className="h-px flex-1 bg-slate-300" />

                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                    </div>

                    <p className="mt-2 text-center text-xs text-slate-500">
                      Nonstop
                    </p>
                  </div>

                  {/* ARRIVAL */}

                  <AirportBlock
                    time={formatTime(
                      arrivalTime
                    )}
                    airportCode={
                      booking.destinationCode
                    }
                    city={
                      booking.destinationCity ||
                      destinationAirport?.city ||
                      ""
                    }
                    airportName={
                      destinationAirport?.name ||
                      ""
                    }
                    date={formatDate(
                      arrivalTime
                    )}
                    alignRight
                  />
                </div>

                {/* MOBILE ROUTE */}

                <div className="my-5 flex items-center md:hidden">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />

                  <div className="h-px flex-1 bg-slate-300" />

                  <Plane className="mx-3 h-4 w-4 rotate-90 text-blue-700" />

                  <div className="h-px flex-1 bg-slate-300" />

                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                </div>

                {/* FLIGHT METADATA */}

                <div className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                  <Detail
                    label="Flight"
                    value={
                      booking.flightNumber ||
                      "—"
                    }
                  />

                  <Detail
                    label="Aircraft"
                    value={
                      aircraft
                        ? `${aircraft.manufacturer} ${aircraft.model}`
                        : "—"
                    }
                  />

                  <Detail
                    label="Duration"
                    value={calculateDuration(
                      departureTime,
                      arrivalTime
                    )}
                  />

                  <Detail
                    label="Trip"
                    value={formatTripType(
                      booking.tripType
                    )}
                  />
                </div>
              </SectionCard>

              {/* =============================================
                  TRAVELERS
              ============================================= */}

              <SectionCard
                title="Traveler information"
                subtitle={`${booking.passengers.length} ${
                  booking.passengers.length === 1
                    ? "traveler"
                    : "travelers"
                }`}
                action={
                  <Link
                    href={editTravelerUrl}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />

                    Edit
                  </Link>
                }
              >
                <div className="divide-y divide-slate-100">
                  {booking.passengers.map(
                    (passenger, index) => {
                      const fullName = [
                        passenger.firstName,
                        passenger.middleName,
                        passenger.lastName,
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <div
                          key={passenger.id}
                          className="py-5 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                              {index + 1}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-950">
                                {fullName}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Traveler {index + 1}
                              </p>

                              <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                                <Detail
                                  label="Date of birth"
                                  value={formatDate(
                                    passenger.dateOfBirth
                                  )}
                                />

                                <Detail
                                  label="Gender"
                                  value={formatText(
                                    passenger.gender
                                  )}
                                />

                                <Detail
                                  label="Nationality"
                                  value={
                                    passenger.nationality ||
                                    "—"
                                  }
                                />

                                <Detail
                                  label="Passport number"
                                  value={maskPassport(
                                    passenger.passportNumber
                                  )}
                                />

                                <Detail
                                  label="Country of issue"
                                  value={
                                    passenger.passportCountry ||
                                    "—"
                                  }
                                />

                                <Detail
                                  label="Passport expiry"
                                  value={formatDate(
                                    passenger.passportExpiry
                                  )}
                                />

                                {passenger.seat && (
                                  <Detail
                                    label="Seat"
                                    value={
                                      passenger.seat
                                        .seatNumber
                                    }
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </SectionCard>

              {/* =============================================
                  CONTACT INFORMATION
              ============================================= */}

              <SectionCard
                title="Contact information"
                subtitle="Booking confirmation and flight updates will be sent to these details."
                action={
                  <Link
                    href={editTravelerUrl}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />

                    Edit
                  </Link>
                }
              >
                <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  <Detail
                    label="Contact name"
                    value={
                      booking.customerName ||
                      "—"
                    }
                  />

                  <Detail
                    label="Email address"
                    value={
                      booking.customerEmail ||
                      "—"
                    }
                  />

                  <Detail
                    label="Phone number"
                    value={
                      booking.customerPhone ||
                      "—"
                    }
                  />
                </div>
              </SectionCard>

              {/* =============================================
                  IMPORTANT INFORMATION
              ============================================= */}

              <div className="rounded-lg border border-slate-200 bg-white px-5 py-5 sm:px-6">
                <h2 className="text-sm font-semibold text-slate-950">
                  Before you continue
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Traveler names and passport details
                  should match the travel documents that
                  will be presented at check-in.
                </p>
              </div>

              {/* =============================================
                  MOBILE SUMMARY
              ============================================= */}

              <div className="lg:hidden">
                <PriceSummary
                  bookingId={booking.id}
                  bookingCode={
                    booking.bookingCode
                  }
                  passengersCount={
                    booking.passengersCount
                  }
                  baseFarePerPassenger={
                    baseFarePerPassenger
                  }
                  baseFareTotal={
                    baseFareTotal
                  }
                  taxes={taxes}
                  serviceFee={serviceFee}
                  totalAmount={totalAmount}
                  currency={currency}
                  paymentUrl={paymentUrl}
                />
              </div>
            </div>

            {/* ===============================================
                DESKTOP SUMMARY
            =============================================== */}

            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <PriceSummary
                  bookingId={booking.id}
                  bookingCode={
                    booking.bookingCode
                  }
                  passengersCount={
                    booking.passengersCount
                  }
                  baseFarePerPassenger={
                    baseFarePerPassenger
                  }
                  baseFareTotal={
                    baseFareTotal
                  }
                  taxes={taxes}
                  serviceFee={serviceFee}
                  totalAmount={totalAmount}
                  currency={currency}
                  paymentUrl={paymentUrl}
                />
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

/* =========================================================
   SECTION CARD
========================================================= */

function SectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-950">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
      </div>

      <div className="px-5 py-6 sm:px-6">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   AIRPORT BLOCK
========================================================= */

function AirportBlock({
  time,
  airportCode,
  city,
  airportName,
  date,
  alignRight = false,
}: {
  time: string;
  airportCode: string;
  city: string;
  airportName: string;
  date: string;
  alignRight?: boolean;
}) {
  return (
    <div
      className={
        alignRight
          ? "md:text-right"
          : ""
      }
    >
      <div
        className={`flex flex-wrap items-baseline gap-2 ${
          alignRight
            ? "md:justify-end"
            : ""
        }`}
      >
        <span className="text-2xl font-semibold tracking-[-0.025em] text-slate-950">
          {time}
        </span>

        <span className="text-sm font-medium text-slate-500">
          {airportCode}
        </span>
      </div>

      <p className="mt-1 text-sm font-medium text-slate-800">
        {city || airportCode}
      </p>

      {airportName && (
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {airportName}
        </p>
      )}

      <div
        className={`mt-2 flex items-center gap-1.5 text-xs text-slate-500 ${
          alignRight
            ? "md:justify-end"
            : ""
        }`}
      >
        <CalendarDays className="h-3.5 w-3.5" />

        {date}
      </div>
    </div>
  );
}

/* =========================================================
   DETAIL
========================================================= */

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-slate-900">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   PRICE SUMMARY
========================================================= */

function PriceSummary({
  bookingId,
  bookingCode,
  passengersCount,
  baseFarePerPassenger,
  baseFareTotal,
  taxes,
  serviceFee,
  totalAmount,
  currency,
  paymentUrl,
}: {
  bookingId: string;
  bookingCode: string;
  passengersCount: number;
  baseFarePerPassenger: number;
  baseFareTotal: number;
  taxes: number;
  serviceFee: number;
  totalAmount: number;
  currency: string;
  paymentUrl: string;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      {/* HEADER */}

      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">
          Trip summary
        </h2>

        <div className="mt-2 flex items-center justify-between gap-4">
          <span className="text-xs text-slate-500">
            Booking reference
          </span>

          <span className="font-mono text-xs font-semibold text-slate-800">
            {bookingCode}
          </span>
        </div>
      </div>

      {/* PRICE */}

      <div className="px-5 py-5">
        <div className="space-y-4">
          <PriceRow
            label={
              passengersCount === 1
                ? "Base fare"
                : `Base fare × ${passengersCount}`
            }
            value={formatMoney(
              baseFareTotal,
              currency
            )}
          />

          {passengersCount > 1 && (
            <p className="-mt-2 text-xs text-slate-400">
              {formatMoney(
                baseFarePerPassenger,
                currency
              )}{" "}
              per traveler
            </p>
          )}

          <PriceRow
            label="Taxes & fees"
            value={formatMoney(
              taxes,
              currency
            )}
          />

          {serviceFee > 0 && (
            <PriceRow
              label="Service fee"
              value={formatMoney(
                serviceFee,
                currency
              )}
            />
          )}
        </div>

        <div className="my-5 border-t border-slate-200" />

        {/* TOTAL */}

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              Total
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {passengersCount}{" "}
              {passengersCount === 1
                ? "traveler"
                : "travelers"}
            </p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
              {formatMoney(
                totalAmount,
                currency
              )}
            </p>

            <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
              {currency}
            </p>
          </div>
        </div>

        {/* PAYMENT BUTTON */}

        <Link
          href={paymentUrl}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
          Continue to payment

          <ArrowRight className="h-4 w-4" />
        </Link>

        {/* SECURITY */}

        <div className="mt-4 flex items-start gap-2">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

          <p className="text-xs leading-5 text-slate-500">
            Review all traveler information
            carefully before continuing.
          </p>
        </div>

        {/* HIDDEN INTERNAL ID IS NOT SHOWN */}

        <span className="hidden">
          {bookingId}
        </span>
      </div>
    </section>
  );
}

/* =========================================================
   PRICE ROW
========================================================= */

function PriceRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-5 text-sm">
      <span className="text-slate-600">
        {label}
      </span>

      <span className="shrink-0 font-medium text-slate-950">
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   BOOKING PROGRESS
========================================================= */

function BookingStep({
  number,
  label,
  active = false,
  completed = false,
}: {
  number: number;
  label: string;
  active?: boolean;
  completed?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={[
          "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",

          completed
            ? "bg-emerald-600 text-white"
            : "",

          active
            ? "bg-blue-600 text-white"
            : "",

          !completed && !active
            ? "bg-slate-100 text-slate-400"
            : "",
        ].join(" ")}
      >
        {completed ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          number
        )}
      </div>

      <span
        className={[
          "whitespace-nowrap text-xs sm:text-sm",

          active
            ? "font-semibold text-slate-950"
            : "",

          completed
            ? "font-medium text-slate-700"
            : "",

          !active && !completed
            ? "text-slate-400"
            : "",
        ].join(" ")}
      >
        {label}
      </span>
    </div>
  );
}

/* =========================================================
   STEP LINE
========================================================= */

function StepLine() {
  return (
    <div className="mx-3 h-px w-7 bg-slate-200 sm:mx-5 sm:w-12" />
  );
}

/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(
  value: Date | string | null
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    }
  ).format(date);
}

/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
  value: Date | string | null
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
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

/* =========================================================
   DURATION
========================================================= */

function calculateDuration(
  departure: Date | string | null,
  arrival: Date | string | null
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

  const difference =
    end.getTime() -
    start.getTime();

  if (difference <= 0) {
    return "—";
  }

  const totalMinutes =
    Math.floor(
      difference / 60000
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

/* =========================================================
   MONEY
========================================================= */

function formatMoney(
  value: number,
  currency: string
) {
  const safeValue =
    Number.isFinite(value)
      ? value
      : 0;

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
    ).format(safeValue);
  } catch {
    return `$${safeValue.toFixed(
      2
    )}`;
  }
}

/* =========================================================
   TRIP TYPE
========================================================= */

function formatTripType(
  value: string
) {
  switch (value) {
    case "ONE_WAY":
      return "One way";

    case "ROUND_TRIP":
      return "Round trip";

    case "MULTI_CITY":
      return "Multi-city";

    default:
      return value
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(
          /\b\w/g,
          (letter) =>
            letter.toUpperCase()
        );
  }
}

/* =========================================================
   GENERIC TEXT FORMATTER
========================================================= */

function formatText(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

/* =========================================================
   MASK PASSPORT
========================================================= */

function maskPassport(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  const cleaned =
    value.trim();

  if (cleaned.length <= 4) {
    return cleaned;
  }

  return `••••${cleaned.slice(
    -4
  )}`;
}