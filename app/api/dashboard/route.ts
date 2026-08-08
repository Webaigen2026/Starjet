import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    // ---------------------------------------------------------
    // Booking Statistics
    // ---------------------------------------------------------

    const [
      totalBookings,
      confirmedBookings,
      checkedInBookings,
      boardedBookings,
      completedBookings,
      cancelledBookings,
      todayBookings,
    ] = await Promise.all([
      prisma.booking.count(),

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
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    // ---------------------------------------------------------
    // Passenger Statistics
    // ---------------------------------------------------------

    const totalPassengers = await prisma.passenger.count();

    // ---------------------------------------------------------
    // Flight Schedule Statistics
    // ---------------------------------------------------------

    const [
      totalSchedules,
      scheduledFlights,
      boardingFlights,
      delayedFlights,
      departedFlights,
      arrivedFlights,
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
          status: "DELAYED",
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
          status: "CANCELLED",
        },
      }),
    ]);

    // ---------------------------------------------------------
    // Seat Statistics
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // Revenue
    // ---------------------------------------------------------

    const revenue = await prisma.booking.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        status: {
          in: [
            "CONFIRMED",
            "CHECKED_IN",
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
            "CONFIRMED",
            "CHECKED_IN",
            "BOARDED",
            "COMPLETED",
          ],
        },
      },
    });

    // ---------------------------------------------------------
    // Occupancy Percentage
    // ---------------------------------------------------------

    const occupancyPercentage =
      totalSeats === 0
        ? 0
        : Number(
            (
              ((bookedSeats + reservedSeats) / totalSeats) *
              100
            ).toFixed(2)
          );

    // ---------------------------------------------------------
    // Response
    // ---------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        data: {
          overview: {
            totalBookings,
            todayBookings,
            confirmedBookings,
            checkedInBookings,
            boardedBookings,
            completedBookings,
            cancelledBookings,
          },

          passengers: {
            totalPassengers,
          },

          flights: {
            totalSchedules,
            scheduledFlights,
            boardingFlights,
            delayedFlights,
            departedFlights,
            arrivedFlights,
            cancelledFlights,
          },

          seats: {
            totalSeats,
            availableSeats,
            reservedSeats,
            bookedSeats,
            occupancyPercentage,
          },

          revenue: {
            totalRevenue: revenue._sum.totalAmount ?? 0,
            todayRevenue: todayRevenue._sum.totalAmount ?? 0,
          },
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("====================================");
    console.error("DASHBOARD ERROR");
    console.error(error);
    console.error("====================================");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load dashboard.",
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