import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { requireOperationsStaff } from "@/app/lib/authorization";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireOperationsStaff();

    if (!auth.authorized) {
      return auth.response;
    }

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

    if (body.status === "BOOKED") {
      const assignment = await prisma.seat.updateMany({
        where: {
          id,
          status: "AVAILABLE",
          bookingId: null,
          passengerId: null,
        },
        data: {
          status: "BOOKED",
          bookingId: body.bookingId ?? null,
          passengerId: body.passengerId ?? null,
        },
      });

      if (assignment.count !== 1) {
        return NextResponse.json(
          {
            message: "Seat is no longer available.",
          },
          {
            status: 409,
          }
        );
      }

      const assignedSeat = await prisma.seat.findUnique({
        where: {
          id,
        },
      });

      return NextResponse.json(assignedSeat);
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