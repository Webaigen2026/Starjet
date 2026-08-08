import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "../../lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";

// ========================================================
// TYPES
// ========================================================

type PassengerInput = {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  passportNumber?: string | null;
  passportCountry?: string | null;
  passportExpiry?: string | null;
};

// ========================================================
// HELPERS
// ========================================================

function parseOptionalDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    throw new Error("INVALID_DATE");
  }

  return date;
}

function parseOptionalNumber(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new Error("INVALID_AMOUNT");
  }

  return number;
}

// ========================================================
// GET ALL BOOKINGS
// ========================================================

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
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

          orderBy: {
            createdAt: "asc",
          },
        },

        payments: true,

        seats: {
          orderBy: {
            seatNumber: "asc",
          },
        },

        user: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("GET BOOKINGS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch bookings.",
        error:
          process.env.NODE_ENV === "development"
            ? String(error)
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}

// ========================================================
// CREATE BOOKING
// ========================================================

export async function POST(request: NextRequest) {
  try {
    // ====================================================
    // 1. READ REQUEST BODY
    // ====================================================

    let body: Record<string, any>;

    try {
      body = await request.json();
    } catch {
      throw new Error("INVALID_JSON");
    }

    // ====================================================
    // 2. GET LOGGED-IN USER SESSION
    // ====================================================

    const session = await getServerSession(authOptions);

    // ====================================================
    // 3. PASSENGERS
    // ====================================================

    const passengers: PassengerInput[] =
      Array.isArray(body.passengers)
        ? body.passengers
        : [];

    // ====================================================
    // 4. SELECTED SEATS
    // ====================================================

    const selectedSeatIds: string[] =
      Array.isArray(body.selectedSeatIds)
        ? [
            ...new Set(
              body.selectedSeatIds
                .filter(
                  (seatId: unknown) =>
                    typeof seatId === "string"
                )
                .map((seatId: string) =>
                  seatId.trim()
                )
                .filter(Boolean)
            ),
          ]
        : [];

    // ====================================================
    // 5. PASSENGER COUNT
    // ====================================================

    const passengersCount = Number(
      body.passengersCount ??
        (passengers.length > 0
          ? passengers.length
          : 1)
    );

    // ====================================================
    // 6. VALIDATE REQUIRED BOOKING FIELDS
    //
    // IMPORTANT:
    // Flight information is NOT accepted as the source
    // of truth from the client.
    //
    // The schedule determines:
    // - departure date
    // - airline
    // - flight number
    // - origin
    // - destination
    // - base fare
    // ====================================================

    if (
      !body.scheduleId ||
      !body.customerName ||
      !body.customerEmail
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "scheduleId, customerName and customerEmail are required.",
        },
        {
          status: 400,
        }
      );
    }

    // ====================================================
    // 7. VALIDATE PASSENGER COUNT
    // ====================================================

    if (
      !Number.isInteger(passengersCount) ||
      passengersCount < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "passengersCount must be a whole number of at least 1.",
        },
        {
          status: 400,
        }
      );
    }

    // ====================================================
    // 8. PASSENGER RECORDS MUST MATCH COUNT
    // ====================================================

    if (
      passengers.length > 0 &&
      passengers.length !== passengersCount
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The number of passenger records must match passengersCount.",
        },
        {
          status: 400,
        }
      );
    }

    // ====================================================
    // 9. SELECTED SEATS MUST MATCH PASSENGER COUNT
    // ====================================================

    if (
      selectedSeatIds.length > 0 &&
      selectedSeatIds.length !== passengersCount
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The number of selected seats must match passengersCount.",
        },
        {
          status: 400,
        }
      );
    }

    // ====================================================
    // 10. VALIDATE PASSENGER NAMES
    // ====================================================

    for (const passenger of passengers) {
      if (
        !passenger.firstName?.trim() ||
        !passenger.lastName?.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Every passenger must have firstName and lastName.",
          },
          {
            status: 400,
          }
        );
      }
    }

    // ====================================================
    // 11. TRIP TYPE
    // ====================================================

    const tripType =
      body.tripType ?? "ONE_WAY";

    // ====================================================
    // 12. RETURN DATE
    //
    // ONE_WAY always gets null.
    // Other trip types may supply a returnDate.
    // ====================================================

    const returnDate =
      tripType === "ONE_WAY"
        ? null
        : parseOptionalDate(body.returnDate);

    // ====================================================
    // 13. CREATE BOOKING CODE
    // ====================================================

    const bookingCode = `BK${Date.now()
      .toString(36)
      .toUpperCase()}${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    // ====================================================
    // 14. TRANSACTION
    // ====================================================

    const bookingId = await prisma.$transaction(
      async (tx) => {
        // ================================================
        // FIND SCHEDULE
        // ================================================

        const schedule =
          await tx.flightSchedule.findUnique({
            where: {
              id: body.scheduleId,
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
          throw new Error(
            "SCHEDULE_NOT_FOUND"
          );
        }

        // ================================================
        // SCHEDULE MUST BE BOOKABLE
        // ================================================

        if (schedule.status !== "SCHEDULED") {
          throw new Error(
            "SCHEDULE_NOT_BOOKABLE"
          );
        }

        // ================================================
        // VALIDATE RETURN DATE AGAINST REAL SCHEDULE
        // ================================================

        if (
          returnDate &&
          returnDate <= schedule.departureTime
        ) {
          throw new Error(
            "INVALID_RETURN_DATE"
          );
        }

        // ================================================
        // CHECK INVENTORY
        // ================================================

        if (
          selectedSeatIds.length >
          schedule.availableSeats
        ) {
          throw new Error(
            "NOT_ENOUGH_SEATS"
          );
        }

        // ================================================
        // VERIFY SELECTED SEATS
        // ================================================

        if (selectedSeatIds.length > 0) {
          const selectedSeats =
            await tx.seat.findMany({
              where: {
                id: {
                  in: selectedSeatIds,
                },
              },

              select: {
                id: true,
                scheduleId: true,
                status: true,
                bookingId: true,
                passengerId: true,
              },
            });

          // ----------------------------------------------
          // Make sure every requested seat exists
          // ----------------------------------------------

          if (
            selectedSeats.length !==
            selectedSeatIds.length
          ) {
            throw new Error(
              "SEAT_NOT_FOUND"
            );
          }

          // ----------------------------------------------
          // Every seat must belong to this schedule
          // ----------------------------------------------

          const hasSeatFromDifferentSchedule =
            selectedSeats.some(
              (seat) =>
                seat.scheduleId !==
                schedule.id
            );

          if (
            hasSeatFromDifferentSchedule
          ) {
            throw new Error(
              "SEAT_SCHEDULE_MISMATCH"
            );
          }

          // ----------------------------------------------
          // Every seat must be available
          // ----------------------------------------------

          const hasUnavailableSeat =
            selectedSeats.some(
              (seat) =>
                seat.status !==
                  "AVAILABLE" ||
                seat.bookingId !== null ||
                seat.passengerId !== null
            );

          if (hasUnavailableSeat) {
            throw new Error(
              "SEAT_NOT_AVAILABLE"
            );
          }
        }

        // ================================================
        // CREATE BOOKING
        // ================================================
        //
        // IMPORTANT:
        // All actual flight information comes from
        // schedule -> route -> airports/airline.
        //
        // We DO NOT trust the frontend for these values.
        // ================================================

        const createdBooking =
          await tx.booking.create({
            data: {
              bookingCode,

              // ------------------------------------------
              // Schedule
              // ------------------------------------------

              schedule: {
                connect: {
                  id: schedule.id,
                },
              },

              // ------------------------------------------
              // Logged-in user if available
              // ------------------------------------------

              ...(session?.user &&
              (session.user as { id?: string })
                .id
                ? {
                    user: {
                      connect: {
                        id: (
                          session.user as {
                            id: string;
                          }
                        ).id,
                      },
                    },
                  }
                : {}),

              // ------------------------------------------
              // Trip
              // ------------------------------------------

              tripType,

              // ------------------------------------------
              // Origin - DATABASE SOURCE OF TRUTH
              // ------------------------------------------

              originCode:
                schedule.route.originAirport
                  .iataCode,

              originCity:
                schedule.route.originAirport
                  .city,

              // ------------------------------------------
              // Destination - DATABASE SOURCE OF TRUTH
              // ------------------------------------------

              destinationCode:
                schedule.route
                  .destinationAirport.iataCode,

              destinationCity:
                schedule.route
                  .destinationAirport.city,

              // ------------------------------------------
              // Dates - DATABASE SOURCE OF TRUTH
              // ------------------------------------------

              departureDate:
                schedule.departureTime,

              returnDate,

              // ------------------------------------------
              // Passenger count
              // ------------------------------------------

              passengersCount,

              // ------------------------------------------
              // Airline - DATABASE SOURCE OF TRUTH
              // ------------------------------------------

              airlineName:
                schedule.route.airline.name,

              airlineCode:
                schedule.route.airline
                  .iataCode,

              // ------------------------------------------
              // Flight number
              // ------------------------------------------

              flightNumber:
                schedule.route.flightNumber,

              // ------------------------------------------
              // Internal airline booking
              // ------------------------------------------

              flightOfferId: null,

              provider: "INTERNAL",

              // ------------------------------------------
              // Fare - DATABASE SOURCE OF TRUTH
              // ------------------------------------------

              baseFare: Number(
                schedule.baseFare
              ),

              // ------------------------------------------
              // Additional pricing
              //
              // Keeping these for now because payment
              // processing will be implemented later.
              // ------------------------------------------

              taxes: parseOptionalNumber(
                body.taxes
              ),

              serviceFee:
                parseOptionalNumber(
                  body.serviceFee
                ),

              totalAmount:
                parseOptionalNumber(
                  body.totalAmount
                ),

              currency: "USD",

              // ------------------------------------------
              // Customer
              // ------------------------------------------

              customerName: String(
                body.customerName
              ).trim(),

              customerEmail: String(
                body.customerEmail
              )
                .trim()
                .toLowerCase(),

              customerPhone:
                body.customerPhone ?? null,

              // ------------------------------------------
              // Initial states
              // ------------------------------------------

              status: "DRAFT",

              paymentStatus: "PENDING",

              stripeCheckoutSessionId: null,

              stripePaymentIntentId: null,
            },
          });

        // ================================================
        // CREATE PASSENGERS
        // ================================================

        const createdPassengers = [];

        for (const passenger of passengers) {
          const dateOfBirth =
            parseOptionalDate(
              passenger.dateOfBirth
            );

          const passportExpiry =
            parseOptionalDate(
              passenger.passportExpiry
            );

          const createdPassenger =
            await tx.passenger.create({
              data: {
                bookingId:
                  createdBooking.id,

                firstName:
                  passenger.firstName.trim(),

                middleName:
                  passenger.middleName?.trim() ||
                  null,

                lastName:
                  passenger.lastName.trim(),

                dateOfBirth,

                gender:
                  passenger.gender ?? null,

                nationality:
                  passenger.nationality ??
                  null,

                passportNumber:
                  passenger.passportNumber?.trim() ||
                  null,

                passportCountry:
                  passenger.passportCountry ??
                  null,

                passportExpiry,
              },
            });

          createdPassengers.push(
            createdPassenger
          );
        }

        // ================================================
        // RESERVE SELECTED SEATS
        // ================================================

        for (
          let index = 0;
          index < selectedSeatIds.length;
          index++
        ) {
          const seatId =
            selectedSeatIds[index];

          const passenger =
            createdPassengers[index];

          // ----------------------------------------------
          // Atomic conditional seat reservation
          // ----------------------------------------------

          const updateResult =
            await tx.seat.updateMany({
              where: {
                id: seatId,

                scheduleId:
                  schedule.id,

                status: "AVAILABLE",

                bookingId: null,

                passengerId: null,
              },

              data: {
                bookingId:
                  createdBooking.id,

                passengerId:
                  passenger?.id ?? null,

                status: "RESERVED",
              },
            });

          // ----------------------------------------------
          // Protect against another request taking seat
          // ----------------------------------------------

          if (updateResult.count !== 1) {
            throw new Error(
              "SEAT_RESERVATION_CONFLICT"
            );
          }
        }

        // ================================================
        // RECALCULATE AVAILABLE SEATS
        // ================================================
        //
        // Instead of blindly decrementing the stored
        // number, calculate it from the real seat table.
        // This keeps inventory synchronized.
        // ================================================

        const availableSeatCount =
          await tx.seat.count({
            where: {
              scheduleId:
                schedule.id,

              status: "AVAILABLE",

              bookingId: null,

              passengerId: null,
            },
          });

        // ================================================
        // UPDATE SCHEDULE INVENTORY
        // ================================================

        await tx.flightSchedule.update({
          where: {
            id: schedule.id,
          },

          data: {
            availableSeats:
              availableSeatCount,
          },
        });

        return createdBooking.id;
      }
    );

    // ====================================================
    // 15. GET COMPLETE CREATED BOOKING
    // ====================================================

    const createdBooking =
      await prisma.booking.findUnique({
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

              aircraft: true,
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

          seats: {
            orderBy: {
              seatNumber: "asc",
            },
          },

          payments: true,

          user: true,
        },
      });

    // ====================================================
    // 16. SUCCESS RESPONSE
    // ====================================================

    return NextResponse.json(
      {
        success: true,

        message:
          selectedSeatIds.length > 0
            ? "Booking created and seats reserved successfully."
            : "Booking created successfully.",

        data: createdBooking,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "BOOKING CREATE ERROR:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    // ====================================================
    // KNOWN ERRORS
    // ====================================================

    const knownErrors: Record<
      string,
      {
        message: string;
        status: number;
      }
    > = {
      INVALID_JSON: {
        message:
          "The request body contains invalid JSON.",
        status: 400,
      },

      INVALID_DATE: {
        message:
          "One or more dates are invalid.",
        status: 400,
      },

      INVALID_RETURN_DATE: {
        message:
          "returnDate must be after the scheduled departure time.",
        status: 400,
      },

      INVALID_AMOUNT: {
        message:
          "taxes, serviceFee and totalAmount must contain valid positive numbers.",
        status: 400,
      },

      SCHEDULE_NOT_FOUND: {
        message:
          "Flight schedule not found.",
        status: 404,
      },

      SCHEDULE_NOT_BOOKABLE: {
        message:
          "This flight schedule is not currently available for booking.",
        status: 409,
      },

      NOT_ENOUGH_SEATS: {
        message:
          "This schedule does not have enough available seats.",
        status: 409,
      },

      SEAT_NOT_FOUND: {
        message:
          "One or more selected seats could not be found.",
        status: 404,
      },

      SEAT_SCHEDULE_MISMATCH: {
        message:
          "One or more selected seats do not belong to this flight schedule.",
        status: 400,
      },

      SEAT_NOT_AVAILABLE: {
        message:
          "One or more selected seats are no longer available.",
        status: 409,
      },

      SEAT_RESERVATION_CONFLICT: {
        message:
          "Another customer reserved one of these seats. Select different seats and try again.",
        status: 409,
      },
    };

    const knownError =
      knownErrors[errorMessage];

    return NextResponse.json(
      {
        success: false,

        message:
          knownError?.message ??
          "Unable to create booking.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? errorMessage
            : undefined,
      },
      {
        status:
          knownError?.status ?? 500,
      }
    );
  }
}