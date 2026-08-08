import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const date = searchParams.get("date");

    if (!from || !to || !date) {
      return NextResponse.json(
        {
          message: "from, to and date are required.",
        },
        { status: 400 }
      );
    }

    // Find origin airport
    const originAirport = await prisma.airport.findFirst({
      where: {
        iataCode: {
          equals: from.toUpperCase(),
          mode: "insensitive",
        },
      },
    });

    if (!originAirport) {
      return NextResponse.json(
        { message: "Origin airport not found." },
        { status: 404 }
      );
    }

    // Find destination airport
    const destinationAirport = await prisma.airport.findFirst({
      where: {
        iataCode: {
          equals: to.toUpperCase(),
          mode: "insensitive",
        },
      },
    });

    if (!destinationAirport) {
      return NextResponse.json(
        { message: "Destination airport not found." },
        { status: 404 }
      );
    }

    // Find matching route
    const route = await prisma.flightRoute.findFirst({
      where: {
        originAirportId: originAirport.id,
        destinationAirportId: destinationAirport.id,
        isActive: true,
      },
    });

    if (!route) {
      return NextResponse.json(
        { message: "Route not found." },
        { status: 404 }
      );
    }

    // UTC day range
    const startDate = new Date(`${date}T00:00:00.000Z`);
    const endDate = new Date(`${date}T23:59:59.999Z`);

    console.log({
      routeId: route.id,
      startDate,
      endDate,
    });

    // Search schedules using routeId
    const schedules = await prisma.flightSchedule.findMany({
      where: {
        routeId: route.id,
        departureTime: {
          gte: startDate,
          lte: endDate,
        },
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

      orderBy: {
        departureTime: "asc",
      },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("SEARCH ERROR:", error);

    return NextResponse.json(
      {
        message: "Unable to search flights.",
      },
      {
        status: 500,
      }
    );
  }
}