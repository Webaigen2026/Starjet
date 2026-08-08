import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await params;

    console.log("====================================");
    console.log("START BOARDING");
    console.log("Schedule ID:", scheduleId);
    console.log("====================================");

    //---------------------------------------------------------
    // Find Flight Schedule
    //---------------------------------------------------------

    const schedule = await prisma.flightSchedule.findUnique({
      where: {
        id: scheduleId,
      },

      include: {
        aircraft: true,

        route: {
          include: {
            airline: true,
            originAirport: true,
            destinationAirport: true,
          },
        },

        bookings: {
          include: {
            passengers: {
              include: {
                seat: true,
              },
            },
          },
        },
      },
    });

    //---------------------------------------------------------
    // Schedule Not Found
    //---------------------------------------------------------

    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          message: "Flight schedule not found.",
        },
        {
          status: 404,
        }
      );
    }

    //---------------------------------------------------------
    // Status Validation
    //---------------------------------------------------------

    if (schedule.status === "BOARDING") {
      return NextResponse.json(
        {
          success: false,
          message: "Boarding has already started.",
        },
        {
          status: 400,
        }
      );
    }

    if (schedule.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Boarding cannot start for a cancelled flight.",
        },
        {
          status: 400,
        }
      );
    }

    if (schedule.status === "DEPARTED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Boarding cannot start because the flight has already departed.",
        },
        {
          status: 400,
        }
      );
    }

    if (schedule.status === "ARRIVED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Boarding cannot start for an arrived flight.",
        },
        {
          status: 400,
        }
      );
    }

    //---------------------------------------------------------
    // Only SCHEDULED or DELAYED flights can start boarding
    //---------------------------------------------------------

    if (
      schedule.status !== "SCHEDULED" &&
      schedule.status !== "DELAYED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only SCHEDULED or DELAYED flights can start boarding.",
        },
        {
          status: 400,
        }
      );
    }

    //---------------------------------------------------------
    // Gate Validation
    //---------------------------------------------------------

    if (!schedule.departureGate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A departure gate must be assigned before boarding can start.",
        },
        {
          status: 400,
        }
      );
    }

    //---------------------------------------------------------
    // Count Passengers
    //---------------------------------------------------------

    const activeBookings = schedule.bookings.filter(
      (booking) =>
        booking.status !== "CANCELLED" &&
        booking.status !== "REFUNDED" &&
        booking.status !== "FAILED"
    );

    const totalPassengers = activeBookings.reduce(
      (total, booking) =>
        total + booking.passengers.length,
      0
    );

    const checkedInBookings = activeBookings.filter(
      (booking) => booking.status === "CHECKED_IN"
    );

    const checkedInPassengers = checkedInBookings.reduce(
      (total, booking) =>
        total + booking.passengers.length,
      0
    );

    //---------------------------------------------------------
    // Require At Least One Checked-In Booking
    //---------------------------------------------------------

    if (checkedInBookings.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Boarding cannot start because no passengers are checked in.",
        },
        {
          status: 400,
        }
      );
    }

    //---------------------------------------------------------
    // Update Flight Status
    //---------------------------------------------------------

    const updatedSchedule =
      await prisma.flightSchedule.update({
        where: {
          id: scheduleId,
        },

        data: {
          status: "BOARDING",
        },

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

    //---------------------------------------------------------
    // Response
    //---------------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        message: "Boarding started successfully.",

        data: {
          scheduleId: updatedSchedule.id,

          flight: {
            airline:
              updatedSchedule.route.airline.name,

            airlineCode:
              updatedSchedule.route.airline.iataCode,

            flightNumber:
              updatedSchedule.route.flightNumber,

            status:
              updatedSchedule.status,

            departureTime:
              updatedSchedule.departureTime,

            arrivalTime:
              updatedSchedule.arrivalTime,
          },

          departure: {
            airport:
              updatedSchedule.route.originAirport.name,

            airportCode:
              updatedSchedule.route.originAirport.iataCode,

            terminal:
              updatedSchedule.departureTerminal,

            gate:
              updatedSchedule.departureGate,
          },

          destination: {
            airport:
              updatedSchedule.route.destinationAirport.name,

            airportCode:
              updatedSchedule.route.destinationAirport.iataCode,

            terminal:
              updatedSchedule.arrivalTerminal,

            gate:
              updatedSchedule.arrivalGate,
          },

          aircraft: {
            id:
              updatedSchedule.aircraft.id,

            model:
              updatedSchedule.aircraft.model,

            registration:
              updatedSchedule.aircraft.registrationNumber,

            capacity:
              updatedSchedule.aircraft.capacity,
          },

          boarding: {
            totalBookings:
              activeBookings.length,

            totalPassengers,

            checkedInBookings:
              checkedInBookings.length,

            checkedInPassengers,
          },
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("====================================");
    console.error("START BOARDING ERROR");
    console.error(error);
    console.error("====================================");

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to start boarding.",

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