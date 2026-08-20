import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireOperationsStaff } from "../../../../lib/authorization";
import { claimAndReleaseInventory } from "../../../../lib/reservationLifecycle";

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

    const reason = body.reason ?? "Flight cancelled by airline.";

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

    const result = await prisma.$transaction(async (tx) => {
      const cancelledSchedule = await tx.flightSchedule.updateMany({
        where: {
          id: scheduleId,
          status: {
            notIn: ["CANCELLED", "ARRIVED"],
          },
        },
        data: {
          status: "CANCELLED",
        },
      });

      if (cancelledSchedule.count !== 1) {
        throw new Error("FLIGHT_ALREADY_CANCELLED");
      }

      const heldBookings = await tx.booking.findMany({
        where: {
          scheduleId,
          status: {
            notIn: ["CANCELLED", "REFUNDED", "FAILED"],
          },
        },
        select: {
          id: true,
          scheduleId: true,
          passengersCount: true,
        },
      });

      let releasedBookings = 0;

      for (const booking of heldBookings) {
        const claimed = await claimAndReleaseInventory(tx, {
          bookingId: booking.id,
          scheduleId: booking.scheduleId,
          passengersCount: booking.passengersCount,
          fromWhere: {
            id: booking.id,
            status: {
              notIn: ["CANCELLED", "REFUNDED", "FAILED"],
            },
          },
          toStatus: "CANCELLED",
        });

        if (claimed === "won") {
          releasedBookings += 1;
        }
      }

      return {
        releasedBookings,
      };
    });

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

          affectedBookings: result.releasedBookings,
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

    if (
      error instanceof Error &&
      error.message === "FLIGHT_ALREADY_CANCELLED"
    ) {
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
