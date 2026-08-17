import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { requireOperationsStaff } from "../../lib/authorization";

/* =========================================================
   TYPES
========================================================= */

type PassengerInput = {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  passportNumber?: string | null;
  passportCountry?: string | null;
  passportExpiry?: string | null;
  seatId?: string | null;
};

type CreateBookingBody = {
  scheduleId?: string;

  tripType?: string;
  returnDate?: string | null;

  passengersCount?: number | string;

  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;

  passengers?: PassengerInput[];
};

/* =========================================================
   BASIC HELPERS
========================================================= */

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  return cleaned || null;
}

function parseOptionalDate(value: unknown): Date | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  if (!cleaned) {
    return null;
  }

  /*
   * Passenger forms send YYYY-MM-DD.
   * Parsing at UTC midnight avoids local timezone shifts.
   */

  const date = new Date(`${cleaned}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getTodayUTC(): Date {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  );
}

/* =========================================================
   CONTACT VALIDATION
========================================================= */

function isValidEmail(value: string): boolean {
  const email = value.trim();

  if (email.length < 5 || email.length > 254) {
    return false;
  }

  /*
   * Practical email validation.
   * We do not restrict customers to Gmail.
   */

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
}

function isValidPhone(value: string): boolean {
  /*
   * Allow common customer formatting:
   *
   * +1 617 555 1234
   * (617) 555-1234
   * 617-555-1234
   */

  const digits = value.replace(/\D/g, "");

  return digits.length >= 7 && digits.length <= 15;
}

/* =========================================================
   BOOKING CODE
========================================================= */

function createBookingCode(): string {
  const timestamp = Date.now()
    .toString(36)
    .toUpperCase();

  const random = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return `BK${timestamp}${random}`;
}

/* =========================================================
   TRIP TYPE
========================================================= */

function normalizeTripType(
  value: unknown
): "ONE_WAY" | "ROUND_TRIP" | "MULTI_CITY" {
  if (value === "ROUND_TRIP") {
    return "ROUND_TRIP";
  }

  if (value === "MULTI_CITY") {
    return "MULTI_CITY";
  }

  return "ONE_WAY";
}

/* =========================================================
   POST
   CREATE BOOKING
========================================================= */

export async function POST(request: NextRequest) {
  try {
    /* -----------------------------------------------------
       READ REQUEST
    ----------------------------------------------------- */

    const body: CreateBookingBody = await request.json();

    const scheduleId = cleanString(body.scheduleId);

    const customerName = cleanString(body.customerName);

    const customerEmail = cleanString(body.customerEmail);

    const customerPhone = cleanString(body.customerPhone);

    /* -----------------------------------------------------
       BOOKING CONTACT
    ----------------------------------------------------- */

    if (!scheduleId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Flight information is missing. Please select your flight again.",
        },
        {
          status: 400,
        }
      );
    }

    if (!customerName) {
      return NextResponse.json(
        {
          success: false,
          message: "Contact name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!customerEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Contact email is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!isValidEmail(customerEmail)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        }
      );
    }

    if (!customerPhone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Contact phone number is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!isValidPhone(customerPhone)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid phone number.",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       PASSENGER COUNT
    ----------------------------------------------------- */

    const passengersCount = Number(
      body.passengersCount ?? 1
    );

    if (
      !Number.isInteger(passengersCount) ||
      passengersCount < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Passenger count must be at least 1.",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       PASSENGERS
    ----------------------------------------------------- */

    const passengers = Array.isArray(body.passengers)
      ? body.passengers
      : [];

    if (passengers.length !== passengersCount) {
      return NextResponse.json(
        {
          success: false,
          message: `Expected ${passengersCount} passenger record(s), but received ${passengers.length}.`,
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       DATE USED FOR DOB / PASSPORT VALIDATION
    ----------------------------------------------------- */

    const today = getTodayUTC();

    /* -----------------------------------------------------
       VALIDATE EVERY PASSENGER
    ----------------------------------------------------- */

    for (
      let index = 0;
      index < passengers.length;
      index++
    ) {
      const passenger = passengers[index];

      const passengerNumber = index + 1;

      /* ---------------- FIRST NAME ---------------- */

      if (!cleanString(passenger.firstName)) {
        return NextResponse.json(
          {
            success: false,
            message: `Traveler ${passengerNumber}: first name is required.`,
          },
          {
            status: 400,
          }
        );
      }

      /* ---------------- LAST NAME ---------------- */

      if (!cleanString(passenger.lastName)) {
        return NextResponse.json(
          {
            success: false,
            message: `Traveler ${passengerNumber}: last name is required.`,
          },
          {
            status: 400,
          }
        );
      }

      /* ---------------- DATE OF BIRTH ---------------- */

      if (!passenger.dateOfBirth) {
        return NextResponse.json(
          {
            success: false,
            message: `Traveler ${passengerNumber}: date of birth is required.`,
          },
          {
            status: 400,
          }
        );
      }

      const dateOfBirth = parseOptionalDate(
        passenger.dateOfBirth
      );

      if (!dateOfBirth) {
        return NextResponse.json(
          {
            success: false,
            message: `Traveler ${passengerNumber}: please enter a valid date of birth.`,
          },
          {
            status: 400,
          }
        );
      }

      /*
       * DOB cannot be today or in the future.
       */

      if (dateOfBirth >= today) {
        return NextResponse.json(
          {
            success: false,
            message: `Traveler ${passengerNumber}: date of birth must be before today.`,
          },
          {
            status: 400,
          }
        );
      }

      /* ---------------- GENDER ---------------- */

      const gender = cleanString(
        passenger.gender
      );

      if (!gender) {
        return NextResponse.json(
          {
            success: false,
            message: `Traveler ${passengerNumber}: gender is required.`,
          },
          {
            status: 400,
          }
        );
      }

      if (
        !["MALE", "FEMALE", "OTHER"].includes(
          gender.toUpperCase()
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Traveler ${passengerNumber}: please select a valid gender.`,
          },
          {
            status: 400,
          }
        );
      }

      /* ---------------- NATIONALITY ---------------- */

      if (!cleanString(passenger.nationality)) {
        return NextResponse.json(
          {
            success: false,
            message: `Traveler ${passengerNumber}: nationality is required.`,
          },
          {
            status: 400,
          }
        );
      }

      /* ---------------- PASSPORT NUMBER ---------------- */

      if (!cleanString(passenger.passportNumber)) {
        return NextResponse.json(
          {
            success: false,
            message: `Traveler ${passengerNumber}: passport number is required.`,
          },
          {
            status: 400,
          }
        );
      }

      /* ---------------- PASSPORT COUNTRY ---------------- */

      if (!cleanString(passenger.passportCountry)) {
        return NextResponse.json(
          {
            success: false,
            message: `Traveler ${passengerNumber}: passport country is required.`,
          },
          {
            status: 400,
          }
        );
      }

      /* ---------------- PASSPORT EXPIRY ---------------- */

      if (!passenger.passportExpiry) {
        return NextResponse.json(
          {
            success: false,
            message: `Traveler ${passengerNumber}: passport expiration date is required.`,
          },
          {
            status: 400,
          }
        );
      }

      const passportExpiry = parseOptionalDate(
        passenger.passportExpiry
      );

      if (!passportExpiry) {
        return NextResponse.json(
          {
            success: false,
            message: `Traveler ${passengerNumber}: please enter a valid passport expiration date.`,
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Expired today = not accepted.
       * Past expiration = not accepted.
       */

      if (passportExpiry <= today) {
        return NextResponse.json(
          {
            success: false,
            message: `Traveler ${passengerNumber}: passport must be valid beyond today.`,
          },
          {
            status: 400,
          }
        );
      }
    }

    /* -----------------------------------------------------
       TRIP TYPE
    ----------------------------------------------------- */

    const tripType = normalizeTripType(
      body.tripType
    );

    if (tripType === "MULTI_CITY") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Multi-city booking is not currently available.",
        },
        {
          status: 400,
        }
      );
    }

    const returnDate = parseOptionalDate(
      body.returnDate
    );

    if (
      tripType === "ROUND_TRIP" &&
      !returnDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A return date is required for a round-trip booking.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       GET REAL FLIGHT FROM DATABASE

       Never trust:
       - airline from URL
       - route from URL
       - aircraft from URL
       - fare from URL
       - seat inventory from URL

       scheduleId is used to retrieve authoritative data.
    ===================================================== */

    const schedule =
      await prisma.flightSchedule.findUnique({
        where: {
          id: scheduleId,
        },

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
      });

    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The selected flight could not be found. Please search again.",
        },
        {
          status: 404,
        }
      );
    }

    /* -----------------------------------------------------
       SCHEDULE STATUS
    ----------------------------------------------------- */

    if (schedule.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This flight has been cancelled and is no longer available for booking.",
        },
        {
          status: 400,
        }
      );
    }

    if (schedule.status === "DEPARTED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This flight has already departed.",
        },
        {
          status: 400,
        }
      );
    }

    if (schedule.status === "ARRIVED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This flight has already arrived and cannot be booked.",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       DEPARTURE TIME
    ----------------------------------------------------- */

    const currentTime = new Date();

    if (
      schedule.departureTime &&
      new Date(schedule.departureTime) <= currentTime
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This flight is no longer available for booking because its departure time has passed.",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       INVENTORY
    ----------------------------------------------------- */

    if (
      schedule.availableSeats <
      passengersCount
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            schedule.availableSeats === 0
              ? "This flight is sold out."
              : `Only ${schedule.availableSeats} seat${
                  schedule.availableSeats === 1
                    ? ""
                    : "s"
                } remain on this flight.`,

          availableSeats:
            schedule.availableSeats,

          requestedSeats:
            passengersCount,
        },
        {
          status: 409,
        }
      );
    }

    /* =====================================================
       FARE

       IMPORTANT:
       Price comes ONLY from the database.
    ===================================================== */

    const baseFarePerPassenger = Number(
      schedule.baseFare
    );

    if (
      !Number.isFinite(
        baseFarePerPassenger
      ) ||
      baseFarePerPassenger < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The fare for this flight is currently unavailable.",
        },
        {
          status: 500,
        }
      );
    }

    const baseFareTotal =
      baseFarePerPassenger *
      passengersCount;

    /*
     * Tax engine can be connected later.
     */

    const taxes = 0;

    const serviceFee = 0;

    const totalAmount =
      baseFareTotal +
      taxes +
      serviceFee;

    /* -----------------------------------------------------
       DATABASE FLIGHT INFORMATION
    ----------------------------------------------------- */

    const airline =
      schedule.route.airline;

    const originAirport =
      schedule.route.originAirport;

    const destinationAirport =
      schedule.route.destinationAirport;

    const flightNumber =
      schedule.route.flightNumber;

    const bookingCode =
      createBookingCode();

    /* =====================================================
       TRANSACTION
    ===================================================== */

    const createdBooking =
      await prisma.$transaction(
        async (tx) => {
          /* ---------------------------------------------
             CREATE BOOKING
          --------------------------------------------- */

          const booking =
            await tx.booking.create({
              data: {
                bookingCode,

                scheduleId:
                  schedule.id,

                tripType,

                departureDate:
                  schedule.departureTime,

                returnDate:
                  tripType ===
                    "ROUND_TRIP"
                    ? returnDate
                    : null,

                passengersCount,

                customerName,

                customerEmail:
                  customerEmail.toLowerCase(),

                customerPhone,

                airlineName:
                  airline.name,

                airlineCode:
                  airline.iataCode,

                flightNumber,

                originCode:
                  originAirport.iataCode,

                originCity:
                  originAirport.city,

                destinationCode:
                  destinationAirport.iataCode,

                destinationCity:
                  destinationAirport.city,

                provider:
                  "INTERNAL",

                /*
                 * Booking.baseFare currently stores
                 * the PER-PASSENGER fare.
                 */

                baseFare:
                  baseFarePerPassenger,

                taxes,

                serviceFee,

                totalAmount,

                currency:
                  "USD",

                status:
                  "DRAFT",

                paymentStatus:
                  "PENDING",
              },
            });

          /* ---------------------------------------------
             CREATE PASSENGERS
          --------------------------------------------- */

          const createdPassengers = [];

          for (
            const passenger of passengers
          ) {
            const createdPassenger =
              await tx.passenger.create({
                data: {
                  bookingId:
                    booking.id,

                  firstName:
                    cleanString(
                      passenger.firstName
                    )!,

                  middleName:
                    cleanString(
                      passenger.middleName
                    ),

                  lastName:
                    cleanString(
                      passenger.lastName
                    )!,

                  dateOfBirth:
                    parseOptionalDate(
                      passenger.dateOfBirth
                    ),

                  gender:
                    cleanString(
                      passenger.gender
                    ),

                  nationality:
                    cleanString(
                      passenger.nationality
                    ),

                  passportNumber:
                    cleanString(
                      passenger.passportNumber
                    ),

                  passportCountry:
                    cleanString(
                      passenger.passportCountry
                    ),

                  passportExpiry:
                    parseOptionalDate(
                      passenger.passportExpiry
                    ),
                },
              });

            createdPassengers.push(
              createdPassenger
            );
          }

          /* ---------------------------------------------
             OPTIONAL SEAT SELECTION

             Passenger form does not need seatId yet.
             This runs only if a seatId is provided.
          --------------------------------------------- */

          let reservedSeats = 0;

          for (
            let index = 0;
            index < passengers.length;
            index++
          ) {
            const requestedSeatId =
              cleanString(
                passengers[index].seatId
              );

            if (!requestedSeatId) {
              continue;
            }

            const seat =
              await tx.seat.findUnique({
                where: {
                  id: requestedSeatId,
                },
              });

            if (!seat) {
              throw new Error(
                "SEAT_NOT_FOUND"
              );
            }

            if (
              seat.scheduleId !==
              schedule.id
            ) {
              throw new Error(
                "SEAT_SCHEDULE_MISMATCH"
              );
            }

            if (
              seat.status !==
                "AVAILABLE" ||
              seat.bookingId !== null ||
              seat.passengerId !== null
            ) {
              throw new Error(
                "SEAT_NOT_AVAILABLE"
              );
            }

            /*
             * updateMany provides an additional
             * condition check before reserving.
             */

            const reservation =
              await tx.seat.updateMany({
                where: {
                  id: seat.id,

                  scheduleId:
                    schedule.id,

                  status:
                    "AVAILABLE",

                  bookingId:
                    null,

                  passengerId:
                    null,
                },

                data: {
                  bookingId:
                    booking.id,

                  passengerId:
                    createdPassengers[
                      index
                    ].id,

                  status:
                    "BOOKED",
                },
              });

            if (
              reservation.count !== 1
            ) {
              throw new Error(
                "SEAT_RESERVATION_CONFLICT"
              );
            }

            reservedSeats++;
          }

          /* ---------------------------------------------
             UPDATE INVENTORY WHEN SEAT MAP EXISTS
          --------------------------------------------- */

          const totalSeatRecords =
            await tx.seat.count({
              where: {
                scheduleId:
                  schedule.id,
              },
            });

          if (totalSeatRecords > 0) {
            const availableSeatCount =
              await tx.seat.count({
                where: {
                  scheduleId:
                    schedule.id,

                  status:
                    "AVAILABLE",
                },
              });

            await tx.flightSchedule.update({
              where: {
                id: schedule.id,
              },

              data: {
                availableSeats:
                  availableSeatCount,
              },
            });
          }

          return {
            booking,
            createdPassengers,
            reservedSeats,
          };
        }
      );

    /* =====================================================
       FETCH COMPLETE BOOKING
    ===================================================== */

    const result =
      await prisma.booking.findUnique({
        where: {
          id: createdBooking.booking.id,
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

              aircraft: true,
            },
          },

          passengers: {
            include: {
              seat: true,
            },
          },

          seats: true,

          payments: true,

          user: true,
        },
      });

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The booking was created but could not be retrieved.",
        },
        {
          status: 500,
        }
      );
    }

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        message:
          "Booking created successfully.",

        data: result,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE BOOKING ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    /* -----------------------------------------------------
       SEAT ERRORS
    ----------------------------------------------------- */

    if (
      message === "SEAT_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The selected seat could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      message ===
      "SEAT_SCHEDULE_MISMATCH"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The selected seat does not belong to this flight.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      message ===
      "SEAT_NOT_AVAILABLE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The selected seat is no longer available.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      message ===
      "SEAT_RESERVATION_CONFLICT"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Another customer reserved the selected seat. Please choose another seat.",
        },
        {
          status: 409,
        }
      );
    }

    /* -----------------------------------------------------
       GENERAL ERROR
    ----------------------------------------------------- */

    return NextResponse.json(
      {
        success: false,

        message:
          "We were unable to create your booking. Please try again.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? message
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   GET
   LIST BOOKINGS
========================================================= */

export async function GET() {
  try {
    const auth = await requireOperationsStaff();

    if (!auth.authorized) {
      return auth.response;
    }

    const bookings =
      await prisma.booking.findMany({
        orderBy: {
          createdAt: "desc",
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

              aircraft: true,
            },
          },

          passengers: {
            include: {
              seat: true,
            },
          },

          seats: true,

          payments: true,

          user: true,
        },
      });

    return NextResponse.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error(
      "GET BOOKINGS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to fetch bookings.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}