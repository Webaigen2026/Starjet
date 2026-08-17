import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireOperationsStaff } from "../../../lib/authorization";

export async function GET() {
  try {
    const auth = await requireOperationsStaff();

    if (!auth.authorized) {
      return auth.response;
    }

    //---------------------------------------------------------
    // Booking Statistics
    //---------------------------------------------------------

    const [
      totalBookings,
      confirmedBookings,
      checkedInBookings,
      boardedBookings,
      completedBookings,
      cancelledBookings,
    ] = await Promise.all([
      prisma.booking.count(),

      prisma.booking.count({
        where: { status: "CONFIRMED" },
      }),

      prisma.booking.count({
        where: { status: "CHECKED_IN" },
      }),

      prisma.booking.count({
        where: { status: "BOARDED" },
      }),

      prisma.booking.count({
        where: { status: "COMPLETED" },
      }),

      prisma.booking.count({
        where: { status: "CANCELLED" },
      }),
    ]);

    //---------------------------------------------------------
    // Flight Statistics
    //---------------------------------------------------------

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
        where: { status: "SCHEDULED" },
      }),

      prisma.flightSchedule.count({
        where: { status: "BOARDING" },
      }),

      prisma.flightSchedule.count({
        where: { status: "DEPARTED" },
      }),

      prisma.flightSchedule.count({
        where: { status: "ARRIVED" },
      }),

      prisma.flightSchedule.count({
        where: { status: "DELAYED" },
      }),

      prisma.flightSchedule.count({
        where: { status: "CANCELLED" },
      }),
    ]);

    //---------------------------------------------------------
    // Passenger Statistics
    //---------------------------------------------------------

    const totalPassengers = await prisma.passenger.count();

    //---------------------------------------------------------
    // Airline / Airport / Route
    //---------------------------------------------------------

    const [
      totalAirlines,
      totalAirports,
      totalRoutes,
    ] = await Promise.all([
      prisma.airline.count(),
      prisma.airport.count(),
      prisma.flightRoute.count(),
    ]);

    //---------------------------------------------------------
    // Seats
    //---------------------------------------------------------

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

    //---------------------------------------------------------
    // Revenue
    //---------------------------------------------------------

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

    //---------------------------------------------------------
    // Occupancy
    //---------------------------------------------------------

    const occupancy =
      totalSeats === 0
        ? 0
        : Number(
            (
              ((bookedSeats + reservedSeats) /
                totalSeats) *
              100
            ).toFixed(2)
          );

    //---------------------------------------------------------
    // Response
    //---------------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        data: {
          overview: {
            totalBookings,
            totalFlights,
            totalPassengers,
            totalAirlines,
            totalAirports,
            totalRoutes,
            totalRevenue:
              Number(revenue._sum.totalAmount ?? 0),
          },

          bookingStatus: {
            confirmedBookings,
            checkedInBookings,
            boardedBookings,
            completedBookings,
            cancelledBookings,
          },

          flightStatus: {
            scheduledFlights,
            boardingFlights,
            departedFlights,
            arrivedFlights,
            delayedFlights,
            cancelledFlights,
          },

          seatStatus: {
            totalSeats,
            availableSeats,
            reservedSeats,
            bookedSeats,
            occupancyPercentage: occupancy,
          },
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("==================================");
    console.error("ANALYTICS ERROR");
    console.error(error);
    console.error("==================================");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load analytics.",
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