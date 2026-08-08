import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") ?? "";
    const airlineId = searchParams.get("airlineId") ?? "";
    const status = searchParams.get("status") ?? "";

    const aircraft = await prisma.aircraft.findMany({
      where: {
        ...(airlineId
          ? {
              airlineId,
            }
          : {}),

        ...(status
          ? {
              status: status as any,
            }
          : {}),

        ...(search
          ? {
              OR: [
                {
                  registrationNumber: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  manufacturer: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  model: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },

      include: {
        airline: true,
      },

      orderBy: {
        registrationNumber: "asc",
      },
    });

    return NextResponse.json(aircraft);
  } catch (error) {
    console.error("GET Aircraft Error:", error);

    return NextResponse.json(
      {
        message: "Unable to fetch aircraft.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      airlineId,
      registrationNumber,
      manufacturer,
      model,
      capacity,
      economySeats,
      premiumSeats,
      businessSeats,
      firstClassSeats,
      status,
    } = body;

    if (
      !airlineId ||
      !registrationNumber ||
      !manufacturer ||
      !model
    ) {
      return NextResponse.json(
        {
          message:
            "Airline, registration number, manufacturer and model are required.",
        },
        {
          status: 400,
        }
      );
    }

    const existingAircraft = await prisma.aircraft.findUnique({
      where: {
        registrationNumber: registrationNumber.toUpperCase(),
      },
    });

    if (existingAircraft) {
      return NextResponse.json(
        {
          message: "Aircraft already exists.",
        },
        {
          status: 409,
        }
      );
    }

    const aircraft = await prisma.aircraft.create({
      data: {
        airlineId,
        registrationNumber: registrationNumber.toUpperCase(),
        manufacturer,
        model,
        capacity: Number(capacity),
        economySeats: Number(economySeats),
        premiumSeats: Number(premiumSeats ?? 0),
        businessSeats: Number(businessSeats),
        firstClassSeats: Number(firstClassSeats),
        status,
      },

      include: {
        airline: true,
      },
    });

    return NextResponse.json(aircraft, {
      status: 201,
    });
  } catch (error) {
    console.error("POST Aircraft Error:", error);

    return NextResponse.json(
      {
        message: "Unable to create aircraft.",
      },
      {
        status: 500,
      }
    );
  }
}