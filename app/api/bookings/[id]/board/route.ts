import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log("========================================");
    console.log("BOARD PASSENGER");
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
          message: "Cancelled bookings cannot board.",
        },
        { status: 400 }
      );
    }

    if (booking.status === "BOARDED") {
      return NextResponse.json(
        {
          success: false,
          message: "Passenger has already boarded.",
        },
        { status: 400 }
      );
    }

    if (booking.status !== "CHECKED_IN") {
      return NextResponse.json(
        {
          success: false,
          message: "Passenger must check in before boarding.",
        },
        { status: 400 }
      );
    }

    //--------------------------------------------------
    // Every Passenger Must Have Seat
    //--------------------------------------------------

    const passengersWithoutSeats = booking.passengers.filter(
      (passenger) => !passenger.seat
    );

    if (passengersWithoutSeats.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Every passenger must have an assigned seat before boarding.",
        },
        { status: 400 }
      );
    }

    //--------------------------------------------------
    // All Seats Must Be BOOKED
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
    // DEVELOPMENT
    // Skip boarding time validation
    //--------------------------------------------------

    /*
    const now = new Date();

    const departure = new Date(booking.schedule.departureTime);

    const boardingStarts = new Date(departure);
    boardingStarts.setMinutes(boardingStarts.getMinutes() - 45);

    if (now < boardingStarts) {
      return NextResponse.json(
        {
          success: false,
          message: "Boarding has not started yet.",
        },
        { status: 400 }
      );
    }

    if (now >= departure) {
      return NextResponse.json(
        {
          success: false,
          message: "Flight has already departed.",
        },
        { status: 400 }
      );
    }
    */

    //--------------------------------------------------
    // Update Booking
    //--------------------------------------------------

    const updatedBooking = await prisma.booking.update({
      where: {
        id,
      },
      data: {
        status: "BOARDED",
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
    console.log("BOARDING SUCCESS");
    console.log("Booking:", updatedBooking.bookingCode);
    console.log("========================================");

    return NextResponse.json(
      {
        success: true,
        message: "Passenger boarded successfully.",
        data: updatedBooking,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("========================================");
    console.error("BOARDING ERROR");
    console.error(error);
    console.error("========================================");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to board passenger.",
        error:
          process.env.NODE_ENV === "development"
            ? String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}