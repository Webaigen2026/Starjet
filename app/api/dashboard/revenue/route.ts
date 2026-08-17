import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireOperationsStaff } from "../../../lib/authorization";

export async function GET() {
  try {
    const auth = await requireOperationsStaff();

    if (!auth.authorized) {
      return auth.response;
    }

    //----------------------------------------------------------
    // Revenue Statistics
    //----------------------------------------------------------

    const totalRevenue = await prisma.booking.aggregate({
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

    //----------------------------------------------------------
    // Today's Revenue
    //----------------------------------------------------------

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayRevenue = await prisma.booking.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        createdAt: {
          gte: startOfToday,
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

    //----------------------------------------------------------
    // Average Booking Value
    //----------------------------------------------------------

    const averageBooking = await prisma.booking.aggregate({
      _avg: {
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

    //----------------------------------------------------------
    // Booking Counts
    //----------------------------------------------------------

    const totalBookings = await prisma.booking.count();

    const paidBookings = await prisma.booking.count({
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

    //----------------------------------------------------------
    // Latest Revenue Transactions
    //----------------------------------------------------------

    const latestBookings = await prisma.booking.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
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
      include: {
        schedule: true,
        passengers: true,
      },
    });

    //----------------------------------------------------------
    // Response
    //----------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        data: {
          statistics: {
            totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0),
            todayRevenue: Number(todayRevenue._sum.totalAmount ?? 0),
            averageBookingValue: Number(
              averageBooking._avg.totalAmount ?? 0
            ),
            totalBookings,
            paidBookings,
          },

          latestBookings,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("==================================");
    console.error("REVENUE DASHBOARD ERROR");
    console.error(error);
    console.error("==================================");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load revenue dashboard.",
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