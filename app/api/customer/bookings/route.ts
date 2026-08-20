import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireAuthenticatedUser } from "../../../lib/authorization";

export async function GET() {
  try {
    const auth = await requireAuthenticatedUser();

    if (!auth.authorized) {
      return auth.response;
    }

    const userId = auth.user.id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        passengers: true,
        payments: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Customer bookings fetch failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch customer bookings",
      },
      { status: 500 }
    );
  }
}