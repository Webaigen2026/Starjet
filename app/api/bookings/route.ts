import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
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
    console.error("Booking fetch failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch bookings",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = await getServerSession(authOptions);
 
    const booking = await prisma.booking.create({
      data: {
        bookingCode: `BK-${Date.now()}`,
        userId: session?.user ? (session.user as any).id : null,

        tripType: body.tripType || "ROUND_TRIP",

        originCode: body.originCode,
        destinationCode: body.destinationCode,

        departureDate: new Date(body.departureDate),
        returnDate: body.returnDate ? new Date(body.returnDate) : null,

        passengersCount: Number(body.passengersCount || 1),

        airlineName: body.airlineName || null,
        totalAmount: body.totalAmount ? Number(body.totalAmount) : null,
        currency: "USD",

        status: "DRAFT",
        paymentStatus: "PENDING",

        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone || null,

        passengers: {
          create: {
            firstName: body.firstName,
            lastName: body.lastName,
            dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
            gender: body.gender || null,
            nationality: body.nationality || null,
            passportNumber: body.passportNumber || null,
            passportCountry: body.passportCountry || null,
            passportExpiry: body.passportExpiry
              ? new Date(body.passportExpiry)
              : null,
          },
        },
      },
      include: {
        passengers: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Booking created successfully",
        data: booking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Booking creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create booking",
      },
      { status: 500 }
    );
  }
}