import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();

    const seat = await prisma.seat.findUnique({
      where: {
        id,
      },
    });

    if (!seat) {
      return NextResponse.json(
        { message: "Seat not found." },
        { status: 404 }
      );
    }

    const updatedSeat = await prisma.seat.update({
      where: {
        id,
      },
      data: {
        status: body.status,
        bookingId: body.bookingId ?? null,
        passengerId: body.passengerId ?? null,
      },
    });

    return NextResponse.json(updatedSeat);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Unable to update seat.",
      },
      {
        status: 500,
      }
    );
  }
}