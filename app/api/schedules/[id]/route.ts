import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { requireOperationsStaff } from "@/app/lib/authorization";

// =========================
// GET SCHEDULE
// =========================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const schedule = await prisma.flightSchedule.findUnique({
    where: {
      id,
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
        message: "Schedule not found.",
      },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json(schedule);
}

// =========================
// UPDATE
// =========================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireOperationsStaff();

    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;

    const body = await request.json();

    const existingSchedule =
      await prisma.flightSchedule.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          aircraftId: true,
        },
      });

    if (!existingSchedule) {
      return NextResponse.json(
        {
          message: "Schedule not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      typeof body.aircraftId === "string" &&
      body.aircraftId !== existingSchedule.aircraftId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Aircraft cannot be changed from the generic schedule update. Use the change-aircraft operations endpoint so inventory can be reconciled.",
        },
        {
          status: 409,
        }
      );
    }

    const schedule = await prisma.flightSchedule.update({
      where: {
        id,
      },

      data: {
        routeId: body.routeId,
        departureTime: body.departureTime
          ? new Date(body.departureTime)
          : undefined,
        arrivalTime: body.arrivalTime
          ? new Date(body.arrivalTime)
          : undefined,
        baseFare: body.baseFare,
        status: body.status,
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

    return NextResponse.json(schedule);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Unable to update schedule.",
      },
      {
        status: 500,
      }
    );
  }
}

// =========================
// DELETE
// =========================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireOperationsStaff();

    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;

    await prisma.flightSchedule.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Schedule deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Unable to delete schedule.",
      },
      {
        status: 500,
      }
    );
  }
}