import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/app/lib/prisma";

// GET /api/airlines/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const airline = await prisma.airline.findUnique({
      where: { id },
    });

    if (!airline) {
      return NextResponse.json(
        {
          success: false,
          message: "Airline not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(airline);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch airline.",
      },
      {
        status: 500,
      }
    );
  }
}

// PUT /api/airlines/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const airline = await prisma.airline.update({
      where: {
        id,
      },
      data: {
        name: body.name,
        iataCode: body.iataCode?.toUpperCase(),
        icaoCode: body.icaoCode?.toUpperCase() ?? null,
        logoUrl: body.logoUrl ?? null,
        website: body.website ?? null,
        supportEmail: body.supportEmail ?? null,
        supportPhone: body.supportPhone ?? null,
        country: body.country,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(airline);
  } catch (error) {
    console.error(error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "IATA or ICAO code already exists.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update airline.",
      },
      {
        status: 500,
      }
    );
  }
}

// DELETE /api/airlines/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.airline.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Airline deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete airline.",
      },
      {
        status: 500,
      }
    );
  }
}