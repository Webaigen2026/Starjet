import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") ?? "";
    const country = searchParams.get("country") ?? "";

    const airports = await prisma.airport.findMany({
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
                  city: {
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
              ],
            }
          : {}),
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(airports);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Unable to fetch airports." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const airport = await prisma.airport.create({
      data: {
        iataCode: body.iataCode.toUpperCase(),
        icaoCode: body.icaoCode?.toUpperCase(),
        name: body.name,
        city: body.city,
        state: body.state,
        country: body.country,
        timezone: body.timezone,
        latitude: body.latitude,
        longitude: body.longitude,
      },
    });

    return NextResponse.json(airport, {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Unable to create airport." },
      { status: 500 }
    );
  }
}