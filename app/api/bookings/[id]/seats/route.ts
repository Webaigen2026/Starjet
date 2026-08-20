import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {
  authorizeBookingAccess,
  requireAuthenticatedUser
} from "../../../../lib/authorization";

// ========================================================
// GET BOOKING SEATS
// ========================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthenticatedUser();

    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking ID is missing.",
        },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        userId: true,
        bookingCode: true,
        scheduleId: true,
        status: true,
        passengers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking not found.",
        },
        { status: 404 }
      );
    }

    const access = authorizeBookingAccess(auth.user, booking);

    if (!access.authorized) {
      return access.response;
    }


    const seats = await prisma.seat.findMany({
      where: {
        scheduleId: booking.scheduleId,
      },
      orderBy: [
        {
          seatClass: "asc",
        },
        {
          seatNumber: "asc",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      booking,
      seats,
    });
  } catch (error) {
    console.error("GET BOOKING SEATS ERROR:");
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch booking seats.",
        error:
          process.env.NODE_ENV === "development"
            ? String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

// ========================================================
// ASSIGN / CHANGE PASSENGER SEAT
// ========================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthenticatedUser();

    if (!auth.authorized) {
      return auth.response;
    }

    const { id: bookingId } = await params;

    const body = await request.json();

    const { passengerId, seatId } = body;

    // ----------------------------------------------------
    // Validate request
    // ----------------------------------------------------

    if (!bookingId) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking ID is missing.",
        },
        { status: 400 }
      );
    }

    if (!passengerId || !seatId) {
      return NextResponse.json(
        {
          success: false,
          message: "passengerId and seatId are required.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------------------
    // Find booking
    // ----------------------------------------------------

    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      include: {
        schedule: true,
        passengers: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking not found.",
        },
        { status: 404 }
      );
    }

    const access = authorizeBookingAccess(auth.user, booking);

    if (!access.authorized) {
      return access.response;
    }


    // ----------------------------------------------------
    // Prevent seat changes for closed bookings
    // ----------------------------------------------------

    if (
      booking.status === "CANCELLED" ||
      booking.status === "COMPLETED" ||
      booking.status === "BOARDED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Seat assignment is not allowed for ${booking.status} bookings.`,
        },
        { status: 409 }
      );
    }

    // ----------------------------------------------------
    // Validate passenger belongs to booking
    // ----------------------------------------------------

    const passenger = booking.passengers.find(
      (passenger) => passenger.id === passengerId
    );

    if (!passenger) {
      return NextResponse.json(
        {
          success: false,
          message: "Passenger does not belong to this booking.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------------------
    // Find requested seat
    // ----------------------------------------------------

    const requestedSeat = await prisma.seat.findUnique({
      where: {
        id: seatId,
      },
    });

    if (!requestedSeat) {
      return NextResponse.json(
        {
          success: false,
          message: "Seat not found.",
        },
        { status: 404 }
      );
    }

    // ----------------------------------------------------
    // Seat must belong to same flight
    // ----------------------------------------------------

    if (requestedSeat.scheduleId !== booking.scheduleId) {
      return NextResponse.json(
        {
          success: false,
          message: "Seat does not belong to this flight.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------------------
    // Check whether passenger already owns this seat
    // ----------------------------------------------------

    if (
      requestedSeat.passengerId === passengerId &&
      requestedSeat.bookingId === bookingId
    ) {
      return NextResponse.json({
        success: true,
        message: "Passenger is already assigned to this seat.",
        data: {
          bookingId,
          passengerId,
          seat: requestedSeat,
        },
      });
    }

    // ----------------------------------------------------
    // Prevent double booking
    // ----------------------------------------------------

    if (
      requestedSeat.status !== "AVAILABLE" ||
      requestedSeat.bookingId !== null ||
      requestedSeat.passengerId !== null
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Seat is no longer available.",
          data: {
            seatNumber: requestedSeat.seatNumber,
            status: requestedSeat.status,
          },
        },
        { status: 409 }
      );
    }

    // ----------------------------------------------------
    // Assign seat transactionally
    // ----------------------------------------------------

    const result = await prisma.$transaction(async (tx) => {
      // Find passenger's existing seat
      const existingSeat = await tx.seat.findFirst({
        where: {
          scheduleId: booking.scheduleId,
          passengerId,
        },
      });

      // Release previous seat when passenger changes seats
      if (existingSeat && existingSeat.id !== seatId) {
        await tx.seat.update({
          where: {
            id: existingSeat.id,
          },
          data: {
            bookingId: null,
            passengerId: null,
            status: "AVAILABLE",
          },
        });
      }

      // Assign requested seat.
      //
      // updateMany is intentionally used with availability
      // conditions so two simultaneous requests cannot
      // blindly overwrite the same seat.
      const assignment = await tx.seat.updateMany({
        where: {
          id: seatId,
          scheduleId: booking.scheduleId,
          status: "AVAILABLE",
          bookingId: null,
          passengerId: null,
        },
        data: {
          bookingId,
          passengerId,
          status: "BOOKED",
        },
      });

      if (assignment.count !== 1) {
        throw new Error("SEAT_ALREADY_TAKEN");
      }

      const assignedSeat = await tx.seat.findUnique({
        where: {
          id: seatId,
        },
      });

      return {
        assignedSeat,
        previousSeat: existingSeat,
      };
    });

    return NextResponse.json({
      success: true,
      message:
        result.previousSeat &&
        result.previousSeat.id !== seatId
          ? "Passenger seat changed successfully."
          : "Seat assigned successfully.",

      data: {
        booking: {
          id: booking.id,
          bookingCode: booking.bookingCode,
        },

        passenger: {
          id: passenger.id,
          firstName: passenger.firstName,
          lastName: passenger.lastName,
        },

        seat: result.assignedSeat,

        previousSeat:
          result.previousSeat &&
          result.previousSeat.id !== seatId
            ? {
                id: result.previousSeat.id,
                seatNumber: result.previousSeat.seatNumber,
              }
            : null,
      },
    });
  } catch (error) {
    console.error("ASSIGN SEAT ERROR:");
    console.error(error);

    if (
      error instanceof Error &&
      error.message === "SEAT_ALREADY_TAKEN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Seat is no longer available. Please select another seat.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to assign seat.",
        error:
          process.env.NODE_ENV === "development"
            ? String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}