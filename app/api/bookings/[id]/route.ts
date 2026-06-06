import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const body = await request.json();

    const booking = await prisma.booking.update({
      where: {
        id,
      },
      data: {
        status: body.status,
        paymentStatus: body.paymentStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Booking updated successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Booking update failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update booking",
      },
      { status: 500 }
    );
  }
}