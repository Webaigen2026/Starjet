import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireOperationsStaff } from "../../../../lib/authorization";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const auth = await requireOperationsStaff();

    if (!auth.authorized) {
      return auth.response;
    }

    const { scheduleId } = await params;

    console.log("========================================");
    console.log("ARRIVE FLIGHT");
    console.log("Schedule ID:", scheduleId);
    console.log("========================================");

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

    if (schedule.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          message: "Cancelled flights cannot be marked as arrived.",
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
          message: "Flight has already arrived.",
        },
        {
          status: 400,
        }
      );
    }

    //---------------------------------------------------------
    // Flight Must Have Departed
    //---------------------------------------------------------

    if (schedule.status !== "DEPARTED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Flight must be in DEPARTED status before it can arrive.",
        },
        {
          status: 400,
        }
      );
    }

    //---------------------------------------------------------
    // Get Boarded Bookings
    //---------------------------------------------------------

    const boardedBookings = schedule.bookings.filter(
      (booking) => booking.status === "BOARDED"
    );

    //---------------------------------------------------------
    // Require Boarded Passengers
    //---------------------------------------------------------

    if (boardedBookings.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Flight cannot be marked as arrived because no boarded passengers were found.",
        },
        {
          status: 400,
        }
      );
    }

    //---------------------------------------------------------
    // Calculate Boarded Passengers
    //---------------------------------------------------------

    const boardedPassengers = boardedBookings.reduce(
      (total, booking) => total + booking.passengers.length,
      0
    );

    //---------------------------------------------------------
    // Update Flight Schedule
    //---------------------------------------------------------

    const updatedSchedule = await prisma.flightSchedule.update({
      where: {
        id: scheduleId,
      },

      data: {
        status: "ARRIVED",
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
    // Success Response
    //---------------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        message: "Flight arrived successfully.",

        data: {
          scheduleId: updatedSchedule.id,

          flight: {
            airline: updatedSchedule.route.airline.name,

            airlineCode:
              updatedSchedule.route.airline.iataCode,

            flightNumber:
              updatedSchedule.route.flightNumber,

            status: updatedSchedule.status,

            departureTime:
              updatedSchedule.departureTime,

            arrivalTime:
              updatedSchedule.arrivalTime,
          },

          route: {
            origin: {
              airport:
                updatedSchedule.route.originAirport.name,

              code:
                updatedSchedule.route.originAirport.iataCode,

              city:
                updatedSchedule.route.originAirport.city,

              terminal:
                updatedSchedule.departureTerminal,

              gate:
                updatedSchedule.departureGate,
            },

            destination: {
              airport:
                updatedSchedule.route.destinationAirport.name,

              code:
                updatedSchedule.route.destinationAirport.iataCode,

              city:
                updatedSchedule.route.destinationAirport.city,

              terminal:
                updatedSchedule.arrivalTerminal,

              gate:
                updatedSchedule.arrivalGate,
            },
          },

          aircraft: {
            id: updatedSchedule.aircraft.id,

            model:
              updatedSchedule.aircraft.model,

            registration:
              updatedSchedule.aircraft.registrationNumber,

            capacity:
              updatedSchedule.aircraft.capacity,
          },

          passengerSummary: {
            boardedBookings: boardedBookings.length,

            boardedPassengers,
          },
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("========================================");
    console.error("ARRIVE FLIGHT ERROR");
    console.error(error);
    console.error("========================================");

    return NextResponse.json(
      {
        success: false,

        message: "Unable to mark flight as arrived.",

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