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

    //-------------------------------------------------------
    // Validation
    //-------------------------------------------------------

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

    //-------------------------------------------------------
    // Find Schedule
    //-------------------------------------------------------

    const schedule =
      await prisma.flightSchedule.findUnique({
        where: {
          id: scheduleId,
        },
        include: {
          route: {
            include: {
              airline: true,
              originAirport: true,
              destinationAirport: true,
            },
          },
          aircraft: true,
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

    //-------------------------------------------------------
    // Cannot delay departed/arrived flights
    //-------------------------------------------------------

    if (
      schedule.status === "DEPARTED" ||
      schedule.status === "ARRIVED" ||
      schedule.status === "CANCELLED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This flight can no longer be delayed.",
        },
        {
          status: 400,
        }
      );
    }

    //-------------------------------------------------------
    // Update Schedule
    //-------------------------------------------------------

    const updated =
      await prisma.flightSchedule.update({
        where: {
          id: scheduleId,
        },
        data: {
          departureTime: new Date(departureTime),
          arrivalTime: new Date(arrivalTime),
          status: "DELAYED",
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

    //-------------------------------------------------------
    // Response
    //-------------------------------------------------------

    return NextResponse.json({
      success: true,

      message: "Flight delayed successfully.",

      data: {
        reason: reason ?? null,

        scheduleId: updated.id,

        airline: updated.route.airline.name,

        flightNumber: updated.route.flightNumber,

        departureTime: updated.departureTime,

        arrivalTime: updated.arrivalTime,

        status: updated.status,
      },
    });
  } catch (error) {
    console.error("=================================");
    console.error("DELAY FLIGHT ERROR");
    console.error(error);
    console.error("=================================");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delay flight.",
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