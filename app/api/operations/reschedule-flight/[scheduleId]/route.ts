import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await params;

    const body = await request.json();

    const {
      departureTime,
      arrivalTime,
      reason,
    } = body;

    //---------------------------------------------------------
    // Validation
    //---------------------------------------------------------

    if (!departureTime || !arrivalTime) {
      return NextResponse.json(
        {
          success: false,
          message:
            "departureTime and arrivalTime are required.",
        },
        {
          status: 400,
        }
      );
    }

    const newDeparture = new Date(departureTime);
    const newArrival = new Date(arrivalTime);

    if (newArrival <= newDeparture) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Arrival time must be later than departure time.",
        },
        {
          status: 400,
        }
      );
    }

    //---------------------------------------------------------
    // Find Schedule
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

    console.log("Current Flight Status:", schedule.status);

    //---------------------------------------------------------
    // Cannot reschedule after departure
    //---------------------------------------------------------

    if (
      schedule.status === "DEPARTED" ||
      schedule.status === "ARRIVED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Flights that have departed or arrived cannot be rescheduled.",
        },
        {
          status: 400,
        }
      );
    }

    //---------------------------------------------------------
    // Save previous schedule
    //---------------------------------------------------------

    const previousDeparture = schedule.departureTime;
    const previousArrival = schedule.arrivalTime;
    const previousStatus = schedule.status;

    //---------------------------------------------------------
    // Update Schedule
    //---------------------------------------------------------

    const updatedSchedule =
      await prisma.flightSchedule.update({
        where: {
          id: scheduleId,
        },
        data: {
          departureTime: newDeparture,
          arrivalTime: newArrival,

          // If it was cancelled or delayed,
          // put it back to scheduled.
          status: "SCHEDULED",
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
        message: "Flight rescheduled successfully.",

        data: {
          reason: reason ?? null,

          scheduleId: updatedSchedule.id,

          airline:
            updatedSchedule.route.airline.name,

          airlineCode:
            updatedSchedule.route.airline.iataCode,

          flightNumber:
            updatedSchedule.route.flightNumber,

          previousSchedule: {
            departureTime: previousDeparture,
            arrivalTime: previousArrival,
            status: previousStatus,
          },

          newSchedule: {
            departureTime:
              updatedSchedule.departureTime,
            arrivalTime:
              updatedSchedule.arrivalTime,
            status: updatedSchedule.status,
          },
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("================================");
    console.error("RESCHEDULE FLIGHT ERROR");
    console.error(error);
    console.error("================================");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to reschedule flight.",
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