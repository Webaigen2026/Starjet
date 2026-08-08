import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const schedule = await prisma.flightSchedule.findUnique({
      where: {
        id,
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

    const seats = await prisma.seat.findMany({
      where: {
        scheduleId: id,
      },
      orderBy: {
        seatNumber: "asc",
      },
    });

    return NextResponse.json(seats);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Unable to fetch seats.",
      },
      {
        status: 500,
      }
    );
  }
}