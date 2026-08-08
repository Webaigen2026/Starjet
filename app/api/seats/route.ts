import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const scheduleId = searchParams.get("scheduleId");

    if (!scheduleId) {
      return NextResponse.json(
        {
          message: "scheduleId is required",
        },
        {
          status: 400,
        }
      );
    }

    const seats = await prisma.seat.findMany({
      where: {
        scheduleId,
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