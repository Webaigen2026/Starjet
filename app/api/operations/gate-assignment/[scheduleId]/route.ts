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

    const body = await request.json();

    const {
      departureTerminal,
      departureGate,
      arrivalTerminal,
      arrivalGate,
    } = body;

    //---------------------------------------------------------
    // Basic Validation
    //---------------------------------------------------------

    if (!departureGate) {
      return NextResponse.json(
        {
          success: false,
          message: "departureGate is required.",
        },
        {
          status: 400,
        }
      );
    }

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
      },
    });

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
          message:
            "Gate cannot be assigned to a cancelled flight.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      schedule.status === "DEPARTED" ||
      schedule.status === "ARRIVED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Gate assignment cannot be changed after departure.",
        },
        {
          status: 400,
        }
      );
    }

    //---------------------------------------------------------
    // Clean Input
    //---------------------------------------------------------

    const cleanDepartureTerminal =
      departureTerminal?.trim().toUpperCase() || null;

    const cleanDepartureGate =
      departureGate.trim().toUpperCase();

    const cleanArrivalTerminal =
      arrivalTerminal?.trim().toUpperCase() || null;

    const cleanArrivalGate =
      arrivalGate?.trim().toUpperCase() || null;

    //---------------------------------------------------------
    // Save Previous Gate Assignment
    //---------------------------------------------------------

    const previousAssignment = {
      departureTerminal: schedule.departureTerminal,
      departureGate: schedule.departureGate,
      arrivalTerminal: schedule.arrivalTerminal,
      arrivalGate: schedule.arrivalGate,
    };

    //---------------------------------------------------------
    // Update Flight Schedule
    //---------------------------------------------------------

    const updatedSchedule =
      await prisma.flightSchedule.update({
        where: {
          id: scheduleId,
        },

        data: {
          departureTerminal: cleanDepartureTerminal,
          departureGate: cleanDepartureGate,
          arrivalTerminal: cleanArrivalTerminal,
          arrivalGate: cleanArrivalGate,
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

        message: "Gate assignment updated successfully.",

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
            },

            destination: {
              airport:
                updatedSchedule.route.destinationAirport.name,

              code:
                updatedSchedule.route.destinationAirport
                  .iataCode,

              city:
                updatedSchedule.route.destinationAirport.city,
            },
          },

          aircraft: {
            id: updatedSchedule.aircraft.id,

            model: updatedSchedule.aircraft.model,

            registration:
              updatedSchedule.aircraft
                .registrationNumber,
          },

          previousAssignment,

          newAssignment: {
            departureTerminal:
              updatedSchedule.departureTerminal,

            departureGate:
              updatedSchedule.departureGate,

            arrivalTerminal:
              updatedSchedule.arrivalTerminal,

            arrivalGate:
              updatedSchedule.arrivalGate,
          },
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("====================================");
    console.error("GATE ASSIGNMENT ERROR");
    console.error(error);
    console.error("====================================");

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to update gate assignment.",

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