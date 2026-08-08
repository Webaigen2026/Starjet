import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const airline = searchParams.get("airline");
    const bookingCode = searchParams.get("bookingCode");

    //----------------------------------------------------------
    // Filters
    //----------------------------------------------------------

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (bookingCode) {
      where.bookingCode = {
        contains: bookingCode,
        mode: "insensitive",
      };
    }

    if (airline) {
      where.schedule = {
        route: {
          airline: {
            name: {
              contains: airline,
              mode: "insensitive",
            },
          },
        },
      };
    }

    //----------------------------------------------------------
    // Bookings
    //----------------------------------------------------------

    const bookings = await prisma.booking.findMany({
      where,

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
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    //----------------------------------------------------------
    // Summary
    //----------------------------------------------------------

    const totalRevenue = bookings.reduce(
      (sum, booking) => sum + Number(booking.totalAmount ?? 0),
      0
    );

    const report = bookings.map((booking) => ({
      bookingId: booking.id,

      bookingCode: booking.bookingCode,

      status: booking.status,

      paymentStatus: booking.paymentStatus,

      customer: {
        name: booking.customerName,
        email: booking.customerEmail,
        phone: booking.customerPhone,
      },

      airline: booking.schedule.route.airline.name,

      flightNumber: booking.schedule.route.flightNumber,

      origin: booking.schedule.route.originAirport.iataCode,

      destination:
        booking.schedule.route.destinationAirport.iataCode,

      departure: booking.schedule.departureTime,

      arrival: booking.schedule.arrivalTime,

      passengers: booking.passengers.length,

      amount: booking.totalAmount,

      currency: booking.currency,

      seats: booking.passengers.map((p) => ({
        passenger: `${p.firstName} ${p.lastName}`,
        seat: p.seat?.seatNumber ?? null,
      })),
    }));

    //----------------------------------------------------------
    // Response
    //----------------------------------------------------------

    return NextResponse.json({
      success: true,

      data: {
        summary: {
          totalBookings: bookings.length,

          totalRevenue,

          generatedAt: new Date(),
        },

        bookings: report,
      },
    });
  } catch (error) {
    console.error("BOOKING REPORT ERROR");
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to generate booking report.",
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