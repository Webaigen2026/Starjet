import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    //----------------------------------------------------
    // Flight Statistics
    //----------------------------------------------------

    const [
      totalFlights,
      scheduledFlights,
      boardingFlights,
      departedFlights,
      arrivedFlights,
      delayedFlights,
      cancelledFlights,
    ] = await Promise.all([
      prisma.flightSchedule.count(),

      prisma.flightSchedule.count({
        where: {
          status: "SCHEDULED",
        },
      }),

      prisma.flightSchedule.count({
        where: {
          status: "BOARDING",
        },
      }),

      prisma.flightSchedule.count({
        where: {
          status: "DEPARTED",
        },
      }),

      prisma.flightSchedule.count({
        where: {
          status: "ARRIVED",
        },
      }),

      prisma.flightSchedule.count({
        where: {
          status: "DELAYED",
        },
      }),

      prisma.flightSchedule.count({
        where: {
          status: "CANCELLED",
        },
      }),
    ]);

    //----------------------------------------------------
    // Today's Flights
    //----------------------------------------------------

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayFlights = await prisma.flightSchedule.count({
      where: {
        departureTime: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    //----------------------------------------------------
    // Recent Flights
    //----------------------------------------------------

    const recentFlights = await prisma.flightSchedule.findMany({
      orderBy: {
        departureTime: "desc",
      },
      take: 10,
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
    });

    //----------------------------------------------------
    // Response
    //----------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        data: {
          statistics: {
            totalFlights,
            todayFlights,
            scheduledFlights,
            boardingFlights,
            departedFlights,
            arrivedFlights,
            delayedFlights,
            cancelledFlights,
          },
          recentFlights,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("=================================");
    console.error("DASHBOARD FLIGHTS ERROR");
    console.error(error);
    console.error("=================================");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load flight dashboard.",
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