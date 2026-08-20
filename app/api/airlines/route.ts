import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/authorization";

// GET /api/airlines
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") ?? "";
    const country = searchParams.get("country") ?? "";

    const airlines = await prisma.airline.findMany({
      where: {
        ...(country
          ? {
              country: {
                equals: country,
                mode: "insensitive",
              },
            }
          : {}),
        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  iataCode: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  icaoCode: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(airlines, { status: 200 });
  } catch (error) {
    console.error("GET Airlines Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch airlines.",
      },
      { status: 500 }
    );
  }
}

// POST /api/airlines
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json();

    if (
      !body.name ||
      !body.iataCode ||
      !body.country
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, IATA Code and Country are required.",
        },
        { status: 400 }
      );
    }

    const airline = await prisma.airline.create({
      data: {
        name: body.name.trim(),
        iataCode: body.iataCode.trim().toUpperCase(),
        icaoCode: body.icaoCode
          ? body.icaoCode.trim().toUpperCase()
          : null,
        logoUrl: body.logoUrl || null,
        website: body.website || null,
        supportEmail: body.supportEmail || null,
        supportPhone: body.supportPhone || null,
        country: body.country.trim(),
      },
    });

    return NextResponse.json(airline, {
      status: 201,
    });
  } catch (error) {
    console.error("POST Airline Error:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An airline with the same IATA or ICAO code already exists.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error.",
      },
      {
        status: 500,
      }
    );
  }
}