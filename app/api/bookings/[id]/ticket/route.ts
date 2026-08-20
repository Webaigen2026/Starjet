import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import {
  authorizeBookingAccess,
  requireAuthenticatedUser
} from "../../../../lib/authorization";
import { isTicketEligible } from "../../../../lib/ticketAccess";

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
      where: { id },
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

    if (!isTicketEligible(booking)) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking not found.",
        },
        { status: 404 }
      );
    }

    const passengers = booking.passengers.map((p) => ({
      name: `${p.firstName} ${p.lastName}`,
      nationality: p.nationality,
      passport: p.passportNumber,
      seat: p.seat?.seatNumber ?? "Not Assigned",
    }));

    const ticket = {
      ticketNumber: `ET-${booking.bookingCode}`,
      bookingCode: booking.bookingCode,

      airline: booking.schedule.route.airline.name,
      airlineCode: booking.schedule.route.airline.iataCode,

      flightNumber: booking.schedule.route.flightNumber,

      from: {
        airport: booking.schedule.route.originAirport.name,
        city: booking.schedule.route.originAirport.city,
        code: booking.schedule.route.originAirport.iataCode,
      },

      to: {
        airport: booking.schedule.route.destinationAirport.name,
        city: booking.schedule.route.destinationAirport.city,
        code: booking.schedule.route.destinationAirport.iataCode,
      },

      departureTime: booking.schedule.departureTime,
      arrivalTime: booking.schedule.arrivalTime,

      aircraft: `${booking.schedule.aircraft.manufacturer} ${booking.schedule.aircraft.model}`,

      bookingStatus: booking.status,
      paymentStatus: booking.paymentStatus,

      totalAmount: booking.totalAmount,
      currency: booking.currency,

      passengers,

      issuedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      message: "E-ticket generated successfully.",
      data: ticket,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to generate e-ticket.",
      },
      {
        status: 500,
      }
    );
  }
}