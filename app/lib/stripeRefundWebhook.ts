import {
  InvalidChargeError,
  normalizeCheckoutCurrency,
} from "./stripeMoney";
import {
  ACTIVE_BOOKING_STATUSES_REQUIRING_CANCEL,
  PaymentRefundError,
  RECOVERY_REFUNDABLE_BOOKING_STATUSES,
  extractRefundPaymentIntentId,
  persistAuthoritativeRefund,
  resolveAuthoritativeRefundCharge,
  type RefundableBookingRow,
  type RefundablePaymentRow,
  type StripeRefundView,
} from "./paymentRefund";
import {
  STRIPE_WEBHOOK_REFUND_EVENTS,
  StripeWebhookRetryError,
  type StripeEventLike,
  type StripeWebhookStore,
  type WebhookBookingRow,
  type WebhookPaymentRow,
} from "./stripeWebhook";

type RefundWebhookEvent = (typeof STRIPE_WEBHOOK_REFUND_EVENTS)[number];

export function isStripeRefundWebhookEvent(
  type: string
): type is RefundWebhookEvent {
  return (STRIPE_WEBHOOK_REFUND_EVENTS as readonly string[]).includes(type);
}

function logRefundWebhook(code: string, details: Record<string, unknown>) {
  console.error(code, details);
}

export function asStripeRefund(value: unknown): StripeRefundView | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const refund = value as StripeRefundView;

  if (refund.object != null && refund.object !== "refund") {
    return null;
  }

  if (typeof refund.id !== "string" || !refund.id) {
    return null;
  }

  return refund;
}

function isRecoveryBookingStatus(status: string): boolean {
  return (RECOVERY_REFUNDABLE_BOOKING_STATUSES as readonly string[]).includes(
    status
  );
}

function isActiveBookingStatus(status: string): boolean {
  return (ACTIVE_BOOKING_STATUSES_REQUIRING_CANCEL as readonly string[]).includes(
    status
  );
}

function refundCurrencyMatches(
  refund: StripeRefundView,
  expectedCurrency: string
): boolean {
  try {
    return normalizeCheckoutCurrency(refund.currency) === expectedCurrency;
  } catch {
    return false;
  }
}

export async function processStripeRefundEvent(
  db: StripeWebhookStore,
  event: StripeEventLike
): Promise<void> {
  const eventId = event.id ?? null;
  const refund = asStripeRefund(event.data.object);

  if (!refund) {
    logRefundWebhook("STRIPE_WEBHOOK_MALFORMED_REFUND", {
      eventId,
      type: event.type,
    });
    return;
  }

  const details = {
    eventId,
    type: event.type,
    refundId: refund.id ?? null,
  };

  if (event.type === "refund.failed") {
    logRefundWebhook("STRIPE_WEBHOOK_REFUND_FAILED", {
      ...details,
      refundStatus: refund.status ?? null,
    });
    return;
  }

  const refundStatus = refund.status ?? null;

  if (refundStatus === "pending" || refundStatus === "requires_action") {
    logRefundWebhook("STRIPE_WEBHOOK_REFUND_PENDING", {
      ...details,
      refundStatus,
    });
    return;
  }

  if (refundStatus === "failed" || refundStatus === "canceled") {
    logRefundWebhook("STRIPE_WEBHOOK_REFUND_FAILED", {
      ...details,
      refundStatus,
    });
    return;
  }

  if (refundStatus !== "succeeded") {
    logRefundWebhook("STRIPE_WEBHOOK_REFUND_UNEXPECTED_STATUS", {
      ...details,
      refundStatus,
    });
    return;
  }

  const paymentIntentId = extractRefundPaymentIntentId(refund);

  if (!paymentIntentId) {
    logRefundWebhook("STRIPE_WEBHOOK_MISSING_REFUND_PAYMENT_INTENT", details);
    return;
  }

  const paymentWithBooking = await db.payment.findUnique({
    where: {
      stripePaymentIntentId: paymentIntentId,
    },
    include: {
      booking: true,
    },
  });

  if (!paymentWithBooking?.booking) {
    logRefundWebhook("STRIPE_WEBHOOK_UNKNOWN_PAYMENT_INTENT", {
      ...details,
      paymentIntentId,
    });
    return;
  }

  const booking = paymentWithBooking.booking as WebhookBookingRow &
    RefundableBookingRow;
  const payment = {
    id: paymentWithBooking.id,
    bookingId: paymentWithBooking.bookingId,
    status: paymentWithBooking.status,
    amount: paymentWithBooking.amount,
    currency: paymentWithBooking.currency,
    stripePaymentIntentId: paymentWithBooking.stripePaymentIntentId,
  } satisfies RefundablePaymentRow & Pick<WebhookPaymentRow, "id">;

  const resolved = {
    ...details,
    paymentIntentId,
    paymentId: payment.id,
    bookingId: booking.id,
    bookingStatus: booking.status,
  };

  if (isActiveBookingStatus(booking.status)) {
    logRefundWebhook("STRIPE_WEBHOOK_REFUND_ACTIVE_BOOKING", resolved);
    return;
  }

  if (!isRecoveryBookingStatus(booking.status)) {
    logRefundWebhook("STRIPE_WEBHOOK_REFUND_BOOKING_NOT_RECOVERABLE", resolved);
    return;
  }

  if (payment.status !== "PAID" && payment.status !== "REFUNDED") {
    logRefundWebhook("STRIPE_WEBHOOK_REFUND_PAYMENT_NOT_CAPTURED", {
      ...resolved,
      paymentStatus: payment.status,
    });
    return;
  }

  if (payment.stripePaymentIntentId !== paymentIntentId) {
    logRefundWebhook("STRIPE_WEBHOOK_REFUND_PAYMENT_INTENT_MISMATCH", resolved);
    return;
  }

  let expected: { amountCents: number; currency: string };

  try {
    expected = resolveAuthoritativeRefundCharge(payment);
  } catch (error) {
    if (error instanceof InvalidChargeError) {
      logRefundWebhook("STRIPE_WEBHOOK_REFUND_INVALID_LOCAL_CHARGE", resolved);
      return;
    }

    throw error;
  }

  if (!refundCurrencyMatches(refund, expected.currency)) {
    logRefundWebhook("STRIPE_WEBHOOK_REFUND_CURRENCY_MISMATCH", resolved);
    return;
  }

  if (refund.amount == null) {
    logRefundWebhook("STRIPE_WEBHOOK_REFUND_AMOUNT_MISMATCH", resolved);
    return;
  }

  if (refund.amount < expected.amountCents) {
    logRefundWebhook("STRIPE_WEBHOOK_PARTIAL_REFUND", {
      ...resolved,
      refundAmount: refund.amount,
      expectedAmount: expected.amountCents,
    });
    return;
  }

  if (refund.amount !== expected.amountCents) {
    logRefundWebhook("STRIPE_WEBHOOK_REFUND_AMOUNT_MISMATCH", {
      ...resolved,
      refundAmount: refund.amount,
      expectedAmount: expected.amountCents,
    });
    return;
  }

  try {
    await persistAuthoritativeRefund(db, payment, booking);
  } catch (error) {
    if (
      error instanceof PaymentRefundError &&
      error.code === "REFUND_PERSISTENCE_FAILED"
    ) {
      logRefundWebhook("STRIPE_WEBHOOK_REFUND_PERSISTENCE_FAILED", resolved);
      throw new StripeWebhookRetryError("STRIPE_WEBHOOK_REFUND_PERSISTENCE_FAILED");
    }

    throw error;
  }
}
