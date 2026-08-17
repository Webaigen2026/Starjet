import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import {
  authorizeBookingAccess,
  requireAuthenticatedUser
} from "../../../../lib/authorization";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthenticatedUser();

    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;

    console.log("================================");
    console.log("CONFIRM BOOKING");
    console.log("Booking ID:", id);
    console.log("================================");

    // ====================================================
    // 1. VALIDATE BOOKING ID
    // ====================================================

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ====================================================
    // 2. FIND BOOKING
    // ====================================================

    const booking = await prisma.booking.findUnique({
      where: {
        id,
      },

      include: {
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

    // ====================================================
    // 3. BOOKING MUST EXIST
    // ====================================================

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking not found.",
        },
        {
          status: 404,
        }
      );
    }

    const access = authorizeBookingAccess(auth.user, booking);

    if (!access.authorized) {
      return access.response;
    }

    // ====================================================
    // 4. BOOKING STATUS VALIDATION
    // ====================================================

    if (booking.status === "CONFIRMED") {
      return NextResponse.json(
        {
          success: false,
          message: "Booking is already confirmed.",
        },
        {
          status: 409,
        }
      );
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cancelled bookings cannot be confirmed.",
        },
        {
          status: 409,
        }
      );
    }

    if (booking.status === "CHECKED_IN") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Checked-in bookings cannot be confirmed again.",
        },
        {
          status: 409,
        }
      );
    }

    if (booking.status === "BOARDED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Boarded bookings cannot be confirmed.",
        },
        {
          status: 409,
        }
      );
    }

    if (booking.status === "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Completed bookings cannot be confirmed.",
        },
        {
          status: 409,
        }
      );
    }

    // ====================================================
    // 5. ONLY DRAFT BOOKINGS MAY BE CONFIRMED
    // ====================================================

    if (booking.status !== "DRAFT") {
      return NextResponse.json(
        {
          success: false,
          message: `Booking cannot be confirmed from status ${booking.status}.`,
        },
        {
          status: 409,
        }
      );
    }

    // ====================================================
    // 6. SCHEDULE MUST EXIST
    // ====================================================

    if (!booking.schedule) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Booking does not have a valid flight schedule.",
        },
        {
          status: 409,
        }
      );
    }

    // ====================================================
    // 7. FLIGHT MUST STILL BE BOOKABLE
    // ====================================================

    if (booking.schedule.status !== "SCHEDULED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Booking cannot be confirmed because the flight is no longer in SCHEDULED status.",
          data: {
            scheduleStatus: booking.schedule.status,
          },
        },
        {
          status: 409,
        }
      );
    }

    // ====================================================
    // 8. PASSENGER COUNT VALIDATION
    // ====================================================

    if (
      booking.passengers.length !==
      booking.passengersCount
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Booking passenger count does not match the passenger records.",
          data: {
            expectedPassengers:
              booking.passengersCount,
            actualPassengers:
              booking.passengers.length,
          },
        },
        {
          status: 409,
        }
      );
    }

    if (booking.passengers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Booking cannot be confirmed without passengers.",
        },
        {
          status: 409,
        }
      );
    }

    // ====================================================
    // 9. EVERY PASSENGER MUST HAVE A SEAT
    // ====================================================

    const passengersWithoutSeats =
      booking.passengers.filter(
        (passenger) => !passenger.seat
      );

    if (passengersWithoutSeats.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Every passenger must have a seat before the booking can be confirmed.",

          data: {
            passengersWithoutSeats:
              passengersWithoutSeats.map(
                (passenger) => ({
                  id: passenger.id,
                  firstName:
                    passenger.firstName,
                  lastName:
                    passenger.lastName,
                })
              ),
          },
        },
        {
          status: 409,
        }
      );
    }

    // ====================================================
    // 10. VERIFY BOOKING SEAT COUNT
    // ====================================================

    if (
      booking.seats.length !==
      booking.passengersCount
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The number of assigned seats does not match the passenger count.",
          data: {
            passengers:
              booking.passengersCount,
            assignedSeats:
              booking.seats.length,
          },
        },
        {
          status: 409,
        }
      );
    }

    // ====================================================
    // 11. VERIFY EACH SEAT
    // ====================================================

    for (const seat of booking.seats) {
      if (
        seat.scheduleId !==
        booking.scheduleId
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "One or more seats belong to a different flight schedule.",
          },
          {
            status: 409,
          }
        );
      }

      if (seat.bookingId !== booking.id) {
        return NextResponse.json(
          {
            success: false,
            message:
              "One or more seats are not assigned to this booking.",
          },
          {
            status: 409,
          }
        );
      }

      if (!seat.passengerId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "One or more seats are not assigned to a passenger.",
          },
          {
            status: 409,
          }
        );
      }

      if (
        seat.status !== "RESERVED" &&
        seat.status !== "BOOKED"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "One or more assigned seats are not in a valid reservation state.",
            data: {
              seatNumber:
                seat.seatNumber,
              seatStatus:
                seat.status,
            },
          },
          {
            status: 409,
          }
        );
      }
    }

    // ====================================================
    // 12. CONFIRM BOOKING TRANSACTION
    // ====================================================

    await prisma.$transaction(async (tx) => {
      // --------------------------------------------------
      // Recheck booking state inside transaction
      // --------------------------------------------------

      const currentBooking =
        await tx.booking.findUnique({
          where: {
            id: booking.id,
          },

          select: {
            status: true,
          },
        });

      if (!currentBooking) {
        throw new Error(
          "BOOKING_NOT_FOUND"
        );
      }

      if (
        currentBooking.status !== "DRAFT"
      ) {
        throw new Error(
          "BOOKING_STATUS_CHANGED"
        );
      }

      // --------------------------------------------------
      // Recheck schedule
      // --------------------------------------------------

      const currentSchedule =
        await tx.flightSchedule.findUnique({
          where: {
            id: booking.scheduleId,
          },

          select: {
            status: true,
          },
        });

      if (!currentSchedule) {
        throw new Error(
          "SCHEDULE_NOT_FOUND"
        );
      }

      if (
        currentSchedule.status !==
        "SCHEDULED"
      ) {
        throw new Error(
          "SCHEDULE_STATUS_CHANGED"
        );
      }

      // --------------------------------------------------
      // Verify seats are still owned by this booking
      // --------------------------------------------------

      const validSeatCount =
        await tx.seat.count({
          where: {
            bookingId: booking.id,
            scheduleId:
              booking.scheduleId,

            passengerId: {
              not: null,
            },

            status: {
              in: [
                "RESERVED",
                "BOOKED",
              ],
            },
          },
        });

      if (
        validSeatCount !==
        booking.passengersCount
      ) {
        throw new Error(
          "SEAT_STATE_CHANGED"
        );
      }

      // --------------------------------------------------
      // Convert RESERVED seats to BOOKED
      // --------------------------------------------------

      await tx.seat.updateMany({
        where: {
          bookingId: booking.id,
          scheduleId:
            booking.scheduleId,
          status: "RESERVED",
        },

        data: {
          status: "BOOKED",
        },
      });

      // --------------------------------------------------
      // Confirm booking
      // --------------------------------------------------

      await tx.booking.update({
        where: {
          id: booking.id,
        },

        data: {
          status: "CONFIRMED",
        },
      });
    });

    // ====================================================
    // 13. GET UPDATED BOOKING
    // ====================================================

    const updatedBooking =
      await prisma.booking.findUnique({
        where: {
          id: booking.id,
        },

        include: {
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

          passengers: {
            include: {
              seat: true,
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
    // 14. SUCCESS
    // ====================================================

    return NextResponse.json(
      {
        success: true,
        message:
          "Booking confirmed successfully.",
        data: updatedBooking,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "================================"
    );
    console.error(
      "CONFIRM BOOKING ERROR"
    );
    console.error(error);
    console.error(
      "================================"
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    // ====================================================
    // KNOWN TRANSACTION ERRORS
    // ====================================================

    const knownErrors: Record<
      string,
      {
        message: string;
        status: number;
      }
    > = {
      BOOKING_NOT_FOUND: {
        message:
          "Booking no longer exists.",
        status: 404,
      },

      SCHEDULE_NOT_FOUND: {
        message:
          "Flight schedule no longer exists.",
        status: 404,
      },

      BOOKING_STATUS_CHANGED: {
        message:
          "Booking status changed while confirmation was being processed.",
        status: 409,
      },

      SCHEDULE_STATUS_CHANGED: {
        message:
          "Flight status changed while confirmation was being processed.",
        status: 409,
      },

      SEAT_STATE_CHANGED: {
        message:
          "One or more seats changed while confirmation was being processed.",
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
          "Unable to confirm booking.",

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