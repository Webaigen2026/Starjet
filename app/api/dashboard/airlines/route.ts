import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireOperationsStaff } from "../../../lib/authorization";

export async function GET() {
  try {
    const auth = await requireOperationsStaff();

    if (!auth.authorized) {
      return auth.response;
    }

    //-------------------------------------------------------
    // Statistics
    //-------------------------------------------------------

    const totalAirlines = await prisma.airline.count();

    //-------------------------------------------------------
    // Airlines with Routes
    //-------------------------------------------------------

    const airlines = await prisma.airline.findMany({
      include: {
        routes: {
          include: {
            schedules: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    //-------------------------------------------------------
    // Format Response
    //-------------------------------------------------------

    const airlineSummary = airlines.map((airline) => {
      const totalRoutes = airline.routes.length;

      const totalFlights = airline.routes.reduce(
        (sum, route) => sum + route.schedules.length,
        0
      );

      return {
        id: airline.id,
        name: airline.name,
        code: airline.iataCode,
        country: airline.country,
        logo: airline.logoUrl,
        totalRoutes,
        totalFlights,
      };
    });

    //-------------------------------------------------------
    // Response
    //-------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        data: {
          statistics: {
            totalAirlines,
          },

          airlines: airlineSummary,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("==================================");
    console.error("AIRLINE DASHBOARD ERROR");
    console.error(error);
    console.error("==================================");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load airline dashboard.",
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