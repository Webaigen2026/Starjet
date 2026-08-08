import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// =========================
// GET ROUTE BY ID
// =========================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const route = await prisma.flightRoute.findUnique({
      where: {
        id,
      },

      include: {
        airline: true,
        originAirport: true,
        destinationAirport: true,
      },
    });

    if (!route) {
      return NextResponse.json(
        {
          message: "Route not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(route);
  } catch (error) {
    console.error("GET Route Error:", error);

    return NextResponse.json(
      {
        message: "Unable to fetch route.",
      },
      {
        status: 500,
      }
    );
  }
}

// =========================
// UPDATE ROUTE
// =========================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();

    const route = await prisma.flightRoute.update({
      where: {
        id,
      },

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
        isActive: body.isActive,
      },

      include: {
        airline: true,
        originAirport: true,
        destinationAirport: true,
      },
    });

    return NextResponse.json(route);
  } catch (error) {
    console.error("PUT Route Error:", error);

    return NextResponse.json(
      {
        message: "Unable to update route.",
      },
      {
        status: 500,
      }
    );
  }
}

// =========================
// DELETE ROUTE
// =========================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.flightRoute.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Route deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE Route Error:", error);

    return NextResponse.json(
      {
        message: "Unable to delete route.",
      },
      {
        status: 500,
      }
    );
  }
}