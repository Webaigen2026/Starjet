import { NextResponse } from "next/server";
import {
  InvalidChargeError,
  assertSupportedCheckoutCurrency,
  normalizeCheckoutCurrency,
  toUsdCents,
} from "./stripeMoney";

export const FULL_REFUND_IDEMPOTENCY_VERSION = "v1" as const;

export const RECOVERY_REFUNDABLE_BOOKING_STATUSES = [
  "FAILED",
  "CANCELLED",
] as const;

export const ACTIVE_BOOKING_STATUSES_REQUIRING_CANCEL = [
  "CONFIRMED",
  "CHECKED_IN",
  "BOARDED",
  "COMPLETED",
] as const;

export class PaymentRefundError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "PaymentRefundError";
    this.status = status;
    this.code = code;
  }
}

export type PaymentRefundAuthUser = {
  id?: string;
  role?: string;
};

export type RefundablePaymentRow = {
  id: string;
  bookingId: string;
  status: string;
  amount: unknown;
  currency: string;
  stripePaymentIntentId?: string | null;
};

export type RefundableBookingRow = {
  id: string;
  status: string;
  paymentStatus: string;
};

export type StripeRefundView = {
  id?: string | null;
  object?: string | null;
  status?: string | null;
  amount?: number | null;
  currency?: string | null;
  payment_intent?: unknown;
};

export type StripeRefundPort = {
  refunds: {
    create: (
      params: {
        payment_intent: string;
      },
      options: {
        idempotencyKey: string;
      }
    ) => Promise<StripeRefundView>;
  };
};

export type PaymentRefundTx = {
  payment: {
    updateMany: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<{ count: number }>;
  };
  booking: {
    updateMany: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<{ count: number }>;
  };
};

export type PaymentRefundStore = {
  payment: {
    findUnique: (args: {
      where: { id: string };
      include: { booking: true };
    }) => Promise<
      (RefundablePaymentRow & { booking: RefundableBookingRow | null }) | null
    >;
  };
  $transaction: <T>(fn: (tx: PaymentRefundTx) => Promise<T>) => Promise<T>;
};

export type PaymentRefundRequestDeps = {
  getAuth: () => Promise<
    | {
        authorized: true;
        user: PaymentRefundAuthUser;
      }
    | {
        authorized: false;
        response: Response;
      }
  >;
  isStripeConfigured: () => boolean;
  getStripe: () => StripeRefundPort;
  db: PaymentRefundStore;
};

export function getFullRefundIdempotencyKey(paymentId: string): string {
  return `starjet:payment:${paymentId}:full-refund:${FULL_REFUND_IDEMPOTENCY_VERSION}`;
}

export function getPaymentRefundAuthRejection(
  user: PaymentRefundAuthUser | null
): { status: number; message: string } | null {
  if (!user) {
    return {
      status: 401,
      message: "Authentication required.",
    };
  }

  if (user.role !== "ADMIN") {
    return {
      status: 403,
      message: "You do not have permission to perform this operation.",
    };
  }

  return null;
}

function isValidRefundPaymentIntentId(value: string): boolean {
  return /^pi_[A-Za-z0-9]+$/.test(value);
}

export function extractRefundPaymentIntentId(
  refund: StripeRefundView
): string | null {
  const value = refund.payment_intent;

  if (typeof value === "string") {
    const trimmed = value.trim();
    return isValidRefundPaymentIntentId(trimmed) ? trimmed : null;
  }

  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;

    if (typeof id === "string") {
      const trimmed = id.trim();
      return isValidRefundPaymentIntentId(trimmed) ? trimmed : null;
    }
  }

  return null;
}

function recoveryRefundableBookingStatus(
  status: string
): status is (typeof RECOVERY_REFUNDABLE_BOOKING_STATUSES)[number] {
  return (RECOVERY_REFUNDABLE_BOOKING_STATUSES as readonly string[]).includes(
    status
  );
}

function requiresCancellationFirst(status: string): boolean {
  return (ACTIVE_BOOKING_STATUSES_REQUIRING_CANCEL as readonly string[]).includes(
    status
  );
}

export function resolveAuthoritativeRefundCharge(payment: {
  amount: unknown;
  currency: string;
}): { amountCents: number; currency: string } {
  const currency = normalizeCheckoutCurrency(payment.currency);
  assertSupportedCheckoutCurrency(currency);

  return {
    amountCents: toUsdCents(payment.amount),
    currency,
  };
}

export function getPaymentRefundEligibilityError(
  payment: RefundablePaymentRow,
  booking: RefundableBookingRow | null
): PaymentRefundError | null {
  if (!booking || booking.id !== payment.bookingId) {
    return new PaymentRefundError(
      409,
      "BOOKING_MISSING",
      "This payment is not attached to a booking that can be refunded."
    );
  }

  if (payment.status === "REFUNDED") {
    return null;
  }

  if (payment.status !== "PAID") {
    return new PaymentRefundError(
      409,
      "PAYMENT_NOT_PAID",
      "Only captured PAID payments can be refunded."
    );
  }

  const paymentIntentId = payment.stripePaymentIntentId?.trim() ?? "";

  if (!paymentIntentId) {
    return new PaymentRefundError(
      409,
      "RECONCILIATION_REQUIRED",
      "PaymentIntent reconciliation is required before this payment can be refunded."
    );
  }

  if (!isValidRefundPaymentIntentId(paymentIntentId)) {
    return new PaymentRefundError(
      409,
      "RECONCILIATION_REQUIRED",
      "PaymentIntent reconciliation is required before this payment can be refunded."
    );
  }

  try {
    resolveAuthoritativeRefundCharge(payment);
  } catch (error) {
    if (error instanceof InvalidChargeError) {
      return new PaymentRefundError(
        409,
        "INVALID_LOCAL_CHARGE",
        "This payment cannot be refunded because its stored amount or currency is invalid."
      );
    }

    throw error;
  }

  if (requiresCancellationFirst(booking.status)) {
    return new PaymentRefundError(
      409,
      "BOOKING_ACTIVE",
      "Cancel this booking before refunding a captured payment."
    );
  }

  if (!recoveryRefundableBookingStatus(booking.status)) {
    return new PaymentRefundError(
      409,
      "BOOKING_NOT_REFUNDABLE",
      "A full refund is only allowed for FAILED or CANCELLED bookings."
    );
  }

  return null;
}

function jsonError(status: number, message: string, code?: string) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(code ? { code } : {}),
    },
    {
      status,
    }
  );
}

function refundPaymentIntentMatches(
  refund: StripeRefundView,
  paymentIntentId: string
): boolean {
  return extractRefundPaymentIntentId(refund) === paymentIntentId;
}

function refundChargeMatches(
  refund: StripeRefundView,
  expected: { amountCents: number; currency: string }
): boolean {
  if (refund.amount !== expected.amountCents) {
    return false;
  }

  try {
    return (
      normalizeCheckoutCurrency(refund.currency) === expected.currency
    );
  } catch {
    return false;
  }
}

function persistenceFailedError(paymentId: string): PaymentRefundError {
  console.error("REFUND_PERSISTENCE_FAILED", {
    paymentId,
  });

  return new PaymentRefundError(
    500,
    "REFUND_PERSISTENCE_FAILED",
    "Stripe refund succeeded but local payment state could not be saved. Retry the same refund; do not assume the money is unrefunded."
  );
}

export type RefundPersistStore = Pick<PaymentRefundStore, "$transaction">;

export async function persistAuthoritativeRefund(
  db: RefundPersistStore,
  payment: RefundablePaymentRow,
  booking: RefundableBookingRow
) {
  try {
    await db.$transaction(async (tx) => {
      const paymentUpdated = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: {
            in: ["PAID", "REFUNDED"],
          },
        },
        data: {
          status: "REFUNDED",
        },
      });

      const bookingUpdated = await tx.booking.updateMany({
        where: {
          id: booking.id,
          status: {
            in: [...RECOVERY_REFUNDABLE_BOOKING_STATUSES],
          },
        },
        data: {
          paymentStatus: "REFUNDED",
        },
      });

      if (paymentUpdated.count !== 1 || bookingUpdated.count !== 1) {
        throw persistenceFailedError(payment.id);
      }
    });
  } catch (error) {
    if (error instanceof PaymentRefundError) {
      throw error;
    }

    throw persistenceFailedError(payment.id);
  }
}

async function alignRecoveredBookingPaymentStatus(
  db: PaymentRefundStore,
  booking: RefundableBookingRow
) {
  if (
    !recoveryRefundableBookingStatus(booking.status) ||
    booking.paymentStatus === "REFUNDED"
  ) {
    return;
  }

  await db.$transaction(async (tx) => {
    await tx.booking.updateMany({
      where: {
        id: booking.id,
        status: {
          in: [...RECOVERY_REFUNDABLE_BOOKING_STATUSES],
        },
      },
      data: {
        paymentStatus: "REFUNDED",
      },
    });
  });
}

export async function refundPaidPayment(options: {
  payment: RefundablePaymentRow;
  booking: RefundableBookingRow;
  stripe: StripeRefundPort;
  db: PaymentRefundStore;
}): Promise<{
  alreadyRefunded: boolean;
  stripeCalled: boolean;
  refundStatus: string | null;
}> {
  const { payment, booking, stripe, db } = options;

  if (payment.status === "REFUNDED") {
    await alignRecoveredBookingPaymentStatus(db, booking);

    return {
      alreadyRefunded: true,
      stripeCalled: false,
      refundStatus: "succeeded",
    };
  }

  const eligibility = getPaymentRefundEligibilityError(payment, booking);

  if (eligibility) {
    throw eligibility;
  }

  const paymentIntentId = payment.stripePaymentIntentId as string;
  const expected = resolveAuthoritativeRefundCharge(payment);
  const idempotencyKey = getFullRefundIdempotencyKey(payment.id);

  let refund: StripeRefundView;

  try {
    refund = await stripe.refunds.create(
      {
        payment_intent: paymentIntentId,
      },
      {
        idempotencyKey,
      }
    );
  } catch (error) {
    if (error instanceof PaymentRefundError) {
      throw error;
    }

    throw new PaymentRefundError(
      502,
      "STRIPE_ERROR",
      "Unable to refund this payment."
    );
  }

  const refundStatus = refund.status ?? null;

  if (refundStatus === "pending" || refundStatus === "requires_action") {
    throw new PaymentRefundError(
      409,
      "STRIPE_REFUND_PENDING",
      "Stripe refund is pending and has not completed."
    );
  }

  if (refundStatus === "failed" || refundStatus === "canceled") {
    throw new PaymentRefundError(
      409,
      "STRIPE_REFUND_FAILED",
      "Stripe did not complete this refund."
    );
  }

  if (refundStatus !== "succeeded") {
    throw new PaymentRefundError(
      502,
      "STRIPE_UNEXPECTED",
      "Stripe returned an unexpected refund result."
    );
  }

  if (
    !refundPaymentIntentMatches(refund, paymentIntentId) ||
    !refundChargeMatches(refund, expected)
  ) {
    console.error("STRIPE_REFUND_UNVERIFIED", {
      paymentId: payment.id,
      refundId: refund.id ?? null,
      refundStatus,
    });

    throw new PaymentRefundError(
      409,
      "STRIPE_REFUND_UNVERIFIED",
      "Stripe refund requires reconciliation because the response could not be verified against the captured payment. Retry the same refund; do not assume the money is unrefunded."
    );
  }

  await persistAuthoritativeRefund(db, payment, booking);

  return {
    alreadyRefunded: false,
    stripeCalled: true,
    refundStatus,
  };
}

export async function handlePaymentRefundRequest(
  request: Request,
  paymentId: string,
  deps: PaymentRefundRequestDeps
): Promise<Response> {
  const auth = await deps.getAuth();

  if (!auth.authorized) {
    return auth.response;
  }

  const authRejection = getPaymentRefundAuthRejection(auth.user);

  if (authRejection) {
    return jsonError(authRejection.status, authRejection.message);
  }

  await request.json().catch(() => null);

  if (!paymentId) {
    return jsonError(400, "Payment ID is required.");
  }

  const paymentWithBooking = await deps.db.payment.findUnique({
    where: {
      id: paymentId,
    },
    include: {
      booking: true,
    },
  });

  if (!paymentWithBooking) {
    return jsonError(404, "Payment not found.");
  }

  const { booking, ...payment } = paymentWithBooking;

  if (!booking) {
    return jsonError(
      409,
      "This payment is not attached to a booking that can be refunded."
    );
  }

  if (payment.status === "REFUNDED") {
    try {
      await alignRecoveredBookingPaymentStatus(deps.db, booking);
    } catch {
      return jsonError(
        500,
        "Payment is already refunded, but booking payment status could not be aligned. Retry the same refund.",
        "REFUND_PERSISTENCE_FAILED"
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payment is already refunded.",
        data: {
          paymentId: payment.id,
          bookingId: booking.id,
          paymentStatus: "REFUNDED",
          bookingStatus: booking.status,
          alreadyRefunded: true,
        },
      },
      {
        status: 200,
      }
    );
  }

  if (!deps.isStripeConfigured()) {
    return jsonError(503, "Payment is not configured.");
  }

  try {
    const result = await refundPaidPayment({
      payment,
      booking,
      stripe: deps.getStripe(),
      db: deps.db,
    });

    return NextResponse.json(
      {
        success: true,
        message: result.alreadyRefunded
          ? "Payment is already refunded."
          : "Payment refunded.",
        data: {
          paymentId: payment.id,
          bookingId: booking.id,
          paymentStatus: "REFUNDED",
          bookingStatus: booking.status,
          alreadyRefunded: result.alreadyRefunded,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (error instanceof PaymentRefundError) {
      return jsonError(error.status, error.message, error.code);
    }

    console.error("PAYMENT_REFUND_ERROR", {
      paymentId: payment.id,
    });

    return jsonError(500, "Unable to refund this payment.");
  }
}
