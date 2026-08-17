import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireOperationsStaff } from "../../../lib/authorization";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireOperationsStaff();

    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    //-------------------------------------------------------
    // Filter
    //-------------------------------------------------------

    const where: any = {
      status: {
        in: [
          "PAID",
          "CONFIRMED",
          "CHECKED_IN",
          "TICKETED",
          "BOARDED",
          "COMPLETED",
        ],
      },
    };

    if (startDate || endDate) {
      where.createdAt = {};

      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }

      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    //-------------------------------------------------------
    // Bookings
    //-------------------------------------------------------

    const bookings = await prisma.booking.findMany({
      where,

      orderBy: {
        createdAt: "desc",
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
          },
        },

        passengers: true,
      },
    });

    //-------------------------------------------------------
    // Revenue Calculations
    //-------------------------------------------------------

    let totalRevenue = 0;
    let totalBaseFare = 0;
    let totalTaxes = 0;
    let totalServiceFees = 0;

    for (const booking of bookings) {
      totalRevenue += Number(booking.totalAmount ?? 0);
      totalBaseFare += Number(booking.baseFare ?? 0);
      totalTaxes += Number(booking.taxes ?? 0);
      totalServiceFees += Number(booking.serviceFee ?? 0);
    }

    //-------------------------------------------------------
    // Average Booking
    //-------------------------------------------------------

    const averageBookingValue =
      bookings.length === 0
        ? 0
        : Number((totalRevenue / bookings.length).toFixed(2));

    //-------------------------------------------------------
    // Report
    //-------------------------------------------------------

    const report = bookings.map((booking) => ({
      bookingCode: booking.bookingCode,

      customer: booking.customerName,

      email: booking.customerEmail,

      airline: booking.schedule.route.airline.name,

      flightNumber: booking.schedule.route.flightNumber,

      origin: booking.schedule.route.originAirport.iataCode,

      destination:
        booking.schedule.route.destinationAirport.iataCode,

      passengers: booking.passengers.length,

      bookingStatus: booking.status,

      paymentStatus: booking.paymentStatus,

      baseFare: booking.baseFare,

      taxes: booking.taxes,

      serviceFee: booking.serviceFee,

      totalAmount: booking.totalAmount,

      currency: booking.currency,

      createdAt: booking.createdAt,
    }));

    //-------------------------------------------------------
    // Response
    //-------------------------------------------------------

    return NextResponse.json({
      success: true,

      data: {
        summary: {
          totalBookings: bookings.length,

          totalRevenue,

          totalBaseFare,

          totalTaxes,

          totalServiceFees,

          averageBookingValue,

          generatedAt: new Date(),
        },

        revenue: report,
      },
    });
  } catch (error) {
    console.error("=================================");
    console.error("REVENUE REPORT ERROR");
    console.error(error);
    console.error("=================================");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to generate revenue report.",
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