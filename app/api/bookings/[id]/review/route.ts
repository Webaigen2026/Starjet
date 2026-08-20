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
import {
  getReviewPricingLockRejection,
  reviewPricingUpdateWhere,
} from "../../../../lib/reviewPaymentIntegrity";
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
        include: {
          payments: true,
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

    const pricingLock = getReviewPricingLockRejection({
      id: booking.id,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      reservationExpiresAt: booking.reservationExpiresAt,
      totalAmount: booking.totalAmount,
      currency: booking.currency,
      payments: booking.payments,
    });

    if (pricingLock) {
      return NextResponse.json(
        {
          success: false,
          message: pricingLock.message,
        },
        {
          status: pricingLock.status,
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

    const updateResult =
      await prisma.booking.updateMany({
        where: reviewPricingUpdateWhere(id),
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

    if (updateResult.count !== 1) {
      const refreshedBooking =
        await prisma.booking.findUnique({
          where: {
            id,
          },
          include: {
            payments: true,
          },
        });

      const concurrentLock = refreshedBooking
        ? getReviewPricingLockRejection({
            id: refreshedBooking.id,
            status: refreshedBooking.status,
            paymentStatus: refreshedBooking.paymentStatus,
            reservationExpiresAt:
              refreshedBooking.reservationExpiresAt,
            totalAmount: refreshedBooking.totalAmount,
            currency: refreshedBooking.currency,
            payments: refreshedBooking.payments,
          })
        : null;

      return NextResponse.json(
        {
          success: false,
          message:
            concurrentLock?.message ??
            "Payment is already in progress. Booking choices cannot be changed until payment completes or the checkout session expires.",
        },
        {
          status: 409,
        }
      );
    }

    const updatedBooking =
      await prisma.booking.findUnique({
        where: {
          id,
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
