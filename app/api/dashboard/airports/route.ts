import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    //---------------------------------------------------------
    // Statistics
    //---------------------------------------------------------

    const totalAirports = await prisma.airport.count();

    //---------------------------------------------------------
    // Airport Information
    //---------------------------------------------------------

    const airports = await prisma.airport.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        originRoutes: {
          include: {
            schedules: true,
          },
        },
        destinationRoutes: {
          include: {
            schedules: true,
          },
        },
      },
    });

    //---------------------------------------------------------
    // Format Response
    //---------------------------------------------------------

    const airportSummary = airports.map((airport) => {
      const departures = airport.originRoutes.reduce(
        (sum, route) => sum + route.schedules.length,
        0
      );

      const arrivals = airport.destinationRoutes.reduce(
        (sum, route) => sum + route.schedules.length,
        0
      );

      return {
        id: airport.id,
        name: airport.name,
        code: airport.iataCode,
        city: airport.city,
        country: airport.country,
        timezone: airport.timezone,
        departures,
        arrivals,
        totalFlights: departures + arrivals,
      };
    });

    //---------------------------------------------------------
    // Response
    //---------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        data: {
          statistics: {
            totalAirports,
          },
          airports: airportSummary,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("====================================");
    console.error("AIRPORT DASHBOARD ERROR");
    console.error(error);
    console.error("====================================");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load airport dashboard.",
        error:
          process.env.NODE_ENV === "development"
            ? String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}