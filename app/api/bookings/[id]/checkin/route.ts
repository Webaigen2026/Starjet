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
    console.log("CHECK-IN");
    console.log("Booking ID:", id);
    console.log("========================================");

    const booking = await prisma.booking.findUnique({
      where: {
        id,
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

    console.log("BOOKING:");
    console.log(booking);

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

    //-----------------------------------------------------
    // Booking Status Validation
    //-----------------------------------------------------

    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          message: "Cancelled bookings cannot check in.",
        },
        {
          status: 400,
        }
      );
    }

    if (booking.status === "CHECKED_IN") {
      return NextResponse.json(
        {
          success: false,
          message: "Passenger already checked in.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      booking.status !== "CONFIRMED" &&
      booking.status !== "COMPLETED" &&
      booking.status !== "TICKETED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Booking must be CONFIRMED, COMPLETED or TICKETED before check-in.",
        },
        {
          status: 400,
        }
      );
    }

    //-----------------------------------------------------
    // Every Passenger Must Have Seat
    //-----------------------------------------------------

    const passengersWithoutSeats = booking.passengers.filter(
      (passenger) => !passenger.seat
    );

    if (passengersWithoutSeats.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Every passenger must have an assigned seat before check-in.",
        },
        {
          status: 400,
        }
      );
    }

    //-----------------------------------------------------
    // DEVELOPMENT:
    // Skip 24-hour time validation
    //-----------------------------------------------------

    // In production you can restore:
    //
    // const now = new Date();
    // const departure = new Date(booking.schedule.departureTime);
    //
    // const checkInOpens = new Date(departure);
    // checkInOpens.setHours(checkInOpens.getHours() - 24);
    //
    // if (now < checkInOpens) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       message: "Check-in opens 24 hours before the scheduled departure.",
    //     },
    //     { status: 400 }
    //   );
    // }
    //
    // if (now >= departure) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       message: "Check-in has closed because the flight has already departed.",
    //     },
    //     { status: 400 }
    //   );
    // }

    //-----------------------------------------------------
    // Update Booking
    //-----------------------------------------------------

    const updatedBooking = await prisma.booking.update({
      where: {
        id,
      },
      data: {
        status: "CHECKED_IN",
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

    console.log("========================================");
    console.log("CHECK-IN SUCCESS");
    console.log("Booking:", updatedBooking.bookingCode);
    console.log("========================================");

    return NextResponse.json(
      {
        success: true,
        message: "Passenger checked in successfully.",
        data: updatedBooking,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("========================================");
    console.error("CHECK-IN ERROR");
    console.error(error);
    console.error("========================================");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to complete check-in.",
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