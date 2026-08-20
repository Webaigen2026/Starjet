import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import {
  authorizeBookingAccess,
  requireAuthenticatedUser
} from "../../../../lib/authorization";

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

    const access = authorizeBookingAccess(auth.user, booking);

    if (!access.authorized) {
      return access.response;
    }


    if (
      booking.status !== "CHECKED_IN" &&
      booking.status !== "BOARDED" &&
      booking.status !== "COMPLETED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Boarding pass is available only after check-in.",
        },
        { status: 400 }
      );
    }

    const firstPassenger = booking.passengers[0];

    const assignedSeat =
      firstPassenger?.seat ||
      booking.seats.find(
        (seat) => seat.passengerId === firstPassenger?.id
      ) ||
      booking.seats.find(
        (seat) => seat.bookingId === booking.id
      );

    const boardingPass = {
      bookingId: booking.id,

      bookingCode: booking.bookingCode,

      passenger: firstPassenger
        ? `${firstPassenger.firstName} ${firstPassenger.lastName}`
        : booking.customerName,

      airline: booking.schedule.route.airline.name,

      airlineCode:
        booking.schedule.route.airline.iataCode,

      flightNumber:
        booking.schedule.route.flightNumber,

      from: {
        code: booking.schedule.route.originAirport.iataCode,
        airport:
          booking.schedule.route.originAirport.name,
        city:
          booking.schedule.route.originAirport.city,
      },

      to: {
        code:
          booking.schedule.route.destinationAirport.iataCode,
        airport:
          booking.schedule.route.destinationAirport.name,
        city:
          booking.schedule.route.destinationAirport.city,
      },

      departureTime:
        booking.schedule.departureTime,

      arrivalTime:
        booking.schedule.arrivalTime,

      boardingTime: new Date(
        booking.schedule.departureTime.getTime() -
          45 * 60 * 1000
      ),

      seat:
        assignedSeat?.seatNumber ??
        "Not Assigned",

      aircraft: `${booking.schedule.aircraft.manufacturer} ${booking.schedule.aircraft.model}`,

      gate: "G7",

      terminal: "Terminal 1",

      passengers: booking.passengers.length,

      status: booking.status,

      issuedAt: new Date(),
    };

    return NextResponse.json(
      {
        success: true,
        message:
          "Boarding pass generated successfully.",
        data: boardingPass,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("BOARDING PASS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to generate boarding pass.",
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