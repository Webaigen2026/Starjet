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

    console.log("========================================");
    console.log("CANCEL BOOKING");
    console.log("Booking ID:", id);
    console.log("========================================");

    // --------------------------------------------------------
    // Find Booking
    // --------------------------------------------------------

    const booking = await prisma.booking.findUnique({
      where: {
        id,
      },
      include: {
        schedule: true,
        seats: true,
        passengers: true,
        payments: true,
        user: true,
      },
    });

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

    // --------------------------------------------------------
    // Prevent Invalid Booking Cancellations
    // --------------------------------------------------------

    const nonCancellableBookingStatuses = [
      "BOARDED",
      "COMPLETED",
      "CANCELLED",
    ];

    if (nonCancellableBookingStatuses.includes(booking.status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Booking cannot be cancelled because its status is ${booking.status}.`,
          data: {
            bookingId: booking.id,
            bookingCode: booking.bookingCode,
            bookingStatus: booking.status,
          },
        },
        {
          status: 409,
        }
      );
    }

    // --------------------------------------------------------
    // Prevent Cancellation After Flight Has Started
    // --------------------------------------------------------

    const nonCancellableFlightStatuses = [
      "BOARDING",
      "DEPARTED",
      "ARRIVED",
      "CANCELLED",
    ];

    if (
      nonCancellableFlightStatuses.includes(
        booking.schedule.status
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Booking cannot be cancelled because the flight status is ${booking.schedule.status}.`,
          data: {
            bookingId: booking.id,
            bookingCode: booking.bookingCode,
            bookingStatus: booking.status,
            flightStatus: booking.schedule.status,
          },
        },
        {
          status: 409,
        }
      );
    }

    // --------------------------------------------------------
    // Check Payment State
    // --------------------------------------------------------

    const hasPaidPayment = booking.payments.some(
      (payment) => payment.status === "PAID"
    );

    const releasedSeatCount = booking.seats.length;

    // --------------------------------------------------------
    // Cancel Booking Transaction
    // --------------------------------------------------------

    await prisma.$transaction(async (tx) => {
      // ------------------------------------------------------
      // Cancel Booking
      // ------------------------------------------------------

      await tx.booking.update({
        where: {
          id: booking.id,
        },
        data: {
          status: "CANCELLED",

          // Only mark the booking as refunded when an actual
          // PAID payment exists.
          ...(hasPaidPayment
            ? {
                paymentStatus: "REFUNDED",
              }
            : {}),
        },
      });

      // ------------------------------------------------------
      // Release Assigned Seats
      // ------------------------------------------------------

      if (releasedSeatCount > 0) {
        await tx.seat.updateMany({
          where: {
            bookingId: booking.id,
          },
          data: {
            bookingId: null,
            passengerId: null,
            status: "AVAILABLE",
          },
        });
      }

      // ------------------------------------------------------
      // Update Payment Records
      // ------------------------------------------------------
      //
      // NOTE:
      // This is database-only refund handling.
      //
      // When Stripe is integrated later, the real Stripe
      // refund must succeed BEFORE marking the payment
      // REFUNDED in the database.
      // ------------------------------------------------------

      if (hasPaidPayment) {
        await tx.payment.updateMany({
          where: {
            bookingId: booking.id,
            status: "PAID",
          },
          data: {
            status: "REFUNDED",
          },
        });
      }

      // ------------------------------------------------------
      // Recalculate Available Seats
      // ------------------------------------------------------
      //
      // We calculate this from the real Seat table instead
      // of blindly incrementing availableSeats.
      // ------------------------------------------------------

      const availableSeatCount = await tx.seat.count({
        where: {
          scheduleId: booking.scheduleId,
          status: "AVAILABLE",
          bookingId: null,
          passengerId: null,
        },
      });

      // ------------------------------------------------------
      // Synchronize Flight Schedule
      // ------------------------------------------------------

      await tx.flightSchedule.update({
        where: {
          id: booking.scheduleId,
        },
        data: {
          availableSeats: availableSeatCount,
        },
      });
    });

    // --------------------------------------------------------
    // Get Updated Booking
    // --------------------------------------------------------

    const result = await prisma.booking.findUnique({
      where: {
        id: booking.id,
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
            "Booking was cancelled but could not be retrieved.",
        },
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------------------
    // Count Current Available Seats
    // --------------------------------------------------------

    const availableSeats =
      await prisma.seat.count({
        where: {
          scheduleId: booking.scheduleId,
          status: "AVAILABLE",
          bookingId: null,
          passengerId: null,
        },
      });

    console.log("Booking cancelled successfully.");
    console.log("Booking:", booking.bookingCode);
    console.log("Released seats:", releasedSeatCount);
    console.log("Available seats:", availableSeats);
    console.log("Paid payment existed:", hasPaidPayment);
    console.log("========================================");

    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Booking cancelled successfully.",

        data: {
          booking: result,

          cancellation: {
            bookingId: result.id,
            bookingCode: result.bookingCode,
            bookingStatus: result.status,
            paymentStatus: result.paymentStatus,

            releasedSeats: releasedSeatCount,

            payment: {
              hadPaidPayment: hasPaidPayment,
              refundStatus: hasPaidPayment
                ? "REFUNDED"
                : "NOT_REQUIRED",
            },

            seatInventory: {
              scheduleId: booking.scheduleId,
              availableSeats,
            },
          },
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("========================================");
    console.error("CANCEL BOOKING ERROR");
    console.error(error);
    console.error("========================================");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to cancel booking.",
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