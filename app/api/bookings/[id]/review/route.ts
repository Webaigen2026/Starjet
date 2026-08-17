import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import {
  authorizeBookingAccess,
  requireAuthenticatedUser
} from "../../../../lib/authorization";

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

    const travelProtection =
      Boolean(body.travelProtection);

    const travelProtectionAmount =
      Number(
        body.travelProtectionPrice ??
          body.travelProtectionAmount ??
          0
      );

    const discountAmount =
      Number(body.discountAmount ?? 0);

    const baseFare =
      Number(booking.baseFare ?? 0);

    const taxes =
      Number(booking.taxes ?? 0);

    const serviceFee =
      Number(booking.serviceFee ?? 0);

    const calculatedTotal =
      Math.max(
        baseFare +
          taxes +
          serviceFee +
          travelProtectionAmount -
          discountAmount,
        0
      );

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

          promoCode:
            typeof body.promoCode === "string" &&
            body.promoCode.trim()
              ? body.promoCode
                  .trim()
                  .toUpperCase()
              : null,

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