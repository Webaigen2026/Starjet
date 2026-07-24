import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    const flights = await prisma.flight.findMany({
      orderBy: {
        departureDate: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: flights,
    });
  } catch (error) {
    console.error("Flights fetch failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch flights",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const flight = await prisma.flight.create({
      data: {
        flightCode: body.flightCode || `SB-${Date.now()}`,
        airlineName: body.airlineName || "SkyBridge Air",
        aircraftName: body.aircraftName || null,
        originCode: body.originCode,
        originCity: body.originCity || null,
        destinationCode: body.destinationCode,
        destinationCity: body.destinationCity || null,
        departureDate: new Date(body.departureDate),
        departureTime: body.departureTime,
        arrivalTime: body.arrivalTime || null,
        duration: body.duration || null,
        seatsAvailable: Number(body.seatsAvailable || 0),
        price: body.price,
        currency: body.currency || "USD",
        status: body.status || "ACTIVE",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Flight created successfully",
        data: flight,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Flight creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create flight",
      },
      { status: 500 }
    );
  }
}