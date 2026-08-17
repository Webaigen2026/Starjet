import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireOperationsStaff } from "../../../lib/authorization";

export async function GET() {
  try {
    const auth = await requireOperationsStaff();

    if (!auth.authorized) {
      return auth.response;
    }

    //--------------------------------------------------------
    // Booking Statistics
    //--------------------------------------------------------

    const [
      totalBookings,
      draftBookings,
      pendingPaymentBookings,
      paidBookings,
      confirmedBookings,
      checkedInBookings,
      ticketedBookings,
      boardedBookings,
      completedBookings,
      cancelledBookings,
      refundedBookings,
      failedBookings,
      todayBookings,
    ] = await Promise.all([
      prisma.booking.count(),

      prisma.booking.count({
        where: {
          status: "DRAFT",
        },
      }),

      prisma.booking.count({
        where: {
          status: "PENDING_PAYMENT",
        },
      }),

      prisma.booking.count({
        where: {
          status: "PAID",
        },
      }),

      prisma.booking.count({
        where: {
          status: "CONFIRMED",
        },
      }),

      prisma.booking.count({
        where: {
          status: "CHECKED_IN",
        },
      }),

      prisma.booking.count({
        where: {
          status: "TICKETED",
        },
      }),

      prisma.booking.count({
        where: {
          status: "BOARDED",
        },
      }),

      prisma.booking.count({
        where: {
          status: "COMPLETED",
        },
      }),

      prisma.booking.count({
        where: {
          status: "CANCELLED",
        },
      }),

      prisma.booking.count({
        where: {
          status: "REFUNDED",
        },
      }),

      prisma.booking.count({
        where: {
          status: "FAILED",
        },
      }),

      prisma.booking.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    //--------------------------------------------------------
    // Revenue
    //--------------------------------------------------------

    const revenue = await prisma.booking.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
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
      },
    });

    const todayRevenue = await prisma.booking.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
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
      },
    });

    //--------------------------------------------------------
    // Recent Bookings
    //--------------------------------------------------------

    const recentBookings = await prisma.booking.findMany({
      take: 10,
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

    //--------------------------------------------------------
    // Average Booking Value
    //--------------------------------------------------------

    const averageBookingValue =
      totalBookings === 0
        ? 0
        : Number(
            (
              Number(revenue._sum.totalAmount ?? 0) / totalBookings
            ).toFixed(2)
          );

    //--------------------------------------------------------
    // Response
    //--------------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        data: {
          statistics: {
            totalBookings,
            todayBookings,
            draftBookings,
            pendingPaymentBookings,
            paidBookings,
            confirmedBookings,
            checkedInBookings,
            ticketedBookings,
            boardedBookings,
            completedBookings,
            cancelledBookings,
            refundedBookings,
            failedBookings,
          },

          revenue: {
            totalRevenue: Number(revenue._sum.totalAmount ?? 0),
            todayRevenue: Number(todayRevenue._sum.totalAmount ?? 0),
            averageBookingValue,
          },

          recentBookings,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("=================================");
    console.error("BOOKINGS DASHBOARD ERROR");
    console.error(error);
    console.error("=================================");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load booking dashboard.",
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