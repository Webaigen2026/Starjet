import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

//
// CREATE PAYMENT
//
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    //
    // Validation
    //
    if (!body.bookingId) {
      return NextResponse.json(
        {
          success: false,
          message: "bookingId is required.",
        },
        {
          status: 400,
        }
      );
    }

    //
    // Verify booking exists
    //
    const booking = await prisma.booking.findUnique({
      where: {
        id: body.bookingId,
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

    //
    // Prevent duplicate successful payment
    //
    const existingPayment = await prisma.payment.findFirst({
      where: {
        bookingId: booking.id,
        status: "PAID",
      },
    });

    if (existingPayment) {
      return NextResponse.json(
        {
          success: false,
          message: "This booking has already been paid.",
        },
        {
          status: 409,
        }
      );
    }

    //
    // Create payment
    //
    const payment = await prisma.payment.create({
      data: {
        booking: {
          connect: {
            id: booking.id,
          },
        },

        amount: booking.totalAmount ?? 0,

        currency: booking.currency,

        status: "PENDING",

        provider: "STRIPE",

        providerRef: null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Payment created successfully.",
        data: payment,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("PAYMENT CREATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create payment.",
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