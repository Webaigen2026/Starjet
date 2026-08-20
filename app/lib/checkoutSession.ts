import { isUnpaidDraftExpired } from "./reservationLifecycle";
import {
  InvalidChargeError,
  resolveChargeFromBooking,
} from "./stripeMoney";
import type { PrismaClient } from "@prisma/client";

export const STRIPE_CHECKOUT_MIN_EXPIRES_SECONDS = 30 * 60;
export const STRIPE_CHECKOUT_EXPIRES_SECONDS =
  STRIPE_CHECKOUT_MIN_EXPIRES_SECONDS + 60;

export class PaymentStartError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "PaymentStartError";
    this.status = status;
  }
}

export type PaymentAttempt = {
  id: string;
  bookingId?: string;
  status: string;
  provider: string | null;
  providerRef: string | null;
  amount?: unknown;
  currency?: string;
};

export type PaymentStartBooking = {
  id: string;
  bookingCode?: string | null;
  status: string;
  paymentStatus: string;
  reservationExpiresAt: Date | string | null;
  totalAmount: unknown;
  currency: string;
  payments: PaymentAttempt[];
};

export type StripeCheckoutSessionView = {
  id: string;
  url?: string | null;
  status?: string | null;
  payment_status?: string | null;
};

export type StripeCheckoutPort = {
  checkout: {
    sessions: {
      retrieve: (id: string) => Promise<StripeCheckoutSessionView>;
      create: (
        params: Record<string, unknown>,
        options?: { idempotencyKey?: string }
      ) => Promise<StripeCheckoutSessionView>;
    };
  };
};

type PaymentStore = {
  create: (args: {
    data: {
      bookingId: string;
      amount: unknown;
      currency: string;
      status: string;
      provider: string;
      providerRef?: string | null;
    };
  }) => Promise<PaymentAttempt>;
  update: (args: {
    where: { id: string };
    data: Record<string, unknown>;
  }) => Promise<PaymentAttempt>;
  findFirst: (args: {
    where: {
      bookingId: string;
      status: string;
      provider: string;
    };
  }) => Promise<PaymentAttempt | null>;
};

export type CheckoutPaymentStore = PaymentStore & {
  establishPendingStripeAttempt: (args: {
    bookingId: string;
  }) => Promise<
    | {
        kind: "created";
        payment: PaymentAttempt;
        charge: {
          amount: unknown;
          currency: string;
          amountCents: number;
        };
      }
    | {
        kind: "existing";
        payment: PaymentAttempt;
      }
  >;
};

export const PENDING_STRIPE_UNIQUE_INDEX =
  "Payment_one_pending_stripe_attempt";

export const PAID_PER_BOOKING_UNIQUE_INDEX =
  "Payment_one_paid_per_booking";

export function isUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = (error as { code?: unknown }).code;
  return code === "P2002" || code === "23505";
}

export function isPaidPerBookingUniqueConflict(error: unknown): boolean {
  if (!isUniqueConstraintError(error)) {
    return false;
  }

  const target = (error as { meta?: { target?: unknown } }).meta?.target;

  if (Array.isArray(target)) {
    return target.includes(PAID_PER_BOOKING_UNIQUE_INDEX);
  }

  if (typeof target === "string") {
    return target.includes(PAID_PER_BOOKING_UNIQUE_INDEX);
  }

  return false;
}

export function isActivePendingStripeAttempt(payment: {
  status: string;
  provider: string | null;
}): boolean {
  return payment.status === "PENDING" && payment.provider === "STRIPE";
}

export function bookingHasPaidCapture(booking: {
  paymentStatus: string;
  payments?: Array<{ status: string }>;
}): boolean {
  if (booking.payments?.some((payment) => payment.status === "PAID")) {
    return true;
  }

  if (
    booking.payments?.some((payment) => payment.status === "REFUNDED")
  ) {
    return false;
  }

  return booking.paymentStatus === "PAID";
}

export function getCheckoutIdempotencyKey(
  bookingId: string,
  paymentId: string
): string {
  return `starjet:checkout:${bookingId}:${paymentId}`;
}

export function isReusableCheckoutSession(
  session: StripeCheckoutSessionView
): boolean {
  return (
    session.status === "open" &&
    session.payment_status === "unpaid" &&
    typeof session.url === "string" &&
    session.url.length > 0
  );
}

export function isCompletedUnpaidLocalCheckoutSession(
  session: StripeCheckoutSessionView
): boolean {
  return (
    session.payment_status === "paid" || session.status === "complete"
  );
}

export function isExpiredUnpayableCheckoutSession(
  session: StripeCheckoutSessionView
): boolean {
  return session.status === "expired" && session.payment_status !== "paid";
}

export function getPaymentStartRejection(
  booking: PaymentStartBooking,
  now: Date = new Date()
): { status: number; message: string } | null {
  if (bookingHasPaidCapture(booking)) {
    return {
      status: 409,
      message: "This booking has already been paid.",
    };
  }

  if (booking.status === "FAILED") {
    return {
      status: 409,
      message: "This reservation has expired and can no longer be paid.",
    };
  }

  if (booking.status === "CANCELLED") {
    return {
      status: 409,
      message: "Cancelled bookings cannot be paid.",
    };
  }

  if (booking.status === "CONFIRMED") {
    return {
      status: 409,
      message: "Confirmed bookings cannot start a new payment.",
    };
  }

  if (
    booking.status === "CHECKED_IN" ||
    booking.status === "BOARDED" ||
    booking.status === "COMPLETED"
  ) {
    return {
      status: 409,
      message: `Payment cannot be started from status ${booking.status}.`,
    };
  }

  if (booking.status !== "DRAFT") {
    return {
      status: 409,
      message: `Payment cannot be started from status ${booking.status}.`,
    };
  }

  if (isUnpaidDraftExpired(booking, now)) {
    return {
      status: 409,
      message: "This reservation has expired and can no longer be paid.",
    };
  }

  return null;
}

function findActivePendingStripeAttempt(
  payments: PaymentAttempt[]
): PaymentAttempt | undefined {
  return payments.find((payment) => isActivePendingStripeAttempt(payment));
}

async function inspectExistingCheckoutSession(
  stripe: StripeCheckoutPort,
  attempt: PaymentAttempt
): Promise<
  | {
      action: "reuse";
      url: string;
      sessionId: string;
      paymentId: string;
    }
  | {
      action: "replace";
    }
> {
  if (!attempt.providerRef) {
    throw new PaymentStartError(
      409,
      "A payment attempt is already being prepared. Retry shortly."
    );
  }

  let session: StripeCheckoutSessionView;

  try {
    session = await stripe.checkout.sessions.retrieve(attempt.providerRef);
  } catch {
    throw new PaymentStartError(
      502,
      "Unable to verify the existing checkout session. Please try again."
    );
  }

  if (isReusableCheckoutSession(session)) {
    return {
      action: "reuse",
      url: session.url as string,
      sessionId: session.id,
      paymentId: attempt.id,
    };
  }

  if (isCompletedUnpaidLocalCheckoutSession(session)) {
    throw new PaymentStartError(
      409,
      "A payment for this booking is already completing."
    );
  }

  if (isExpiredUnpayableCheckoutSession(session)) {
    return {
      action: "replace",
    };
  }

  throw new PaymentStartError(
    502,
    "Unable to verify the existing checkout session. Please try again."
  );
}

async function loadExistingPendingStripeAttempt(
  payments: PaymentStore,
  bookingId: string
): Promise<PaymentAttempt> {
  const winner = await payments.findFirst({
    where: {
      bookingId,
      status: "PENDING",
      provider: "STRIPE",
    },
  });

  if (!winner) {
    throw new PaymentStartError(
      409,
      "A payment attempt is already in progress. Retry shortly."
    );
  }

  return winner;
}

export function createPrismaCheckoutPaymentStore(
  prisma: PrismaClient
): CheckoutPaymentStore {
  const paymentStore = prisma.payment as unknown as PaymentStore;

  return {
    create: (args) => paymentStore.create(args),
    update: (args) => paymentStore.update(args),
    findFirst: (args) => paymentStore.findFirst(args),
    establishPendingStripeAttempt: async ({ bookingId }) => {
      try {
        return await prisma.$transaction(async (tx) => {
          const rows = await tx.$queryRaw<
            Array<{ totalAmount: unknown; currency: string }>
          >`
            SELECT "totalAmount", currency
            FROM "Booking"
            WHERE id = ${bookingId}
            FOR UPDATE
          `;

          if (rows.length === 0) {
            throw new PaymentStartError(404, "Booking not found.");
          }

          let charge;

          try {
            charge = resolveChargeFromBooking(rows[0]);
          } catch (error) {
            const message =
              error instanceof InvalidChargeError
                ? error.message
                : "Booking charge is invalid.";

            throw new PaymentStartError(400, message);
          }

          const payment = await tx.payment.create({
            data: {
              bookingId,
              amount: charge.amount as string | number,
              currency: charge.currency,
              status: "PENDING",
              provider: "STRIPE",
            },
          });

          return {
            kind: "created" as const,
            payment,
            charge,
          };
        });
      } catch (error) {
        if (error instanceof PaymentStartError) {
          throw error;
        }

        if (!isUniqueConstraintError(error)) {
          throw error;
        }

        return {
          kind: "existing" as const,
          payment: await loadExistingPendingStripeAttempt(
            paymentStore,
            bookingId
          ),
        };
      }
    },
  };
}

async function insertPendingOrLoadWinner(
  payments: CheckoutPaymentStore,
  booking: PaymentStartBooking
): Promise<
  | {
      kind: "created";
      payment: PaymentAttempt;
      charge: {
        amount: unknown;
        currency: string;
        amountCents: number;
      };
    }
  | { kind: "existing"; payment: PaymentAttempt }
> {
  return payments.establishPendingStripeAttempt({
    bookingId: booking.id,
  });
}

async function createStripeCheckoutSession(params: {
  stripe: StripeCheckoutPort;
  payments: PaymentStore;
  booking: PaymentStartBooking;
  payment: PaymentAttempt;
  charge: { amountCents: number; currency: string };
  origin: string;
  now: Date;
}): Promise<{
  url: string;
  sessionId: string;
  paymentId: string;
  reused: false;
}> {
  const expiresAt =
    Math.floor(params.now.getTime() / 1000) + STRIPE_CHECKOUT_EXPIRES_SECONDS;

  let created: StripeCheckoutSessionView;

  try {
    created = await params.stripe.checkout.sessions.create(
      {
        mode: "payment",
        success_url: `${params.origin}/checkout?bookingId=${encodeURIComponent(
          params.booking.id
        )}`,
        cancel_url: `${params.origin}/checkout?bookingId=${encodeURIComponent(
          params.booking.id
        )}`,
        expires_at: expiresAt,
        metadata: {
          bookingId: params.booking.id,
          paymentId: params.payment.id,
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: params.charge.currency.toLowerCase(),
              unit_amount: params.charge.amountCents,
              product_data: {
                name: `StarJet booking ${
                  params.booking.bookingCode || params.booking.id
                }`,
              },
            },
          },
        ],
      },
      {
        idempotencyKey: getCheckoutIdempotencyKey(
          params.booking.id,
          params.payment.id
        ),
      }
    );
  } catch {
    await params.payments.update({
      where: {
        id: params.payment.id,
      },
      data: {
        status: "FAILED",
      },
    });

    throw new PaymentStartError(
      502,
      "Unable to start checkout with Stripe."
    );
  }

  if (!created.url) {
    await params.payments.update({
      where: {
        id: params.payment.id,
      },
      data: {
        status: "FAILED",
      },
    });

    throw new PaymentStartError(
      502,
      "Stripe did not return a Checkout Session URL."
    );
  }

  await params.payments.update({
    where: {
      id: params.payment.id,
    },
    data: {
      providerRef: created.id,
    },
  });

  return {
    url: created.url,
    sessionId: created.id,
    paymentId: params.payment.id,
    reused: false,
  };
}

export async function startBookingCheckoutSession(params: {
  payments: CheckoutPaymentStore;
  stripe: StripeCheckoutPort;
  booking: PaymentStartBooking;
  origin: string;
  now?: Date;
}): Promise<{
  url: string;
  sessionId: string;
  paymentId: string;
  reused: boolean;
}> {
  const now = params.now ?? new Date();
  const rejection = getPaymentStartRejection(params.booking, now);

  if (rejection) {
    throw new PaymentStartError(rejection.status, rejection.message);
  }

  const existing = findActivePendingStripeAttempt(params.booking.payments);

  if (existing) {
    const inspected = await inspectExistingCheckoutSession(
      params.stripe,
      existing
    );

    if (inspected.action === "reuse") {
      return {
        url: inspected.url,
        sessionId: inspected.sessionId,
        paymentId: inspected.paymentId,
        reused: true,
      };
    }

    await params.payments.update({
      where: {
        id: existing.id,
      },
      data: {
        status: "FAILED",
      },
    });
  }

  const inserted = await insertPendingOrLoadWinner(
    params.payments,
    params.booking
  );

  if (inserted.kind === "existing") {
    const inspected = await inspectExistingCheckoutSession(
      params.stripe,
      inserted.payment
    );

    if (inspected.action === "reuse") {
      return {
        url: inspected.url,
        sessionId: inspected.sessionId,
        paymentId: inserted.payment.id,
        reused: true,
      };
    }

    throw new PaymentStartError(
      409,
      "A payment attempt is already in progress. Retry shortly."
    );
  }

  return createStripeCheckoutSession({
    stripe: params.stripe,
    payments: params.payments,
    booking: params.booking,
    payment: inserted.payment,
    charge: inserted.charge,
    origin: params.origin,
    now,
  });
}
