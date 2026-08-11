"use client";

import {
  FormEvent,
  ReactNode,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  LockKeyhole,
  Mail,
  Plane,
} from "lucide-react";

import Navbar from "../components/Navbar";

/* =========================================================*
   TYPES
========================================================= */

type PassengerForm = {
  id?: string;

  firstName: string;
  middleName: string;
  lastName: string;

  dateOfBirth: string;
  gender: string;
  nationality: string;

  passportNumber: string;
  passportCountry: string;
  passportExpiry: string;
};

type PassengerApiData = {
  id?: string;

  firstName?: string;
  middleName?: string | null;
  lastName?: string;

  dateOfBirth?: string | null;
  gender?: string | null;
  nationality?: string | null;

  passportNumber?: string | null;
  passportCountry?: string | null;
  passportExpiry?: string | null;
};

type BookingResponse = {
  success?: boolean;
  message?: string;

  data?: {
    id?: string;
    bookingCode?: string;

    tripType?: string;

    departureDate?: string;
    returnDate?: string | null;

    passengersCount?: number;

    customerName?: string;
    customerEmail?: string;
    customerPhone?: string | null;

    airlineName?: string | null;
    flightNumber?: string | null;

    baseFare?: string | number | null;
    currency?: string;

    originCode?: string;
    originCity?: string | null;

    destinationCode?: string;
    destinationCity?: string | null;

    schedule?: {
      id?: string;

      departureTime?: string;
      arrivalTime?: string | null;

      aircraft?: {
        model?: string | null;
        name?: string | null;
      } | null;

      route?: {
        originAirport?: {
          name?: string | null;
          city?: string | null;
          iataCode?: string | null;
        } | null;

        destinationAirport?: {
          name?: string | null;
          city?: string | null;
          iataCode?: string | null;
        } | null;
      } | null;
    } | null;

    passengers?: PassengerApiData[];
  };
};

/* =========================================================*
   *EMPTY PASSENGER*
========================================================= */

function createEmptyPassenger(): PassengerForm {
  return {
    firstName: "",
    middleName: "",
    lastName: "",

    dateOfBirth: "",
    gender: "",
    nationality: "",

    passportNumber: "",
    passportCountry: "",
    passportExpiry: "",
  };
}

/* =========================================================*
   PAGE
========================================================= */

function PassengersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

/* =======================================================*
     *EDIT MODE*
  ======================================================= */

  const bookingId =
    searchParams.get("bookingId") || "";

  const mode =
    searchParams.get("mode") || "";

  const isEditMode =
    Boolean(bookingId) && mode === "edit";

/* =======================================================*
     *FLIGHT DATA FROM RESULTS PAGE*
  ======================================================= */

  const scheduleIdFromUrl =
    searchParams.get("scheduleId") || "";

  const tripTypeFromUrl =
    searchParams.get("tripType") || "ONE_WAY";

  const airlineFromUrl =
    searchParams.get("airline") ||
    "StarJet Airlines";

  const flightCodeFromUrl =
    searchParams.get("flightCode") || "";

  const aircraftFromUrl =
    searchParams.get("aircraft") || "";

  const originCodeFromUrl =
    searchParams.get("originCode") || "";

  const originCityFromUrl =
    searchParams.get("originCity") || "";

  const originAirportFromUrl =
    searchParams.get("originAirport") || "";

  const destinationCodeFromUrl =
    searchParams.get("destinationCode") || "";

  const destinationCityFromUrl =
    searchParams.get("destinationCity") || "";

  const destinationAirportFromUrl =
    searchParams.get("destinationAirport") || "";

  const departureDateFromUrl =
    searchParams.get("departureDate") || "";

  const departureTimeFromUrl =
    searchParams.get("departureTime") || "";

  const arrivalTimeFromUrl =
    searchParams.get("arrivalTime") || "";

  const returnDateFromUrl =
    searchParams.get("returnDate") || "";

  const durationFromUrl =
    searchParams.get("duration") || "";

  const currencyFromUrl =
    searchParams.get("currency") || "USD";

  const rawPriceFromUrl =
    searchParams.get("price") || "0";

  const requestedPassengerCount = Number(
    searchParams.get("passengersCount") || "1"
  );

  const initialPassengerCount =
    Number.isInteger(requestedPassengerCount) &&
    requestedPassengerCount > 0
      ? requestedPassengerCount
      : 1;

/* =======================================================*
     *FLIGHT / BOOKING STATE*
  ======================================================= */

  const [scheduleId, setScheduleId] =
    useState(scheduleIdFromUrl);

  const [tripType, setTripType] =
    useState(tripTypeFromUrl);

  const [airline, setAirline] =
    useState(airlineFromUrl);

  const [flightCode, setFlightCode] =
    useState(flightCodeFromUrl);

  const [aircraft, setAircraft] =
    useState(aircraftFromUrl);

  const [originCode, setOriginCode] =
    useState(originCodeFromUrl);

  const [originCity, setOriginCity] =
    useState(originCityFromUrl);

  const [originAirport, setOriginAirport] =
    useState(originAirportFromUrl);

  const [
    destinationCode,
    setDestinationCode,
  ] = useState(destinationCodeFromUrl);

  const [
    destinationCity,
    setDestinationCity,
  ] = useState(destinationCityFromUrl);

  const [
    destinationAirport,
    setDestinationAirport,
  ] = useState(destinationAirportFromUrl);

  const [
    departureDate,
    setDepartureDate,
  ] = useState(departureDateFromUrl);

  const [
    departureTime,
    setDepartureTime,
  ] = useState(departureTimeFromUrl);

  const [arrivalTime, setArrivalTime] =
    useState(arrivalTimeFromUrl);

  const [returnDate, setReturnDate] =
    useState(returnDateFromUrl);

  const [duration, setDuration] =
    useState(durationFromUrl);

  const [currency, setCurrency] =
    useState(currencyFromUrl);

  const [rawPrice, setRawPrice] =
    useState(rawPriceFromUrl);

/* =======================================================*
     *FORM STATE*
  ======================================================= */

  const [passengers, setPassengers] =
    useState<PassengerForm[]>(() =>
      Array.from(
        {
          length: initialPassengerCount,
        },
        createEmptyPassenger
      )
    );

  const [customerName, setCustomerName] =
    useState("");

  const [customerEmail, setCustomerEmail] =
    useState("");

  const [customerPhone, setCustomerPhone] =
    useState("");

  const [loadingBooking, setLoadingBooking] =
    useState(isEditMode);

  const [submitting, setSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

/* =======================================================*
     *LOAD BOOKING WHEN EDITING*
  ======================================================= */

  useEffect(() => {
    if (!isEditMode || !bookingId) {
      return;
    }

    let cancelled = false;

    async function loadBooking() {
      try {
        setLoadingBooking(true);
        setErrorMessage("");

        const response = await fetch(
          `/api/bookings/${encodeURIComponent(
            bookingId
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result: BookingResponse =
          await response.json();

        if (
          !response.ok ||
          !result.success ||
          !result.data
        ) {
          throw new Error(
            result.message ||
              "Unable to load booking."
          );
        }

        if (cancelled) {
          return;
        }

        const booking = result.data;

        setScheduleId(
          booking.schedule?.id || ""
        );

        setTripType(
          booking.tripType || "ONE_WAY"
        );

        setAirline(
          booking.airlineName ||
            "StarJet Airlines"
        );

        setFlightCode(
          booking.flightNumber || ""
        );

        setAircraft(
          booking.schedule?.aircraft?.model ||
            booking.schedule?.aircraft?.name ||
            ""
        );

        setOriginCode(
          booking.originCode ||
            booking.schedule?.route
              ?.originAirport?.iataCode ||
            ""
        );

        setOriginCity(
          booking.originCity ||
            booking.schedule?.route
              ?.originAirport?.city ||
            ""
        );

        setOriginAirport(
          booking.schedule?.route
            ?.originAirport?.name || ""
        );

        setDestinationCode(
          booking.destinationCode ||
            booking.schedule?.route
              ?.destinationAirport
              ?.iataCode ||
            ""
        );

        setDestinationCity(
          booking.destinationCity ||
            booking.schedule?.route
              ?.destinationAirport?.city ||
            ""
        );

        setDestinationAirport(
          booking.schedule?.route
            ?.destinationAirport?.name || ""
        );

        setDepartureDate(
          booking.departureDate || ""
        );

        setDepartureTime(
          booking.schedule?.departureTime ||
            booking.departureDate ||
            ""
        );

        setArrivalTime(
          booking.schedule?.arrivalTime || ""
        );

        setReturnDate(
          booking.returnDate || ""
        );

        setCurrency(
          booking.currency || "USD"
        );

        if (
          booking.baseFare !== null &&
          booking.baseFare !== undefined
        ) {
          setRawPrice(
            String(booking.baseFare)
          );
        }

        setCustomerName(
          booking.customerName || ""
        );

        setCustomerEmail(
          booking.customerEmail || ""
        );

        setCustomerPhone(
          booking.customerPhone || ""
        );

        const existingPassengers =
          booking.passengers || [];

        if (existingPassengers.length > 0) {
          setPassengers(
            existingPassengers.map(
              (passenger) => ({
                id: passenger.id,

                firstName:
                  passenger.firstName || "",

                middleName:
                  passenger.middleName || "",

                lastName:
                  passenger.lastName || "",

                dateOfBirth:
                  toDateInputValue(
                    passenger.dateOfBirth
                  ),

                gender:
                  passenger.gender || "",

                nationality:
                  passenger.nationality || "",

                passportNumber:
                  passenger.passportNumber || "",

                passportCountry:
                  passenger.passportCountry || "",

                passportExpiry:
                  toDateInputValue(
                    passenger.passportExpiry
                  ),
              })
            )
          );
        }
      } catch (error) {
        console.error(
          "LOAD BOOKING ERROR:",
          error
        );

        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load booking."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingBooking(false);
        }
      }
    }

    loadBooking();

    return () => {
      cancelled = true;
    };
  }, [bookingId, isEditMode]);

/* =======================================================*
     PRICE
  ======================================================= */

  const pricePerPassenger = useMemo(() => {
    const parsed = Number(rawPrice);

    return Number.isFinite(parsed)
      ? parsed
      : 0;
  }, [rawPrice]);

  const passengersCount =
    passengers.length || 1;

  const estimatedTotal =
    pricePerPassenger * passengersCount;

/* =======================================================*
     *UPDATE PASSENGER*
  ======================================================= */

  function updatePassenger(
index: number,
field: keyof PassengerForm,
value: string
  ) {
    let normalizedValue = value;

/**
      *Passport numbers can contain letters*
      *and numbers.*

      *Spaces and special characters are*
      *removed automatically.*
    */

    if (field === "passportNumber") {
      normalizedValue = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 20);
    }

    setPassengers((current) =>
      current.map(
        (passenger, passengerIndex) =>
          passengerIndex === index
            ? {
                ...passenger,
                [field]: normalizedValue,
              }
            : passenger
      )
    );

    setErrorMessage("");
  }

/* =======================================================*
     VALIDATION
  ======================================================= */

  function validateForm() {
    if (!customerName.trim()) {
      return "Please enter the booking contact name.";
    }

    if (!customerEmail.trim()) {
      return "Please enter the booking contact email.";
    }

    if (!isValidEmail(customerEmail)) {
      return "Please enter a valid email address.";
    }

    for (
      let index = 0;
      index < passengers.length;
      index++
    ) {
      const passenger =
        passengers[index];

      const travelerNumber =
        index + 1;

      if (!passenger.firstName.trim()) {
        return `Please enter the first name for traveler ${travelerNumber}.`;
      }

      if (!passenger.lastName.trim()) {
        return `Please enter the last name for traveler ${travelerNumber}.`;
      }

      if (!passenger.dateOfBirth) {
        return `Please enter the date of birth for traveler ${travelerNumber}.`;
      }

      const birthDate =
        new Date(
          `${passenger.dateOfBirth}T00:00:00`
        );

      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      if (birthDate > today) {
        return `The date of birth for traveler ${travelerNumber} cannot be in the future.`;
      }

      if (!passenger.gender) {
        return `Please select the gender for traveler ${travelerNumber}.`;
      }

      if (!passenger.nationality.trim()) {
        return `Please enter the nationality for traveler ${travelerNumber}.`;
      }

      if (
        !passenger.passportNumber.trim()
      ) {
        return `Please enter the passport number for traveler ${travelerNumber}.`;
      }

      if (
        !/^[A-Z0-9]{5,20}$/.test(
          passenger.passportNumber
        )
      ) {
        return `Please enter a valid passport number for traveler ${travelerNumber}. Use 5–20 letters and numbers only.`;
      }

      if (
        !passenger.passportCountry.trim()
      ) {
        return `Please enter the passport country for traveler ${travelerNumber}.`;
      }

      if (!passenger.passportExpiry) {
        return `Please enter the passport expiry date for traveler ${travelerNumber}.`;
      }

/**
        *Passport cannot expire today or*
        *any date before today.*
      */

      if (
        passenger.passportExpiry <=
        getTodayDateInput()
      ) {
        return `The passport for traveler ${travelerNumber} must have an expiration date after today.`;
      }
    }

    return "";
  }

/* =======================================================*
     SUBMIT
  ======================================================= */

  async function handleSubmit(
event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");

    if (!isEditMode && !scheduleId) {
      setErrorMessage(
        "Flight information is missing. Please return to flight search and select your flight again."
      );

      return;
    }

    const validationError =
      validateForm();

    if (validationError) {
      setErrorMessage(
        validationError
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    try {
      setSubmitting(true);

      const passengerPayload =
        passengers.map(
          (passenger) => ({
            id: passenger.id,

            firstName:
              passenger.firstName.trim(),

            middleName:
              passenger.middleName.trim() ||
              null,

            lastName:
              passenger.lastName.trim(),

            dateOfBirth:
              passenger.dateOfBirth ||
              null,

            gender:
              passenger.gender || null,

            nationality:
              passenger.nationality.trim() ||
              null,

            passportNumber:
              passenger.passportNumber
                .trim()
                .toUpperCase(),

            passportCountry:
              passenger.passportCountry.trim() ||
              null,

            passportExpiry:
              passenger.passportExpiry ||
              null,

            seatId: null,
          })
        );

/* ===================================================*
         *EDIT EXISTING BOOKING*
      =================================================== */

      if (isEditMode) {
        const response = await fetch(
          `/api/bookings/${encodeURIComponent(
            bookingId
          )}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              customerName:
                customerName.trim(),

              customerEmail:
                customerEmail
                  .trim()
                  .toLowerCase(),

              customerPhone:
                customerPhone.trim() ||
                null,

              passengers:
                passengerPayload,
            }),
          }
        );

        const result: BookingResponse =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "Unable to update booking."
          );
        }

        router.push(
          `/review?bookingId=${encodeURIComponent(
            bookingId
          )}`
        );

        return;
      }

/* ===================================================*
         *CREATE NEW BOOKING*
      =================================================== */

      const response = await fetch(
        "/api/bookings",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            scheduleId,

            tripType,

            returnDate:
              tripType ===
                "ROUND_TRIP" &&
              returnDate
                ? returnDate
                : null,

            passengersCount,

            customerName:
              customerName.trim(),

            customerEmail:
              customerEmail
                .trim()
                .toLowerCase(),

            customerPhone:
              customerPhone.trim() ||
              null,

            passengers:
              passengerPayload,
          }),
        }
      );

      const result: BookingResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Unable to create booking."
        );
      }

      const createdBookingId =
        result.data?.id;

      if (!createdBookingId) {
        throw new Error(
          "Booking was created but no booking ID was returned."
        );
      }

/**
        *CORRECT FLOW:*

        Flight
          *↓*
        Travelers
          *↓*
        Review
          *↓*
        Payment
      */

      router.push(
        `/review?bookingId=${encodeURIComponent(
          createdBookingId
        )}`
      );
    } catch (error) {
      console.error(
        "BOOKING ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to continue. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

/* =======================================================*
     LOADING
  ======================================================= */

  if (loadingBooking) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-[#f6f7f9]">
          <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 lg:px-8">
            <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm font-medium text-slate-700">
                Loading traveler information...
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

/* =======================================================*
     RENDER
  ======================================================= */

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f6f7f9] text-slate-950">
        {/* =================================================*
            PROGRESS
        *================================================= */}

        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 items-center overflow-x-auto">
              <BookingStep
number="1"
label="Select flight"
completed
              />

              <StepDivider />

              <BookingStep
number="2"
label="Travelers"
active
              />

              <StepDivider />

              <BookingStep
number="3"
label="Review"
              />

              <StepDivider />

              <BookingStep
number="4"
label="Payment"
              />
            </div>
          </div>
        </div>

        {/* =================================================*
            HEADER
        *================================================= */}

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 lg:px-8">
            <button
type="button"
onClick={() => {
                if (
                  isEditMode &&
                  bookingId
                ) {
                  router.push(
                    `/review?bookingId=${encodeURIComponent(
                      bookingId
                    )}`
                  );

                  return;
                }

                router.back();
              }}
className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />

              {isEditMode
                ? "Back to review"
                : "Back to flights"}
            </button>

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-slate-950 sm:text-[32px]">
                  {isEditMode
                    ? "Edit traveler information"
                    : "Traveler information"}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                  Enter each traveler&apos;s
                  details exactly as they appear
                  on the passport that will be
                  used for this trip.
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 text-sm text-emerald-700">
                <LockKeyhole className="h-4 w-4" />

                <span className="font-medium">
                  Secure booking
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================*
            FORM
        *================================================= */}

        <form
onSubmit={handleSubmit}
noValidate
        >
          <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
            {/* ERROR */}

            {errorMessage && (
              <div
role="alert"
className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
              >
                {errorMessage}
              </div>
            )}

            <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
              {/* =================================================*
                  *LEFT COLUMN*
              *================================================= */}

              <div className="min-w-0 space-y-6">
                {/* ===============================================*
                    FLIGHT
                =============================================== */}

                <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
                        Selected flight
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[15px] font-semibold text-slate-950">
                          {airline}
                        </span>

                        {flightCode && (
                          <>
                            <span className="text-slate-300">
                              ·
                            </span>

                            <span className="text-sm text-slate-500">
                              {flightCode}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {aircraft && (
                      <p className="text-sm text-slate-500">
                        {aircraft}
                      </p>
                    )}
                  </div>

                  <div className="px-5 py-6 sm:px-6">
                    <div className="grid gap-6 md:grid-cols-[1fr_170px_1fr] md:items-center">
                      <FlightEndpoint
time={formatTime(
                          departureTime
                        )}
code={originCode}
city={originCity}
airport={originAirport}
date={formatDate(
                          departureTime ||
                            departureDate
                        )}
                      />

                      <div className="hidden md:block">
                        <p className="mb-2 text-center text-xs font-medium text-slate-500">
                          {duration ||
                            calculateDuration(
                              departureTime,
                              arrivalTime
                            )}
                        </p>

                        <div className="flex items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />

                          <div className="h-px flex-1 bg-slate-300" />

                          <div className="mx-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                            <Plane className="h-3.5 w-3.5 rotate-90" />
                          </div>

                          <div className="h-px flex-1 bg-slate-300" />

                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                        </div>

                        <p className="mt-2 text-center text-xs text-slate-500">
                          Nonstop
                        </p>
                      </div>

                      <FlightEndpoint
time={formatTime(
                          arrivalTime
                        )}
code={destinationCode}
city={destinationCity}
airport={
                          destinationAirport
                        }
date={formatDate(
                          arrivalTime ||
                            departureDate
                        )}
alignRight
                      />
                    </div>

                    <div className="mt-5 flex items-center gap-4 border-t border-slate-100 pt-4 md:hidden">
                      <Clock3 className="h-4 w-4 text-slate-400" />

                      <p className="text-sm text-slate-600">
                        {duration ||
                          calculateDuration(
                            departureTime,
                            arrivalTime
                          )}{" "}
                        · Nonstop
                      </p>
                    </div>
                  </div>
                </section>

                {/* ===============================================*
                    TRAVELERS
                =============================================== */}

                {passengers.map(
                  (passenger, index) => (
                    <section
key={
                        passenger.id ||
                        `traveler-${index}`
                      }
className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                    >
                      {/* HEADER */}

                      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                          {index + 1}
                        </div>

                        <div>
                          <h2 className="text-base font-semibold text-slate-950">
                            Traveler{" "}
                            {index + 1}
                          </h2>

                          <p className="mt-0.5 text-xs text-slate-500">
                            Enter the information
                            exactly as shown on the
                            traveler&apos;s
                            passport.
                          </p>
                        </div>
                      </div>

                      {/* PERSONAL INFORMATION */}

                      <div className="px-5 py-6 sm:px-6">
                        <h3 className="mb-5 text-sm font-semibold text-slate-950">
                          Personal information
                        </h3>

                        <div className="grid gap-x-5 gap-y-5 md:grid-cols-2">
                          <Field
label="First name"
required
                          >
                            <input
type="text"
value={
                                passenger.firstName
                              }
onChange={(
                                event
                              ) =>
                                updatePassenger(
                                  index,
                                  "firstName",
                                  event.target
                                    .value
                                )
                              }
autoComplete="given-name"
placeholder="First name"
className={
                                inputClass
                              }
                            />
                          </Field>

                          <Field label="Middle name">
                            <input
type="text"
value={
                                passenger.middleName
                              }
onChange={(
                                event
                              ) =>
                                updatePassenger(
                                  index,
                                  "middleName",
                                  event.target
                                    .value
                                )
                              }
autoComplete="additional-name"
placeholder="Middle name"
className={
                                inputClass
                              }
                            />
                          </Field>

                          <Field
label="Last name"
required
                          >
                            <input
type="text"
value={
                                passenger.lastName
                              }
onChange={(
                                event
                              ) =>
                                updatePassenger(
                                  index,
                                  "lastName",
                                  event.target
                                    .value
                                )
                              }
autoComplete="family-name"
placeholder="Last name"
className={
                                inputClass
                              }
                            />
                          </Field>

                          <Field
label="Date of birth"
required
                          >
                            <input
type="date"
value={
                                passenger.dateOfBirth
                              }
max={getTodayDateInput()}
onChange={(
                                event
                              ) =>
                                updatePassenger(
                                  index,
                                  "dateOfBirth",
                                  event.target
                                    .value
                                )
                              }
className={
                                inputClass
                              }
                            />
                          </Field>

                          <Field
label="Gender"
required
                          >
                            <select
value={
                                passenger.gender
                              }
onChange={(
                                event
                              ) =>
                                updatePassenger(
                                  index,
                                  "gender",
                                  event.target
                                    .value
                                )
                              }
className={
                                inputClass
                              }
                            >
                              <option value="">
                                Select gender
                              </option>

                              <option value="MALE">
                                Male
                              </option>

                              <option value="FEMALE">
                                Female
                              </option>

                              <option value="OTHER">
                                Other
                              </option>
                            </select>
                          </Field>

                          <Field
label="Nationality"
required
                          >
                            <input
type="text"
value={
                                passenger.nationality
                              }
onChange={(
                                event
                              ) =>
                                updatePassenger(
                                  index,
                                  "nationality",
                                  event.target
                                    .value
                                )
                              }
placeholder="e.g. United States"
className={
                                inputClass
                              }
                            />
                          </Field>
                        </div>
                      </div>

                      {/* =========================================*
                          *TRAVEL DOCUMENT*
                      ========================================= */}

                      <div className="border-t border-slate-200 px-5 py-6 sm:px-6">
                        <div className="mb-5">
                          <h3 className="text-sm font-semibold text-slate-950">
                            Travel document
                          </h3>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Enter the passport
                            information the
                            traveler will present
                            for this trip.
                          </p>
                        </div>

                        <div className="grid gap-x-5 gap-y-5 md:grid-cols-2">
                          <Field
label="Passport number"
required
                          >
                            <input
type="text"
value={
                                passenger.passportNumber
                              }
onChange={(
                                event
                              ) =>
                                updatePassenger(
                                  index,
                                  "passportNumber",
                                  event.target
                                    .value
                                )
                              }
placeholder="Passport number"
maxLength={20}
autoComplete="off"
autoCapitalize="characters"
spellCheck={false}
className={`${inputClass} uppercase`}
                            />

                            <p className="mt-1.5 text-xs leading-5 text-slate-500">
                              5–20 letters and
                              numbers. Spaces and
                              special characters
                              are not accepted.
                            </p>
                          </Field>

                          <Field
label="Country of issue"
required
                          >
                            <input
type="text"
value={
                                passenger.passportCountry
                              }
onChange={(
                                event
                              ) =>
                                updatePassenger(
                                  index,
                                  "passportCountry",
                                  event.target
                                    .value
                                )
                              }
placeholder="e.g. United States"
className={
                                inputClass
                              }
                            />
                          </Field>

                          <Field
label="Passport expiration date"
required
                          >
                            <input
type="date"
value={
                                passenger.passportExpiry
                              }
min={getTomorrowDateInput()}
onChange={(
                                event
                              ) =>
                                updatePassenger(
                                  index,
                                  "passportExpiry",
                                  event.target
                                    .value
                                )
                              }
className={
                                inputClass
                              }
                            />

                            <p className="mt-1.5 text-xs leading-5 text-slate-500">
                              The passport
                              expiration date must
                              be after today.
                            </p>
                          </Field>
                        </div>
                      </div>
                    </section>
                  )
                )}

                {/* ===============================================*
                    *CONTACT INFORMATION*
                =============================================== */}

                <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white">
                      <Mail className="h-4 w-4" />
                    </div>

                    <div>
                      <h2 className="text-base font-semibold text-slate-950">
                        Contact information
                      </h2>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Booking confirmation and
                        important trip updates
                        will be sent here.
                      </p>
                    </div>
                  </div>

                  <div className="px-5 py-6 sm:px-6">
                    <div className="grid gap-x-5 gap-y-5 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <Field
label="Contact name"
required
                        >
                          <input
type="text"
value={customerName}
onChange={(
                              event
                            ) => {
                              setCustomerName(
                                event.target
                                  .value
                              );

                              setErrorMessage(
                                ""
                              );
                            }}
placeholder="Full name"
autoComplete="name"
className={
                              inputClass
                            }
                          />
                        </Field>
                      </div>

                      <Field
label="Email address"
required
                      >
                        <input
type="email"
value={customerEmail}
onChange={(
                            event
                          ) => {
                            setCustomerEmail(
                              event.target.value
                            );

                            setErrorMessage("");
                          }}
placeholder="name@example.com"
autoComplete="email"
inputMode="email"
className={inputClass}
                        />
                      </Field>

                      <Field label="Phone number">
                        <input
type="tel"
value={customerPhone}
onChange={(
                            event
                          ) => {
                            setCustomerPhone(
                              event.target.value
                            );

                            setErrorMessage("");
                          }}
placeholder="+1 617 555 1234"
autoComplete="tel"
className={inputClass}
                        />
                      </Field>
                    </div>
                  </div>
                </section>

                {/* MOBILE SUMMARY */}

                <div className="lg:hidden">
                  <MobileFareSummary
isEditMode={isEditMode}
passengersCount={
                      passengersCount
                    }
pricePerPassenger={
                      pricePerPassenger
                    }
estimatedTotal={
                      estimatedTotal
                    }
currency={currency}
submitting={submitting}
                  />
                </div>
              </div>

              {/* =================================================*
                  *DESKTOP SUMMARY*
              *================================================= */}

              <aside className="hidden lg:block">
                <div className="sticky top-24">
                  <FareSummary
isEditMode={isEditMode}
originCode={originCode}
destinationCode={
                      destinationCode
                    }
departureTime={
                      departureTime ||
                      departureDate
                    }
passengersCount={
                      passengersCount
                    }
pricePerPassenger={
                      pricePerPassenger
                    }
estimatedTotal={
                      estimatedTotal
                    }
currency={currency}
submitting={submitting}
                  />
                </div>
              </aside>
            </div>
          </div>
        </form>

        {/* =================================================*
            FOOTER
        *================================================= */}

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-4 py-7 text-xs text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <p>
              © {new Date().getFullYear()}{" "}
              StarJet Air & Cargo.
            </p>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <span>Privacy</span>
              <span>Terms</span>
              <span>Customer support</span>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

export default function PassengersPage() {
  return (
    <Suspense fallback={<PassengersPageLoading />}>
      <PassengersPageContent />
    </Suspense>
  );
}

function PassengersPageLoading() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f6f7f9]">
        <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm font-medium text-slate-700">
              Loading traveler information...
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

/* =========================================================*
   *BOOKING STEP*
========================================================= */

function BookingStep({
number,
label,
active = false,
completed = false,
}: {
  number: string;
  label: string;
  active?: boolean;
  completed?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <div
className={[
          "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",

          active
            ? "bg-blue-600 text-white"
            : completed
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-500",
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
            : completed
              ? "font-medium text-slate-700"
              : "text-slate-400",
        ].join(" ")}
      >
        {label}
      </span>
    </div>
  );
}

function StepDivider() {
  return (
    <ChevronRight className="mx-3 h-4 w-4 shrink-0 text-slate-300 sm:mx-5" />
  );
}

/* =========================================================*
   *FLIGHT ENDPOINT*
========================================================= */

function FlightEndpoint({
time,
code,
city,
airport,
date,
alignRight = false,
}: {
  time: string;
  code: string;
  city: string;
  airport: string;
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
className={[
          "flex flex-wrap items-baseline gap-2",

          alignRight
            ? "md:justify-end"
            : "",
        ].join(" ")}
      >
        <span className="text-[25px] font-semibold tracking-[-0.025em] tabular-nums text-slate-950">
          {time}
        </span>

        <span className="text-sm font-medium text-slate-500">
          {code || "—"}
        </span>
      </div>

      <p className="mt-1 text-sm font-medium text-slate-800">
        {city || code || "—"}
      </p>

      {airport && (
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {airport}
        </p>
      )}

      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 md:inline-flex">
        <CalendarDays className="h-3.5 w-3.5" />

        {date}
      </p>
    </div>
  );
}

/* =========================================================*
   FIELD
========================================================= */

function Field({
label,
required = false,
children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-medium text-slate-800">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

/* =========================================================*
   *DESKTOP FARE SUMMARY*
========================================================= */

function FareSummary({
isEditMode,
originCode,
destinationCode,
departureTime,
passengersCount,
pricePerPassenger,
estimatedTotal,
currency,
submitting,
}: {
  isEditMode: boolean;
  originCode: string;
  destinationCode: string;
  departureTime: string;
  passengersCount: number;
  pricePerPassenger: number;
  estimatedTotal: number;
  currency: string;
  submitting: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">
          Trip summary
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          {originCode || "—"} →{" "}
          {destinationCode || "—"}

          {departureTime
            ? ` · ${formatShortDate(
                departureTime
              )}`
            : ""}
        </p>
      </div>

      <div className="px-5 py-5">
        <div className="flex justify-between gap-4">
          <div>
            <p className="text-sm text-slate-600">
              Base fare
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {passengersCount}{" "}
              {passengersCount === 1
                ? "traveler"
                : "travelers"}
            </p>
          </div>

          <p className="text-sm font-medium text-slate-950">
            {formatCurrency(
              pricePerPassenger *
                passengersCount,
              currency
            )}
          </p>
        </div>

        <div className="mt-5 flex justify-between gap-4">
          <p className="text-sm text-slate-600">
            Taxes & fees
          </p>

          <p className="text-right text-xs leading-5 text-slate-500">
            Calculated at checkout
          </p>
        </div>

        <div className="my-5 border-t border-slate-200" />

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-800">
              Estimated total
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Before taxes and fees
            </p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-semibold tracking-[-0.02em] text-slate-950">
              {formatCurrency(
                estimatedTotal,
                currency
              )}
            </p>

            <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
              {currency}
            </p>
          </div>
        </div>

        <button
type="submit"
disabled={submitting}
className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting
            ? isEditMode
              ? "Saving changes..."
              : "Creating booking..."
            : isEditMode
              ? "Save and return to review"
              : "Continue to review"}

          {!submitting && (
            <ArrowRight className="h-4 w-4" />
          )}
        </button>

        <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
          <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />

          <p>
            Review traveler information
            carefully before continuing.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================*
   *MOBILE FARE SUMMARY*
========================================================= */

function MobileFareSummary({
isEditMode,
passengersCount,
pricePerPassenger,
estimatedTotal,
currency,
submitting,
}: {
  isEditMode: boolean;
  passengersCount: number;
  pricePerPassenger: number;
  estimatedTotal: number;
  currency: string;
  submitting: boolean;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">
            {passengersCount}{" "}
            {passengersCount === 1
              ? "traveler"
              : "travelers"}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {formatCurrency(
              pricePerPassenger,
              currency
            )}{" "}
            per traveler
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-500">
            Estimated total
          </p>

          <p className="mt-1 text-xl font-semibold text-slate-950">
            {formatCurrency(
              estimatedTotal,
              currency
            )}
          </p>
        </div>
      </div>

      <button
type="submit"
disabled={submitting}
className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {submitting
          ? isEditMode
            ? "Saving changes..."
            : "Creating booking..."
          : isEditMode
            ? "Save and return to review"
            : "Continue to review"}

        {!submitting && (
          <ArrowRight className="h-4 w-4" />
        )}
      </button>
    </section>
  );
}

/* =========================================================*
   *INPUT CLASS*
========================================================= */

const inputClass = [
  "h-12",
  "w-full",
  "rounded-md",
  "border",
  "border-slate-300",
  "bg-white",
  "px-3",
  "text-[15px]",
  "text-slate-950",
  "outline-none",
  "transition",
  "placeholder:text-slate-400",
  "hover:border-slate-400",
  "focus:border-blue-600",
  "focus:ring-1",
  "focus:ring-blue-600",
].join(" ");

/* =========================================================*
   HELPERS
========================================================= */

function isValidEmail(
value: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value.trim()
  );
}

function getTodayDateInput() {
  const now = new Date();

  const year =
    now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTomorrowDateInput() {
  const tomorrow = new Date();

  tomorrow.setDate(
    tomorrow.getDate() + 1
  );

  const year =
    tomorrow.getFullYear();

  const month = String(
    tomorrow.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    tomorrow.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toDateInputValue(
value?: string | null
) {
  if (!value) {
    return "";
  }

/**
    *Prisma normally sends DateTime as an*
    *ISO string such as:*

    *2026-08-10T00:00:00.000Z*
  */

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date
    .toISOString()
    .slice(0, 10);
}

function formatTime(
value: string
) {
  if (!value) {
    return "--";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "--";
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

function formatDate(
value: string
) {
  if (!value) {
    return "--";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(date);
}

function formatShortDate(
value: string
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
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

function calculateDuration(
departureTime: string,
arrivalTime: string
) {
  if (
    !departureTime ||
    !arrivalTime
  ) {
    return "Direct flight";
  }

  const departure =
    new Date(
      departureTime
    );

  const arrival =
    new Date(
      arrivalTime
    );

  if (
    Number.isNaN(
      departure.getTime()
    ) ||
    Number.isNaN(
      arrival.getTime()
    )
  ) {
    return "Direct flight";
  }

  const difference =
    arrival.getTime() -
    departure.getTime();

  if (difference <= 0) {
    return "Direct flight";
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

function formatCurrency(
value: number,
currency: string
) {
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
    ).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}