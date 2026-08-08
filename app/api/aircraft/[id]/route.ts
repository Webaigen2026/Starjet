import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    const aircraft = await prisma.aircraft.findUnique({
      where: { id },
      include: {
        airline: true,
      },
    });

    if (!aircraft) {
      return NextResponse.json(
        { message: "Aircraft not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(aircraft);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Unable to fetch aircraft." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    const body = await request.json();

    const aircraft = await prisma.aircraft.update({
      where: { id },
      data: {
        airlineId: body.airlineId,
        registrationNumber: body.registrationNumber.toUpperCase(),
        manufacturer: body.manufacturer,
        model: body.model,
        capacity: Number(body.capacity),
        economySeats: Number(body.economySeats),
        premiumSeats: Number(body.premiumSeats ?? 0),
        businessSeats: Number(body.businessSeats),
        firstClassSeats: Number(body.firstClassSeats),
        status: body.status,
      },
      include: {
        airline: true,
      },
    });

    return NextResponse.json(aircraft);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Unable to update aircraft." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    await prisma.aircraft.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Aircraft deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Unable to delete aircraft." },
      { status: 500 }
    );
  }
}