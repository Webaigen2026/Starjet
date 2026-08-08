import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await params;

    console.log("========================================");
    console.log("DEPART FLIGHT");
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
    // Flight Status Validation
    //---------------------------------------------------------

    if (schedule.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          message: "Cancelled flights cannot depart.",
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
          message: "Flight has already departed.",
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
    // Flight Must Be Boarding
    //---------------------------------------------------------

    if (schedule.status !== "BOARDING") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Flight must be in BOARDING status before departure.",
        },
        {
          status: 400,
        }
      );
    }

    //---------------------------------------------------------
    // Get Active Bookings
    //---------------------------------------------------------

    const activeBookings = schedule.bookings.filter(
      (booking) =>
        booking.status !== "CANCELLED" &&
        booking.status !== "REFUNDED" &&
        booking.status !== "FAILED" &&
        booking.status !== "DRAFT"
    );

    //---------------------------------------------------------
    // Find Checked-In Passengers Who Have Not Boarded
    //---------------------------------------------------------

    const waitingToBoard = activeBookings.filter(
      (booking) => booking.status === "CHECKED_IN"
    );

    if (waitingToBoard.length > 0) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Flight cannot depart while checked-in passengers are waiting to board.",

          data: {
            waitingBookings: waitingToBoard.length,

            waitingPassengers: waitingToBoard.reduce(
              (total, booking) =>
                total + booking.passengers.length,
              0
            ),

            bookings: waitingToBoard.map((booking) => ({
              bookingId: booking.id,
              bookingCode: booking.bookingCode,
              customerName: booking.customerName,
              passengers: booking.passengers.length,
            })),
          },
        },
        {
          status: 400,
        }
      );
    }

    //---------------------------------------------------------
    // Find Boarded Bookings
    //---------------------------------------------------------

    const boardedBookings = activeBookings.filter(
      (booking) => booking.status === "BOARDED"
    );

    //---------------------------------------------------------
    // Require At Least One Boarded Booking
    //---------------------------------------------------------

    if (boardedBookings.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Flight cannot depart because no passengers have boarded.",
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
      (total, booking) =>
        total + booking.passengers.length,
      0
    );

    //---------------------------------------------------------
    // Update Flight Schedule
    //---------------------------------------------------------

    const updatedSchedule =
      await prisma.flightSchedule.update({
        where: {
          id: scheduleId,
        },

        data: {
          status: "DEPARTED",
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

        message: "Flight departed successfully.",

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
            id:
              updatedSchedule.aircraft.id,

            model:
              updatedSchedule.aircraft.model,

            registration:
              updatedSchedule.aircraft.registrationNumber,

            capacity:
              updatedSchedule.aircraft.capacity,
          },

          boardingSummary: {
            boardedBookings:
              boardedBookings.length,

            boardedPassengers,

            waitingToBoard: 0,
          },
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("========================================");
    console.error("DEPART FLIGHT ERROR");
    console.error(error);
    console.error("========================================");

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to depart flight.",

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