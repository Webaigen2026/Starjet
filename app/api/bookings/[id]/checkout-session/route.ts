import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireBookingOwnerOrStaff } from "../../../../lib/authorization";
import { expireUnpaidReservation } from "../../../../lib/reservationLifecycle";
import {
  PaymentStartError,
  createPrismaCheckoutPaymentStore,
  getPaymentStartRejection,
  startBookingCheckoutSession,
} from "../../../../lib/checkoutSession";
import {
  getStripe,
  getTrustedAppOrigin,
  isStripeConfigured,
} from "../../../../lib/stripeClient";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking ID is required.",
        },
        { status: 400 }
      );
    }

    await request.json().catch(() => null);

    const existing = await prisma.booking.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking not found.",
        },
        { status: 404 }
      );
    }

    const access = await requireBookingOwnerOrStaff(existing);

    if (!access.authorized) {
      return access.response;
    }

    await expireUnpaidReservation(prisma, existing.id);

    const booking = await prisma.booking.findUnique({
      where: {
        id: existing.id,
      },
      select: {
        id: true,
        bookingCode: true,
        status: true,
        paymentStatus: true,
        reservationExpiresAt: true,
        totalAmount: true,
        currency: true,
        payments: {
          select: {
            id: true,
            status: true,
            provider: true,
            providerRef: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking not found.",
        },
        { status: 404 }
      );
    }

    const rejection = getPaymentStartRejection(booking);

    if (rejection) {
      return NextResponse.json(
        {
          success: false,
          message: rejection.message,
        },
        {
          status: rejection.status,
        }
      );
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment is not configured.",
        },
        { status: 503 }
      );
    }

    const origin = getTrustedAppOrigin();

    if (!origin) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment return URLs are not configured.",
        },
        { status: 500 }
      );
    }

    const result = await startBookingCheckoutSession({
      payments: createPrismaCheckoutPaymentStore(prisma),
      stripe: getStripe() as never,
      booking,
      origin,
    });

    return NextResponse.json(
      {
        success: true,
        message: result.reused
          ? "Existing checkout session reused."
          : "Checkout session created.",
        data: {
          url: result.url,
          sessionId: result.sessionId,
          paymentId: result.paymentId,
          reused: result.reused,
        },
      },
      {
        status: result.reused ? 200 : 201,
      }
    );
  } catch (error) {
    if (error instanceof PaymentStartError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        {
          status: error.status,
        }
      );
    }

    console.error("CHECKOUT SESSION ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to start checkout.",
      },
      {
        status: 500,
      }
    );
  }
}
