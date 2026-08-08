import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    //---------------------------------------------------------
    // Passenger Statistics
    //---------------------------------------------------------

    const [
      totalPassengers,
      malePassengers,
      femalePassengers,
      otherPassengers,
      passengersWithSeat,
      passengersWithoutSeat,
    ] = await Promise.all([
      prisma.passenger.count(),

      prisma.passenger.count({
        where: {
          gender: "MALE",
        },
      }),

      prisma.passenger.count({
        where: {
          gender: "FEMALE",
        },
      }),

      prisma.passenger.count({
        where: {
          gender: "OTHER",
        },
      }),

      prisma.passenger.count({
        where: {
          seat: {
            isNot: null,
          },
        },
      }),

      prisma.passenger.count({
        where: {
          seat: {
            is: null,
          },
        },
      }),
    ]);

    //---------------------------------------------------------
    // Nationality Summary
    //---------------------------------------------------------

    const nationalitySummary = await prisma.passenger.groupBy({
      by: ["nationality"],
      _count: {
        nationality: true,
      },
      orderBy: {
        _count: {
          nationality: "desc",
        },
      },
    });

    //---------------------------------------------------------
    // Recent Passengers
    //---------------------------------------------------------

    const recentPassengers = await prisma.passenger.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        booking: true,
        seat: true,
      },
    });

    //---------------------------------------------------------
    // Response
    //---------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        data: {
          statistics: {
            totalPassengers,
            malePassengers,
            femalePassengers,
            otherPassengers,
            passengersWithSeat,
            passengersWithoutSeat,
          },

          nationalitySummary,

          recentPassengers,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("==================================");
    console.error("PASSENGER DASHBOARD ERROR");
    console.error(error);
    console.error("==================================");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load passenger dashboard.",
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