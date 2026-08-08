import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log("========================================");
    console.log("COMPLETE FLIGHT");
    console.log("Booking ID:", id);
    console.log("========================================");

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

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking not found.",
        },
        { status: 404 }
      );
    }

    //--------------------------------------------------
    // Status Validation
    //--------------------------------------------------

    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          message: "Cancelled bookings cannot be completed.",
        },
        { status: 400 }
      );
    }

    if (booking.status === "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          message: "Flight has already been completed.",
        },
        { status: 400 }
      );
    }

    if (booking.status !== "BOARDED") {
      return NextResponse.json(
        {
          success: false,
          message: "Passenger must board before completing the flight.",
        },
        { status: 400 }
      );
    }

    //--------------------------------------------------
    // Passenger Seat Validation
    //--------------------------------------------------

    const passengersWithoutSeats = booking.passengers.filter(
      (passenger) => !passenger.seat
    );

    if (passengersWithoutSeats.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Every passenger must have an assigned seat.",
        },
        { status: 400 }
      );
    }

    //--------------------------------------------------
    // Seat Status Validation
    //--------------------------------------------------

    const invalidSeat = booking.seats.find(
      (seat) => seat.status !== "BOOKED"
    );

    if (invalidSeat) {
      return NextResponse.json(
        {
          success: false,
          message: "One or more seats are not in BOOKED status.",
        },
        { status: 400 }
      );
    }

    //--------------------------------------------------
    // Update Booking
    //--------------------------------------------------

    const updatedBooking = await prisma.booking.update({
      where: {
        id,
      },
      data: {
        status: "COMPLETED",
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

    console.log("========================================");
    console.log("FLIGHT COMPLETED");
    console.log("Booking:", updatedBooking.bookingCode);
    console.log("========================================");

    return NextResponse.json(
      {
        success: true,
        message: "Flight completed successfully.",
        data: updatedBooking,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("========================================");
    console.error("COMPLETE FLIGHT ERROR");
    console.error(error);
    console.error("========================================");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to complete flight.",
        error:
          process.env.NODE_ENV === "development"
            ? String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}