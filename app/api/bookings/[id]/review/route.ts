import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import {
  authorizeBookingAccess,
  requireAuthenticatedUser
} from "../../../../lib/authorization";
import {
  calculateBookingTotal,
  calculateTravelProtectionAmount,
} from "../../../../lib/bookingPricing";
import { expireUnpaidReservation } from "../../../../lib/reservationLifecycle";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteProps
) {
  try {
    const auth = await requireAuthenticatedUser();

    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;
    const body = await request.json();

    const booking =
      await prisma.booking.findUnique({
        where: {
          id,
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

    const access = authorizeBookingAccess(auth.user, booking);

    if (!access.authorized) {
      return access.response;
    }

    const expiration = await expireUnpaidReservation(prisma, booking.id);

    if (expiration === "expired" || booking.status === "FAILED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This reservation has expired and can no longer be updated.",
        },
        {
          status: 409,
        }
      );
    }

    const travelProtection =
      Boolean(body.travelProtection);

    const passengersCount = Number(
      booking.passengersCount ?? 0
    );

    const travelProtectionAmount =
      calculateTravelProtectionAmount(
        travelProtection,
        passengersCount
      );

    const discountAmount = 0;

    const promoCode =
      typeof body.promoCode === "string" &&
      body.promoCode.trim()
        ? body.promoCode.trim().toUpperCase()
        : null;

    const calculatedTotal = calculateBookingTotal({
      baseFarePerPassenger: Number(booking.baseFare ?? 0),
      passengersCount,
      taxes: Number(booking.taxes ?? 0),
      serviceFee: Number(booking.serviceFee ?? 0),
      travelProtectionAmount,
      discountAmount,
    });

    const updatedBooking =
      await prisma.booking.update({
        where: {
          id,
        },

        data: {
          travelProtection,

          travelProtectionAmount:
            travelProtection
              ? travelProtectionAmount
              : 0,

          promoCode,

          discountAmount,

          termsAccepted:
            Boolean(body.termsAccepted),

          termsAcceptedAt:
            body.termsAccepted
              ? new Date()
              : null,

          totalAmount:
            calculatedTotal,
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Booking review choices saved successfully.",
      data: updatedBooking,
    });
  } catch (error) {
    console.error(
      "BOOKING REVIEW UPDATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "We couldn't save your booking choices.",
      },
      {
        status: 500,
      }
    );
  }
}
