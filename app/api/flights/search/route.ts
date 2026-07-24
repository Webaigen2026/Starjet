import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const originCode = searchParams.get("originCode");
    const destinationCode = searchParams.get("destinationCode");
    const departureDate = searchParams.get("departureDate");
    const passengersCount = Number(searchParams.get("passengersCount") || 1);

    if (!originCode || !destinationCode || !departureDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required search fields",
        },
        { status: 400 }
      );
    }

    const startDate = new Date(`${departureDate}T00:00:00.000Z`);
    const endDate = new Date(`${departureDate}T23:59:59.999Z`);

    const flights = await prisma.flight.findMany({
      where: {
        originCode,
        destinationCode,
        departureDate: {
          gte: startDate,
          lte: endDate,
        },
        seatsAvailable: {
          gte: passengersCount,
        },
        status: "ACTIVE",
      },
      orderBy: {
        departureDate: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: flights,
    });
  } catch (error) {
    console.error("Flight search failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to search flights",
      },
      { status: 500 }
    );
  }
}