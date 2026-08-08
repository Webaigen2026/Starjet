import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    //--------------------------------------------------------
    // Total Routes
    //--------------------------------------------------------

    const totalRoutes = await prisma.flightRoute.count();

    //--------------------------------------------------------
    // Route Details
    //--------------------------------------------------------

    const routes = await prisma.flightRoute.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        airline: true,

        originAirport: true,

        destinationAirport: true,

        schedules: true,
      },
    });

    //--------------------------------------------------------
    // Format Response
    //--------------------------------------------------------

    const routeSummary = routes.map((route) => ({
      id: route.id,

      airline: {
        id: route.airline.id,
        name: route.airline.name,
        code: route.airline.iataCode,
      },

      origin: {
        airport: route.originAirport.name,
        city: route.originAirport.city,
        code: route.originAirport.iataCode,
      },

      destination: {
        airport: route.destinationAirport.name,
        city: route.destinationAirport.city,
        code: route.destinationAirport.iataCode,
      },

      totalSchedules: route.schedules.length,

      createdAt: route.createdAt,
    }));

    //--------------------------------------------------------
    // Top Routes
    //--------------------------------------------------------

    const topRoutes = [...routeSummary]
      .sort((a, b) => b.totalSchedules - a.totalSchedules)
      .slice(0, 10);

    //--------------------------------------------------------
    // Response
    //--------------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        data: {
          statistics: {
            totalRoutes,
          },

          topRoutes,

          routes: routeSummary,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("====================================");
    console.error("ROUTE DASHBOARD ERROR");
    console.error(error);
    console.error("====================================");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load routes dashboard.",
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