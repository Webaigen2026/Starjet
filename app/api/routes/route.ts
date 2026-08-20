import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/authorization";

// =========================
// GET ALL ROUTES
// =========================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") ?? "";

    const routes = await prisma.flightRoute.findMany({
      where: search
        ? {
            OR: [
              {
                routeCode: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                flightNumber: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {},

      include: {
        airline: {
          select: {
            id: true,
            name: true,
            iataCode: true,
          },
        },

        originAirport: {
          select: {
            id: true,
            name: true,
            iataCode: true,
            city: true,
          },
        },

        destinationAirport: {
          select: {
            id: true,
            name: true,
            iataCode: true,
            city: true,
          },
        },
      },

      orderBy: {
        routeCode: "asc",
      },
    });

    return NextResponse.json(routes);
  } catch (error) {
    console.error("GET Routes Error:", error);

    return NextResponse.json(
      {
        message: "Unable to fetch routes.",
      },
      {
        status: 500,
      }
    );
  }
}

// =========================
// CREATE ROUTE
// =========================

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json();

    console.log("========== REQUEST BODY ==========");
    console.log(body);

    if (
      !body.airlineId ||
      !body.originAirportId ||
      !body.destinationAirportId ||
      !body.routeCode ||
      !body.flightNumber ||
      !body.estimatedDuration
    ) {
      return NextResponse.json(
        {
          message: "Missing required fields.",
        },
        {
          status: 400,
        }
      );
    }

    // Check Airline
    const airline = await prisma.airline.findUnique({
      where: {
        id: body.airlineId,
      },
    });

    console.log("========== AIRLINE ==========");
    console.log(airline);

    // Check Origin Airport
    const originAirport = await prisma.airport.findFirst({
        where: {
          id: body.originAirportId,
        },
      });

    console.log("========== ORIGIN AIRPORT ==========");
    console.log(originAirport);

    // Check Destination Airport
    const destinationAirport = await prisma.airport.findFirst({
        where: {
          id: body.destinationAirportId,
        },
      });

    console.log("========== DESTINATION AIRPORT ==========");
    console.log(destinationAirport);

    if (!airline) {
      return NextResponse.json(
        {
          message: "Airline not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (!originAirport) {
      return NextResponse.json(
        {
          message: "Origin airport not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (!destinationAirport) {
      return NextResponse.json(
        {
          message: "Destination airport not found.",
        },
        {
          status: 404,
        }
      );
    }

    const route = await prisma.flightRoute.create({
      data: {
        airlineId: body.airlineId,
        originAirportId: body.originAirportId,
        destinationAirportId: body.destinationAirportId,
        routeCode: body.routeCode.toUpperCase(),
        flightNumber: body.flightNumber.toUpperCase(),
        estimatedDuration: Number(body.estimatedDuration),
        distanceKm: body.distanceKm
          ? Number(body.distanceKm)
          : null,
        isActive:
          body.isActive === undefined
            ? true
            : body.isActive,
      },

      include: {
        airline: true,
        originAirport: true,
        destinationAirport: true,
      },
    });

    return NextResponse.json(route, {
      status: 201,
    });
  } catch (error) {
    console.error("POST Route Error:", error);

    return NextResponse.json(
      {
        message: "Unable to create route.",
      },
      {
        status: 500,
      }
    );
  }
}