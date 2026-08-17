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

    const body = await request.json();
    const { passengerId, seatId } = body;

    console.log("====================================");
    console.log("ASSIGN SEAT");
    console.log("Booking ID:", id);
    console.log("Passenger ID:", passengerId);
    console.log("Seat ID:", seatId);
    console.log("====================================");

    // --------------------------------------------------
    // 1. Validate request
    // --------------------------------------------------

    if (!passengerId || !seatId) {
      return NextResponse.json(
        {
          success: false,
          message: "passengerId and seatId are required.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // 2. Find booking
    // --------------------------------------------------

    const booking = await prisma.booking.findUnique({
      where: {
        id,
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
        {
          status: 404,
        }
      );
    }

    const access = authorizeBookingAccess(auth.user, booking);

    if (!access.authorized) {
      return access.response;
    }

    if (!booking.scheduleId || !booking.schedule) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking is not connected to a flight schedule.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // 3. Do not allow seat assignment after flight
    //    operations have progressed too far
    // --------------------------------------------------

    if (
      booking.schedule.status === "DEPARTED" ||
      booking.schedule.status === "ARRIVED" ||
      booking.schedule.status === "CANCELLED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot assign a seat because flight status is ${booking.schedule.status}.`,
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // 4. Validate booking status
    // --------------------------------------------------

    if (
      booking.status === "CANCELLED" ||
      booking.status === "COMPLETED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot assign a seat to a ${booking.status} booking.`,
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // 5. Find passenger
    // --------------------------------------------------

    const passenger = await prisma.passenger.findUnique({
      where: {
        id: passengerId,
      },
    });

    if (!passenger) {
      return NextResponse.json(
        {
          success: false,
          message: "Passenger not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (passenger.bookingId !== booking.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Passenger does not belong to this booking.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // 6. Check whether passenger already has a seat
    // --------------------------------------------------

    const existingPassengerSeat = await prisma.seat.findFirst({
      where: {
        passengerId: passenger.id,
      },
    });

    if (existingPassengerSeat) {
      return NextResponse.json(
        {
          success: false,
          message: "Passenger already has a seat.",
          data: {
            seatId: existingPassengerSeat.id,
            seatNumber: existingPassengerSeat.seatNumber,
            seatClass: existingPassengerSeat.seatClass,
            status: existingPassengerSeat.status,
          },
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // 7. Find requested seat
    // --------------------------------------------------

    const seat = await prisma.seat.findUnique({
      where: {
        id: seatId,
      },
    });

    if (!seat) {
      return NextResponse.json(
        {
          success: false,
          message: "Seat not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (seat.scheduleId !== booking.scheduleId) {
      return NextResponse.json(
        {
          success: false,
          message: "Seat belongs to another flight schedule.",
        },
        {
          status: 400,
        }
      );
    }

    if (seat.status !== "AVAILABLE") {
      return NextResponse.json(
        {
          success: false,
          message: "Seat is not available.",
          data: {
            seatNumber: seat.seatNumber,
            status: seat.status,
          },
        },
        {
          status: 409,
        }
      );
    }

    // --------------------------------------------------
    // 8. Assign seat in a transaction
    //
    // updateMany is intentional here.
    // The WHERE condition requires the seat to STILL
    // be AVAILABLE when the database performs the update.
    // --------------------------------------------------

    const result = await prisma.$transaction(async (tx) => {
      const seatUpdate = await tx.seat.updateMany({
        where: {
          id: seat.id,
          scheduleId: booking.scheduleId!,
          status: "AVAILABLE",
          bookingId: null,
          passengerId: null,
        },
        data: {
          bookingId: booking.id,
          passengerId: passenger.id,
          status: "BOOKED",
        },
      });

      // Another request may have taken the seat
      // between our earlier read and this update.
      if (seatUpdate.count !== 1) {
        throw new Error("SEAT_NO_LONGER_AVAILABLE");
      }

      const updatedSeat = await tx.seat.findUnique({
        where: {
          id: seat.id,
        },
        include: {
          passenger: true,
          booking: true,
        },
      });

      return {
        updatedSeat,
      };
    });

    // --------------------------------------------------
    // 9. Success
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      message: "Seat assigned successfully.",
      data: {
        ...result.updatedSeat,
      },
    });
  } catch (error) {
    console.error("====================================");
    console.error("ASSIGN SEAT ERROR");
    console.error(error);
    console.error("====================================");

    if (
      error instanceof Error &&
      error.message === "SEAT_NO_LONGER_AVAILABLE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Seat is no longer available. Please select another seat.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to assign seat.",
        error:
          process.env.NODE_ENV === "development"
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