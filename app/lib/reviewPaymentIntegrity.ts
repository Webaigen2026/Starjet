import {
  bookingHasPaidCapture,
  isActivePendingStripeAttempt,
  type PaymentAttempt,
  type PaymentStartBooking,
} from "./checkoutSession";

export function hasUnresolvedStripePaymentAttempt(
  payments: PaymentAttempt[] | undefined
): boolean {
  return payments?.some(isActivePendingStripeAttempt) ?? false;
}

export function getReviewPricingLockRejection(
  booking: PaymentStartBooking
): { status: number; message: string } | null {
  if (bookingHasPaidCapture(booking)) {
    return {
      status: 409,
      message:
        "This booking has already been paid and cannot be repriced.",
    };
  }

  if (hasUnresolvedStripePaymentAttempt(booking.payments)) {
    return {
      status: 409,
      message:
        "Payment is already in progress. Booking choices cannot be changed until payment completes or the checkout session expires.",
    };
  }

  return null;
}

export function reviewPricingUpdateWhere(bookingId: string) {
  return {
    id: bookingId,
    paymentStatus: { not: "PAID" as const },
    payments: {
      none: {
        OR: [
          { status: "PAID" as const },
          { status: "PENDING" as const, provider: "STRIPE" as const },
        ],
      },
    },
  };
}

export function canApplyReviewPricingUpdate(booking: {
  paymentStatus: string;
  payments?: PaymentAttempt[];
}): boolean {
  if (booking.paymentStatus === "PAID") {
    return false;
  }

  const payments = booking.payments ?? [];

  if (payments.some((payment) => payment.status === "PAID")) {
    return false;
  }

  return !hasUnresolvedStripePaymentAttempt(payments);
}
