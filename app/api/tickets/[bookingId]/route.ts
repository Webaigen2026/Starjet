import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      include: {
        schedule: {
          include: {
            aircraft: true,
            route: {
              include: {
                airline: true,
                originAirport: true,
                destinationAirport: true,
              },
            },
          },
        },

        passengers: {
          include: {
            seat: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },

        seats: {
          orderBy: {
            seatNumber: "asc",
          },
        },

        payments: {
          orderBy: {
            createdAt: "desc",
          },
        },

        user: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("TICKET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load ticket.",
        error:
          process.env.NODE_ENV === "development"
            ? String(error)
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}