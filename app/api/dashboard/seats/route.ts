import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireOperationsStaff } from "../../../lib/authorization";

export async function GET() {
  try {
    const auth = await requireOperationsStaff();

    if (!auth.authorized) {
      return auth.response;
    }

    //--------------------------------------------------
    // Seat Statistics
    //--------------------------------------------------

    const [
      totalSeats,
      availableSeats,
      reservedSeats,
      bookedSeats,
    ] = await Promise.all([
      prisma.seat.count(),

      prisma.seat.count({
        where: {
          status: "AVAILABLE",
        },
      }),

      prisma.seat.count({
        where: {
          status: "RESERVED",
        },
      }),

      prisma.seat.count({
        where: {
          status: "BOOKED",
        },
      }),
    ]);

    //--------------------------------------------------
    // Seat Occupancy
    //--------------------------------------------------

    const occupancyPercentage =
      totalSeats === 0
        ? 0
        : Number(
            (
              ((bookedSeats + reservedSeats) / totalSeats) *
              100
            ).toFixed(2)
          );

    //--------------------------------------------------
    // Seat Class Statistics
    //--------------------------------------------------

    const seatClassSummary = await prisma.seat.groupBy({
      by: ["seatClass"],
      _count: {
        seatClass: true,
      },
      orderBy: {
        seatClass: "asc",
      },
    });

    //--------------------------------------------------
    // Recent Seats
    //--------------------------------------------------

    const recentSeats = await prisma.seat.findMany({
      take: 20,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        passenger: true,
        booking: true,
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
      },
    });

    //--------------------------------------------------
    // Response
    //--------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        data: {
          statistics: {
            totalSeats,
            availableSeats,
            reservedSeats,
            bookedSeats,
            occupancyPercentage,
          },

          seatClassSummary,

          recentSeats,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("=================================");
    console.error("SEAT DASHBOARD ERROR");
    console.error(error);
    console.error("=================================");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load seat dashboard.",
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