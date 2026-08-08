import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await params;

    const body = await request.json();

    const reason = body.reason ?? "Flight cancelled by airline.";

    //---------------------------------------------------------
    // Find Flight Schedule
    //---------------------------------------------------------

    const schedule = await prisma.flightSchedule.findUnique({
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
        bookings: true,
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
    // Already Cancelled
    //---------------------------------------------------------

    if (schedule.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          message: "Flight has already been cancelled.",
        },
        {
          status: 400,
        }
      );
    }

    //---------------------------------------------------------
    // Cannot cancel after arrival
    //---------------------------------------------------------

    if (schedule.status === "ARRIVED") {
      return NextResponse.json(
        {
          success: false,
          message: "Arrived flights cannot be cancelled.",
        },
        {
          status: 400,
        }
      );
    }

    //---------------------------------------------------------
    // Transaction
    //---------------------------------------------------------

    const result = await prisma.$transaction(async (tx) => {
      const updatedSchedule =
        await tx.flightSchedule.update({
          where: {
            id: scheduleId,
          },
          data: {
            status: "CANCELLED",
          },
        });

      const updatedBookings =
        await tx.booking.updateMany({
          where: {
            scheduleId,
            status: {
              notIn: [
                "CANCELLED",
                "REFUNDED",
              ],
            },
          },
          data: {
            status: "CANCELLED",
          },
        });

      return {
        updatedSchedule,
        updatedBookings,
      };
    });

    //---------------------------------------------------------
    // Response
    //---------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Flight cancelled successfully.",

        data: {
          reason,

          scheduleId: schedule.id,

          airline: schedule.route.airline.name,

          flightNumber:
            schedule.route.flightNumber,

          status: "CANCELLED",

          affectedBookings:
            result.updatedBookings.count,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "================================="
    );
    console.error("CANCEL FLIGHT ERROR");
    console.error(error);
    console.error(
      "================================="
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to cancel flight.",
        error:
          process.env.NODE_ENV ===
          "development"
            ? String(error)
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}