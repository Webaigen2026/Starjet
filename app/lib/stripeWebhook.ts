import { NextResponse } from "next/server";
import { claimAndReleaseInventory } from "./reservationLifecycle";
import {
  InvalidChargeError,
  normalizeCheckoutCurrency,
  toUsdCents,
} from "./stripeMoney";
import {
  isStripeRefundWebhookEvent,
  processStripeRefundEvent,
} from "./stripeRefundWebhook";

export const STRIPE_WEBHOOK_SUCCESS_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
] as const;

export const STRIPE_WEBHOOK_FAILURE_EVENTS = [
  "checkout.session.async_payment_failed",
] as const;

export const STRIPE_WEBHOOK_EXPIRED_EVENTS = [
  "checkout.session.expired",
] as const;

export const STRIPE_WEBHOOK_REFUND_EVENTS = [
  "refund.created",
  "refund.updated",
  "refund.failed",
] as const;

export const STRIPE_WEBHOOK_HANDLED_EVENTS = [
  ...STRIPE_WEBHOOK_SUCCESS_EVENTS,
  ...STRIPE_WEBHOOK_FAILURE_EVENTS,
  ...STRIPE_WEBHOOK_EXPIRED_EVENTS,
  ...STRIPE_WEBHOOK_REFUND_EVENTS,
] as const;

type HandledStripeEvent = (typeof STRIPE_WEBHOOK_HANDLED_EVENTS)[number];

export type StripeCheckoutSessionLike = {
  id: string;
  object?: string | null;
  mode?: string | null;
  payment_status?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  metadata?: Record<string, string> | null;
  payment_intent?: unknown;
};

export type StripeEventLike = {
  id?: string;
  type: string;
  data: {
    object: unknown;
  };
};

export type WebhookPaymentRow = {
  id: string;
  bookingId: string;
  status: string;
  providerRef: string | null;
  stripePaymentIntentId?: string | null;
  amount: unknown;
  currency: string;
};

export type WebhookBookingRow = {
  id: string;
  status: string;
  paymentStatus: string;
  reservationExpiresAt: Date | string | null;
  totalAmount: unknown;
  currency: string;
  scheduleId: string;
  passengersCount: number;
};

export type StripeWebhookTx = {
  payment: {
    findUnique: (args: {
      where: { id?: string; providerRef?: string };
    }) => Promise<WebhookPaymentRow | null>;
    updateMany: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<{ count: number }>;
  };
  booking: {
    findUnique: (args: {
      where: { id: string };
    }) => Promise<WebhookBookingRow | null>;
    updateMany: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<{ count: number }>;
  };
  seat: {
    updateMany: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<{ count: number }>;
  };
  flightSchedule: {
    findUnique: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
  };
};

export type StripeWebhookStore = {
  payment: {
    findUnique: (args: {
      where: { providerRef?: string; stripePaymentIntentId?: string };
      include?: { booking?: boolean };
    }) => Promise<(WebhookPaymentRow & { booking: WebhookBookingRow }) | null>;
  };
  $transaction: <T>(fn: (tx: StripeWebhookTx) => Promise<T>) => Promise<T>;
};

export type StripeWebhookRequestDeps = {
  getWebhookSecret: () => string | null;
  constructEvent: (
    payload: string,
    signature: string,
    secret: string
  ) => StripeEventLike;
  processEvent: (event: StripeEventLike) => Promise<void>;
};

export function isHandledStripeEvent(
  type: string
): type is HandledStripeEvent {
  return (STRIPE_WEBHOOK_HANDLED_EVENTS as readonly string[]).includes(type);
}

export function isReservationHoldOpen(
  reservationExpiresAt: Date | string | null,
  now: Date = new Date()
): boolean {
  if (!reservationExpiresAt) {
    return true;
  }

  const expiresAt = new Date(reservationExpiresAt);

  if (Number.isNaN(expiresAt.getTime())) {
    return true;
  }

  return expiresAt.getTime() > now.getTime();
}

export function confirmableDraftWhere(
  bookingId: string,
  now: Date
): Record<string, unknown> {
  return {
    id: bookingId,
    status: "DRAFT",
    OR: [
      {
        reservationExpiresAt: null,
      },
      {
        reservationExpiresAt: {
          gt: now,
        },
      },
    ],
  };
}

export function expiredDraftWhere(
  bookingId: string,
  now: Date
): Record<string, unknown> {
  return {
    id: bookingId,
    status: "DRAFT",
    reservationExpiresAt: {
      lte: now,
    },
  };
}

export function isValidStripePaymentIntentId(value: string): boolean {
  return /^pi_[A-Za-z0-9]+$/.test(value);
}

export function extractCheckoutPaymentIntentId(
  session: StripeCheckoutSessionLike
): string | null {
  const value = session.payment_intent;

  if (typeof value === "string") {
    const trimmed = value.trim();
    return isValidStripePaymentIntentId(trimmed) ? trimmed : null;
  }

  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;

    if (typeof id === "string") {
      const trimmed = id.trim();
      return isValidStripePaymentIntentId(trimmed) ? trimmed : null;
    }
  }

  return null;
}

export function asCheckoutSession(
  value: unknown
): StripeCheckoutSessionLike | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const session = value as StripeCheckoutSessionLike;

  if (typeof session.id !== "string" || !session.id) {
    return null;
  }

  return session;
}

export function sessionMetadataConflictsWithPayment(
  session: StripeCheckoutSessionLike,
  payment: WebhookPaymentRow
): boolean {
  const metadata = session.metadata ?? {};
  const paymentId = metadata.paymentId;
  const bookingId = metadata.bookingId;

  if (typeof paymentId === "string" && paymentId && paymentId !== payment.id) {
    return true;
  }

  if (
    typeof bookingId === "string" &&
    bookingId &&
    bookingId !== payment.bookingId
  ) {
    return true;
  }

  return false;
}

export function sessionMatchesAuthoritativeCharge(
  session: StripeCheckoutSessionLike,
  payment: WebhookPaymentRow,
  booking: WebhookBookingRow
): boolean {
  try {
    if (typeof session.amount_total !== "number") {
      return false;
    }

    const paymentCents = toUsdCents(payment.amount);
    const bookingCents = toUsdCents(booking.totalAmount);

    if (
      session.amount_total !== paymentCents ||
      session.amount_total !== bookingCents
    ) {
      return false;
    }

    const sessionCurrency = normalizeCheckoutCurrency(session.currency);
    const paymentCurrency = normalizeCheckoutCurrency(payment.currency);
    const bookingCurrency = normalizeCheckoutCurrency(booking.currency);

    return (
      sessionCurrency === paymentCurrency &&
      sessionCurrency === bookingCurrency
    );
  } catch (error) {
    if (error instanceof InvalidChargeError) {
      return false;
    }

    throw error;
  }
}

function isPaidPaymentSession(session: StripeCheckoutSessionLike): boolean {
  return session.mode === "payment" && session.payment_status === "paid";
}

export class StripeWebhookRetryError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.name = "StripeWebhookRetryError";
    this.code = code;
  }
}

function logWebhookIntegrity(code: string, details: Record<string, unknown>) {
  console.error(code, details);
}

function failPaidCaptureForRetry(
  code: string,
  details: Record<string, unknown>
): never {
  logWebhookIntegrity(code, details);
  throw new StripeWebhookRetryError(code);
}

async function markExactPaymentPaid(
  tx: StripeWebhookTx,
  payment: WebhookPaymentRow,
  sessionId: string,
  paymentIntentId: string
) {
  const captured = await tx.payment.updateMany({
    where: {
      id: payment.id,
      providerRef: sessionId,
      status: {
        in: ["PENDING", "FAILED"],
      },
    },
    data: {
      status: "PAID",
      stripePaymentIntentId: paymentIntentId,
    },
  });

  if (captured.count === 1) {
    return;
  }

  await tx.payment.updateMany({
    where: {
      id: payment.id,
      providerRef: sessionId,
      status: "PAID",
      stripePaymentIntentId: null,
    },
    data: {
      stripePaymentIntentId: paymentIntentId,
    },
  });
}

async function markExactPaymentFailed(
  tx: StripeWebhookTx,
  payment: WebhookPaymentRow,
  sessionId: string
) {
  await tx.payment.updateMany({
    where: {
      id: payment.id,
      providerRef: sessionId,
      status: "PENDING",
    },
    data: {
      status: "FAILED",
    },
  });
}

async function markTerminalBookingCaptured(
  tx: StripeWebhookTx,
  bookingId: string
) {
  await tx.booking.updateMany({
    where: {
      id: bookingId,
      status: {
        in: ["FAILED", "CANCELLED", "CONFIRMED", "CHECKED_IN", "BOARDED", "COMPLETED"],
      },
    },
    data: {
      paymentStatus: "PAID",
    },
  });
}

async function convertReservedSeatsToBooked(
  tx: StripeWebhookTx,
  bookingId: string
) {
  await tx.seat.updateMany({
    where: {
      bookingId,
      status: "RESERVED",
    },
    data: {
      status: "BOOKED",
    },
  });
}

async function failUnfulfillableDraft(
  tx: StripeWebhookTx,
  booking: WebhookBookingRow,
  fromWhere: Record<string, unknown>
) {
  const result = await claimAndReleaseInventory(tx as never, {
    bookingId: booking.id,
    scheduleId: booking.scheduleId,
    passengersCount: booking.passengersCount,
    fromWhere: fromWhere as never,
    toStatus: "FAILED",
    extraData: {
      paymentStatus: "PAID",
    },
  });

  if (result === "lost") {
    await markTerminalBookingCaptured(tx, booking.id);
  }
}

async function applyVerifiedPaidSession(
  tx: StripeWebhookTx,
  payment: WebhookPaymentRow,
  booking: WebhookBookingRow,
  session: StripeCheckoutSessionLike,
  now: Date,
  options: {
    fulfillable: boolean;
    paymentIntentId: string;
  }
) {
  await markExactPaymentPaid(
    tx,
    payment,
    session.id,
    options.paymentIntentId
  );

  const current =
    (await tx.booking.findUnique({
      where: {
        id: booking.id,
      },
    })) ?? booking;

  if (!options.fulfillable) {
    if (current.status === "DRAFT") {
      await failUnfulfillableDraft(tx, current, {
        id: current.id,
        status: "DRAFT",
      });
    } else {
      await markTerminalBookingCaptured(tx, current.id);
    }

    return;
  }

  const confirmed = await tx.booking.updateMany({
    where: confirmableDraftWhere(current.id, now),
    data: {
      status: "CONFIRMED",
      paymentStatus: "PAID",
    },
  });

  if (confirmed.count === 1) {
    await convertReservedSeatsToBooked(tx, current.id);
    return;
  }

  const afterConfirm = await tx.booking.findUnique({
    where: {
      id: current.id,
    },
  });

  if (!afterConfirm) {
    return;
  }

  if (afterConfirm.status === "DRAFT") {
    await failUnfulfillableDraft(
      tx,
      afterConfirm,
      expiredDraftWhere(afterConfirm.id, now)
    );
    return;
  }

  await markTerminalBookingCaptured(tx, afterConfirm.id);
}

async function processPaidCheckoutSession(
  db: StripeWebhookStore,
  session: StripeCheckoutSessionLike,
  now: Date
) {
  if (!isPaidPaymentSession(session)) {
    return;
  }

  const paymentWithBooking = await db.payment.findUnique({
    where: {
      providerRef: session.id,
    },
    include: {
      booking: true,
    },
  });

  if (!paymentWithBooking?.booking) {
    logWebhookIntegrity("STRIPE_WEBHOOK_UNKNOWN_PROVIDER_REF", {
      sessionId: session.id,
    });
    return;
  }

  const { booking, ...payment } = paymentWithBooking;
  const paymentIntentId = extractCheckoutPaymentIntentId(session);

  if (!paymentIntentId) {
    failPaidCaptureForRetry("STRIPE_WEBHOOK_MISSING_PAYMENT_INTENT", {
      sessionId: session.id,
      paymentId: payment.id,
      bookingId: payment.bookingId,
    });
  }

  const metadataConflict = sessionMetadataConflictsWithPayment(
    session,
    payment
  );
  const chargeMatches = sessionMatchesAuthoritativeCharge(
    session,
    payment,
    booking
  );

  if (metadataConflict) {
    logWebhookIntegrity("STRIPE_WEBHOOK_METADATA_MISMATCH", {
      sessionId: session.id,
      paymentId: payment.id,
      bookingId: payment.bookingId,
    });
  } else if (!chargeMatches) {
    logWebhookIntegrity("STRIPE_WEBHOOK_AMOUNT_CURRENCY_MISMATCH", {
      sessionId: session.id,
      paymentId: payment.id,
      bookingId: payment.bookingId,
    });
  }

  const fulfillable = !metadataConflict && chargeMatches;

  await db.$transaction(async (tx) => {
    const lockedPayment = await tx.payment.findUnique({
      where: {
        id: payment.id,
      },
    });

    if (
      !lockedPayment ||
      lockedPayment.providerRef !== session.id ||
      lockedPayment.bookingId !== payment.bookingId
    ) {
      return;
    }

    if (
      lockedPayment.stripePaymentIntentId &&
      lockedPayment.stripePaymentIntentId !== paymentIntentId
    ) {
      failPaidCaptureForRetry("STRIPE_WEBHOOK_PAYMENT_INTENT_CONFLICT", {
        sessionId: session.id,
        paymentId: lockedPayment.id,
        bookingId: lockedPayment.bookingId,
      });
    }

    const lockedBooking = await tx.booking.findUnique({
      where: {
        id: booking.id,
      },
    });

    if (!lockedBooking) {
      return;
    }

    await applyVerifiedPaidSession(
      tx,
      lockedPayment,
      lockedBooking,
      session,
      now,
      {
        fulfillable,
        paymentIntentId,
      }
    );
  });
}

async function processAbandonedCheckoutSession(
  db: StripeWebhookStore,
  session: StripeCheckoutSessionLike
) {
  const paymentWithBooking = await db.payment.findUnique({
    where: {
      providerRef: session.id,
    },
    include: {
      booking: true,
    },
  });

  if (!paymentWithBooking) {
    logWebhookIntegrity("STRIPE_WEBHOOK_UNKNOWN_PROVIDER_REF", {
      sessionId: session.id,
    });
    return;
  }

  await db.$transaction(async (tx) => {
    await markExactPaymentFailed(tx, paymentWithBooking, session.id);
  });
}

export async function processStripeWebhookEvent(
  db: StripeWebhookStore,
  event: StripeEventLike,
  now: Date = new Date()
): Promise<void> {
  if (!isHandledStripeEvent(event.type)) {
    return;
  }

  if (isStripeRefundWebhookEvent(event.type)) {
    await processStripeRefundEvent(db, event);
    return;
  }

  const session = asCheckoutSession(event.data.object);

  if (!session) {
    return;
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    if (event.type === "checkout.session.completed") {
      if (session.payment_status !== "paid") {
        return;
      }
    }

    await processPaidCheckoutSession(db, session, now);
    return;
  }

  if (
    event.type === "checkout.session.async_payment_failed" ||
    event.type === "checkout.session.expired"
  ) {
    await processAbandonedCheckoutSession(db, session);
  }
}

export async function handleStripeWebhookRequest(
  request: Request,
  deps: StripeWebhookRequestDeps
): Promise<Response> {
  const secret = deps.getWebhookSecret();

  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET_MISSING");
    return NextResponse.json(
      {
        error: "Webhook is not configured.",
      },
      {
        status: 500,
      }
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      {
        error: "Missing Stripe signature.",
      },
      {
        status: 400,
      }
    );
  }

  const rawBody = await request.text();

  let event: StripeEventLike;

  try {
    event = deps.constructEvent(rawBody, signature, secret);
  } catch {
    return NextResponse.json(
      {
        error: "Invalid Stripe signature.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    await deps.processEvent(event);
  } catch {
    console.error("STRIPE_WEBHOOK_PROCESSING_FAILED", {
      type: event.type,
    });

    return NextResponse.json(
      {
        error: "Webhook handler failed.",
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json(
    {
      received: true,
    },
    {
      status: 200,
    }
  );
}
