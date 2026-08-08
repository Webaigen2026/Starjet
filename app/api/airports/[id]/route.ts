import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET Airport by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const airport = await prisma.airport.findUnique({
      where: { id },
    });

    if (!airport) {
      return NextResponse.json(
        { message: "Airport not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(airport);
  } catch (error) {
    console.error("GET Airport Error:", error);

    return NextResponse.json(
      { message: "Failed to fetch airport." },
      { status: 500 }
    );
  }
}

// UPDATE Airport
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const airport = await prisma.airport.update({
      where: { id },
      data: {
        iataCode: body.iataCode?.toUpperCase(),
        icaoCode: body.icaoCode?.toUpperCase(),
        name: body.name,
        city: body.city,
        state: body.state,
        country: body.country,
        timezone: body.timezone,
        latitude: body.latitude,
        longitude: body.longitude,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(airport);
  } catch (error) {
    console.error("UPDATE Airport Error:", error);

    return NextResponse.json(
      { message: "Failed to update airport." },
      { status: 500 }
    );
  }
}

// DELETE Airport
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    await prisma.airport.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Airport deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE Airport Error:", error);

    return NextResponse.json(
      { message: "Failed to delete airport." },
      { status: 500 }
    );
  }
}