import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { authorizeBookingAccess } from "./authorization";
import {
  bookingHasPaidCapture,
  getCheckoutIdempotencyKey,
  getPaymentStartRejection,
  isExpiredUnpayableCheckoutSession,
  isReusableCheckoutSession,
  isUniqueConstraintError,
  isPaidPerBookingUniqueConflict,
  PaymentStartError,
  PAID_PER_BOOKING_UNIQUE_INDEX,
  PENDING_STRIPE_UNIQUE_INDEX,
  startBookingCheckoutSession,
  type PaymentAttempt,
  type PaymentStartBooking,
  type StripeCheckoutSessionView,
} from "./checkoutSession";
import {
  resolveChargeFromBooking,
  toUsdCents,
} from "./stripeMoney";

const root = path.join(import.meta.dirname, "..", "..");

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function draftBooking(
  overrides: Partial<PaymentStartBooking> = {}
): PaymentStartBooking {
  return {
    id: "booking-1",
    bookingCode: "BK123",
    status: "DRAFT",
    paymentStatus: "PENDING",
    reservationExpiresAt: new Date("2026-08-17T21:20:00.000Z"),
    totalAmount: "123.45",
    currency: "USD",
    payments: [],
    ...overrides,
  };
}

describe("checkout authorization boundaries", () => {
  it("wrong owner cannot start payment", () => {
    const access = authorizeBookingAccess(
      { id: "user-2", role: "CUSTOMER" },
      { userId: "user-1" }
    );

    assert.equal(access.authorized, false);
  });

  it("userId:null cannot be claimed by email", () => {
    const access = authorizeBookingAccess(
      {
        id: "user-1",
        role: "CUSTOMER",
        email: "guest@example.com",
      } as { id?: string; role?: "CUSTOMER" },
      { userId: null }
    );

    assert.equal(access.authorized, false);
  });
});

describe("checkout eligibility", () => {
  const now = new Date("2026-08-17T21:16:00.000Z");

  it("rejects an expired DRAFT booking", () => {
    const rejection = getPaymentStartRejection(
      draftBooking({
        reservationExpiresAt: new Date("2026-08-17T21:00:00.000Z"),
      }),
      now
    );

    assert.equal(rejection?.status, 409);
  });

  it("rejects FAILED bookings", () => {
    const rejection = getPaymentStartRejection(
      draftBooking({ status: "FAILED" }),
      now
    );

    assert.equal(rejection?.status, 409);
  });

  it("rejects CANCELLED bookings", () => {
    const rejection = getPaymentStartRejection(
      draftBooking({ status: "CANCELLED" }),
      now
    );

    assert.equal(rejection?.status, 409);
  });

  it("rejects CONFIRMED bookings", () => {
    const rejection = getPaymentStartRejection(
      draftBooking({ status: "CONFIRMED" }),
      now
    );

    assert.equal(rejection?.status, 409);
  });

  it("rejects already-paid bookings", () => {
    const rejection = getPaymentStartRejection(
      draftBooking({
        paymentStatus: "PAID",
        payments: [
          {
            id: "pay-paid",
            status: "PAID",
            provider: "STRIPE",
            providerRef: "cs_paid",
          },
        ],
      }),
      now
    );

    assert.equal(rejection?.status, 409);
  });

  it("rejects when a PAID Payment row already exists", () => {
    const rejection = getPaymentStartRejection(
      draftBooking({
        payments: [
          {
            id: "pay-paid",
            status: "PAID",
            provider: "STRIPE",
            providerRef: "cs_paid",
          },
        ],
      }),
      now
    );

    assert.equal(rejection?.status, 409);
  });
});

describe("pricing authority", () => {
  it("uses Booking.totalAmount and Booking.currency", () => {
    const charge = resolveChargeFromBooking({
      totalAmount: "123.45",
      currency: "USD",
    });

    assert.equal(charge.amount, "123.45");
    assert.equal(charge.currency, "USD");
    assert.equal(charge.amountCents, 12345);
  });

  it("ignores a request amount override", () => {
    const charge = resolveChargeFromBooking(
      {
        totalAmount: "80.00",
        currency: "USD",
      },
      {
        amount: 1,
        totalAmount: "1.00",
      }
    );

    assert.equal(charge.amount, "80.00");
    assert.equal(charge.amountCents, 8000);
  });

  it("ignores a request currency override", () => {
    const charge = resolveChargeFromBooking(
      {
        totalAmount: "80.00",
        currency: "USD",
      },
      {
        currency: "EUR",
      }
    );

    assert.equal(charge.currency, "USD");
  });

  it("converts Decimal USD amounts to cents exactly", () => {
    assert.equal(toUsdCents("123.45"), 12345);
    assert.equal(toUsdCents("0.01"), 1);
    assert.equal(toUsdCents("100"), 10000);
    assert.equal(toUsdCents("123.45000"), 12345);
  });
});

describe("startBookingCheckoutSession", () => {
  const now = new Date("2026-08-17T21:10:00.000Z");

  function createPayments(
    initial: PaymentAttempt[] = [],
    bookingCharge: { totalAmount: string; currency: string } = {
      totalAmount: "123.45",
      currency: "USD",
    }
  ) {
    const rows = [...initial];
    const booking = { ...bookingCharge };
    const writes: Array<{ op: string; data: Record<string, unknown> }> = [];
    let created = 0;
    let transactionActive = false;

    function uniqueError() {
      return Object.assign(new Error("Unique constraint failed"), {
        code: "P2002",
        meta: {
          target: [PENDING_STRIPE_UNIQUE_INDEX],
        },
      });
    }

    const store = {
      create: async ({
        data,
      }: {
        data: {
          bookingId: string;
          amount: unknown;
          currency: string;
          status: string;
          provider: string;
        };
      }) => {
        const pendingExists = rows.some(
          (payment) =>
            payment.status === "PENDING" &&
            payment.provider === "STRIPE" &&
            payment.bookingId === data.bookingId
        );

        if (
          pendingExists &&
          data.status === "PENDING" &&
          data.provider === "STRIPE"
        ) {
          throw uniqueError();
        }

        created += 1;
        const row: PaymentAttempt = {
          id: `pay-${created}`,
          bookingId: data.bookingId,
          status: data.status,
          provider: data.provider,
          providerRef: null,
          amount: data.amount,
          currency: data.currency,
        };

        assert.equal(data.status, "PENDING");
        writes.push({ op: "create", data: { ...data } });
        rows.push(row);
        return row;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        assert.notEqual(data.status, "PAID");
        writes.push({ op: "update", data });

        const row = rows.find((payment) => payment.id === where.id);

        assert.ok(row);
        Object.assign(row, data);
        return row;
      },
      findFirst: async ({
        where,
      }: {
        where: { bookingId: string; status: string; provider: string };
      }) => {
        return (
          rows.find(
            (payment) =>
              payment.bookingId === where.bookingId &&
              payment.status === where.status &&
              payment.provider === where.provider
          ) ?? null
        );
      },
      establishPendingStripeAttempt: async ({
        bookingId,
      }: {
        bookingId: string;
      }) => {
        transactionActive = true;

        try {
          const charge = resolveChargeFromBooking(booking);

          try {
            const payment = await store.create({
              data: {
                bookingId,
                amount: charge.amount,
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
          } catch (error) {
            if (!isUniqueConstraintError(error)) {
              throw error;
            }

            const winner = await store.findFirst({
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

            return {
              kind: "existing" as const,
              payment: winner,
            };
          }
        } finally {
          transactionActive = false;
        }
      },
    };

    return {
      rows,
      writes,
      booking,
      get transactionActive() {
        return transactionActive;
      },
      setBookingTotal(totalAmount: string) {
        booking.totalAmount = totalAmount;
      },
      store,
    };
  }

  function createStripe(session: StripeCheckoutSessionView) {
    let created = 0;
    const retrieves: string[] = [];
    const creates: Array<{
      params: Record<string, unknown>;
      options?: { idempotencyKey?: string };
    }> = [];

    return {
      retrieves,
      creates,
      createdCount: () => created,
      checkout: {
        sessions: {
          retrieve: async (id: string) => {
            retrieves.push(id);
            return session;
          },
          create: async (
            params: Record<string, unknown>,
            options?: { idempotencyKey?: string }
          ) => {
            created += 1;
            creates.push({ params, options });
            return {
              id: "cs_new",
              url: "https://checkout.stripe.test/cs_new",
              status: "open",
              payment_status: "unpaid",
            };
          },
        },
      },
    };
  }

  it("creates a PENDING payment and does not mark money successful", async () => {
    const payments = createPayments();
    const stripe = createStripe({
      id: "cs_open",
      url: "https://checkout.stripe.test/cs_open",
      status: "open",
      payment_status: "unpaid",
    });

    const result = await startBookingCheckoutSession({
      payments: payments.store,
      stripe,
      booking: draftBooking(),
      origin: "http://localhost:3000",
      now,
    });

    assert.equal(result.reused, false);
    assert.equal(result.sessionId, "cs_new");
    assert.equal(payments.rows[0]?.status, "PENDING");
    assert.equal(payments.rows[0]?.providerRef, "cs_new");
    assert.equal(payments.rows[0]?.amount, "123.45");
    assert.equal(payments.rows[0]?.currency, "USD");

    const lineItems = stripe.creates[0]?.params.line_items as Array<{
      price_data: { unit_amount: number; currency: string };
    }>;
    assert.equal(lineItems[0]?.price_data.unit_amount, 12345);
    assert.equal(lineItems[0]?.price_data.currency, "usd");
    assert.equal(
      stripe.creates[0]?.options?.idempotencyKey,
      getCheckoutIdempotencyKey("booking-1", "pay-1")
    );

    assert.equal(
      payments.writes.some((write) => write.data.status === "PAID"),
      false
    );
    assert.equal(
      JSON.stringify(payments.writes).includes("CONFIRMED"),
      false
    );
  });

  it("reuses a still-open unpaid Stripe session", async () => {
    const pending: PaymentAttempt = {
      id: "pay-existing",
      bookingId: "booking-1",
      status: "PENDING",
      provider: "STRIPE",
      providerRef: "cs_open",
    };
    const payments = createPayments([pending]);
    const stripe = createStripe({
      id: "cs_open",
      url: "https://checkout.stripe.test/cs_open",
      status: "open",
      payment_status: "unpaid",
    });

    const result = await startBookingCheckoutSession({
      payments: payments.store,
      stripe,
      booking: draftBooking({ payments: [pending] }),
      origin: "http://localhost:3000",
      now,
    });

    assert.equal(result.reused, true);
    assert.equal(result.sessionId, "cs_open");
    assert.equal(result.url, "https://checkout.stripe.test/cs_open");
    assert.equal(stripe.createdCount(), 0);
    assert.equal(payments.rows.length, 1);
    assert.equal(payments.rows[0]?.status, "PENDING");
    assert.equal(payments.rows[0]?.providerRef, "cs_open");
  });

  it("does not mark Payment FAILED or create a replacement when retrieve throws", async () => {
    const pending: PaymentAttempt = {
      id: "pay-existing",
      bookingId: "booking-1",
      status: "PENDING",
      provider: "STRIPE",
      providerRef: "cs_open",
    };
    const payments = createPayments([pending]);
    const stripe = createStripe({
      id: "cs_open",
      url: "https://checkout.stripe.test/cs_open",
      status: "open",
      payment_status: "unpaid",
    });

    stripe.checkout.sessions.retrieve = async () => {
      throw new Error("stripe retrieve timeout");
    };

    await assert.rejects(
      () =>
        startBookingCheckoutSession({
          payments: payments.store,
          stripe,
          booking: draftBooking({ payments: [pending] }),
          origin: "http://localhost:3000",
          now,
        }),
      (error: unknown) => {
        assert.equal(error instanceof PaymentStartError, true);
        assert.equal((error as PaymentStartError).status, 502);
        return true;
      }
    );

    assert.equal(payments.rows.length, 1);
    assert.equal(payments.rows[0]?.id, "pay-existing");
    assert.equal(payments.rows[0]?.status, "PENDING");
    assert.equal(payments.rows[0]?.providerRef, "cs_open");
    assert.equal(stripe.createdCount(), 0);
    assert.equal(
      payments.writes.some((write) => write.data.status === "FAILED"),
      false
    );
    assert.equal(
      payments.writes.some((write) => write.data.status === "PAID"),
      false
    );
  });

  it("cannot create competing attempts while retrieve failure remains unresolved", async () => {
    const pending: PaymentAttempt = {
      id: "pay-existing",
      bookingId: "booking-1",
      status: "PENDING",
      provider: "STRIPE",
      providerRef: "cs_open",
    };
    const payments = createPayments([pending]);
    const stripe = createStripe({
      id: "cs_open",
      url: "https://checkout.stripe.test/cs_open",
      status: "open",
      payment_status: "unpaid",
    });

    stripe.checkout.sessions.retrieve = async () => {
      throw new Error("stripe retrieve timeout");
    };

    const results = await Promise.allSettled([
      startBookingCheckoutSession({
        payments: payments.store,
        stripe,
        booking: draftBooking({ payments: [pending] }),
        origin: "http://localhost:3000",
        now,
      }),
      startBookingCheckoutSession({
        payments: payments.store,
        stripe,
        booking: draftBooking({ payments: [pending] }),
        origin: "http://localhost:3000",
        now,
      }),
    ]);

    assert.equal(
      results.every(
        (result) =>
          result.status === "rejected" &&
          result.reason instanceof PaymentStartError &&
          result.reason.status === 502
      ),
      true
    );
    assert.equal(payments.rows.length, 1);
    assert.equal(payments.rows[0]?.status, "PENDING");
    assert.equal(payments.rows[0]?.providerRef, "cs_open");
    assert.equal(stripe.createdCount(), 0);
  });

  it("does not create a replacement or fabricate PAID for a complete/paid session", async () => {
    const pending: PaymentAttempt = {
      id: "pay-existing",
      bookingId: "booking-1",
      status: "PENDING",
      provider: "STRIPE",
      providerRef: "cs_paid",
    };
    const payments = createPayments([pending]);
    const stripe = createStripe({
      id: "cs_paid",
      url: "https://checkout.stripe.test/cs_paid",
      status: "complete",
      payment_status: "paid",
    });

    await assert.rejects(
      () =>
        startBookingCheckoutSession({
          payments: payments.store,
          stripe,
          booking: draftBooking({ payments: [pending] }),
          origin: "http://localhost:3000",
          now,
        }),
      (error: unknown) => {
        assert.equal(error instanceof PaymentStartError, true);
        assert.equal((error as PaymentStartError).status, 409);
        assert.equal(
          (error as PaymentStartError).message,
          "A payment for this booking is already completing."
        );
        return true;
      }
    );

    assert.equal(payments.rows.length, 1);
    assert.equal(payments.rows[0]?.status, "PENDING");
    assert.equal(payments.rows[0]?.providerRef, "cs_paid");
    assert.equal(stripe.createdCount(), 0);
    assert.equal(
      payments.writes.some((write) => write.data.status === "PAID"),
      false
    );
    assert.equal(
      payments.writes.some((write) => write.data.status === "FAILED"),
      false
    );
  });

  it("does not reuse an expired Stripe session and allows a new PENDING attempt", async () => {
    const pending: PaymentAttempt = {
      id: "pay-old",
      bookingId: "booking-1",
      status: "PENDING",
      provider: "STRIPE",
      providerRef: "cs_expired",
    };
    const payments = createPayments([pending]);
    const stripe = createStripe({
      id: "cs_expired",
      url: null,
      status: "expired",
      payment_status: "unpaid",
    });

    const result = await startBookingCheckoutSession({
      payments: payments.store,
      stripe,
      booking: draftBooking({ payments: [pending] }),
      origin: "http://localhost:3000",
      now,
    });

    assert.equal(
      isExpiredUnpayableCheckoutSession({
        id: "cs_expired",
        status: "expired",
        payment_status: "unpaid",
      }),
      true
    );
    assert.equal(isReusableCheckoutSession({
      id: "cs_expired",
      status: "expired",
      payment_status: "unpaid",
    }), false);
    assert.equal(result.reused, false);
    assert.equal(result.sessionId, "cs_new");
    assert.equal(payments.rows[0]?.status, "FAILED");
    assert.equal(payments.rows[1]?.status, "PENDING");
    assert.equal(payments.rows[1]?.providerRef, "cs_new");
  });

  it("does not return 500 when a unique PENDING race is lost", async () => {
    const winner: PaymentAttempt = {
      id: "pay-winner",
      bookingId: "booking-1",
      status: "PENDING",
      provider: "STRIPE",
      providerRef: "cs_open",
    };
    const payments = createPayments([winner]);
    const stripe = createStripe({
      id: "cs_open",
      url: "https://checkout.stripe.test/cs_open",
      status: "open",
      payment_status: "unpaid",
    });

    const result = await startBookingCheckoutSession({
      payments: payments.store,
      stripe,
      booking: draftBooking({ payments: [] }),
      origin: "http://localhost:3000",
      now,
    });

    assert.equal(result.reused, true);
    assert.equal(result.sessionId, "cs_open");
    assert.equal(stripe.createdCount(), 0);
  });

  it("does not create a second Stripe Session after losing the unique race", async () => {
    const winner: PaymentAttempt = {
      id: "pay-winner",
      bookingId: "booking-1",
      status: "PENDING",
      provider: "STRIPE",
      providerRef: "cs_open",
    };
    const payments = createPayments([winner]);
    const stripe = createStripe({
      id: "cs_open",
      url: "https://checkout.stripe.test/cs_open",
      status: "open",
      payment_status: "unpaid",
    });

    await startBookingCheckoutSession({
      payments: payments.store,
      stripe,
      booking: draftBooking({ payments: [] }),
      origin: "http://localhost:3000",
      now,
    });

    assert.equal(
      payments.rows.filter((payment) => payment.status === "PENDING").length,
      1
    );
    assert.equal(stripe.createdCount(), 0);
  });

  it("handles a PENDING attempt that still has providerRef = null", async () => {
    const initializing: PaymentAttempt = {
      id: "pay-init",
      bookingId: "booking-1",
      status: "PENDING",
      provider: "STRIPE",
      providerRef: null,
    };
    const payments = createPayments([initializing]);
    const stripe = createStripe({
      id: "cs_open",
      url: "https://checkout.stripe.test/cs_open",
      status: "open",
      payment_status: "unpaid",
    });

    await assert.rejects(
      () =>
        startBookingCheckoutSession({
          payments: payments.store,
          stripe,
          booking: draftBooking({ payments: [initializing] }),
          origin: "http://localhost:3000",
          now,
        }),
      (error: unknown) => {
        assert.equal(error instanceof PaymentStartError, true);
        assert.equal((error as PaymentStartError).status, 409);
        return true;
      }
    );

    assert.equal(stripe.createdCount(), 0);
    assert.equal(payments.rows[0]?.status, "PENDING");
    assert.equal(payments.rows[0]?.providerRef, null);
  });

  it("fails a PENDING attempt if Stripe Session creation throws", async () => {
    const payments = createPayments();
    const stripe = createStripe({
      id: "cs_open",
      url: "https://checkout.stripe.test/cs_open",
      status: "open",
      payment_status: "unpaid",
    });

    stripe.checkout.sessions.create = async () => {
      throw new Error("stripe down");
    };

    await assert.rejects(
      () =>
        startBookingCheckoutSession({
          payments: payments.store,
          stripe,
          booking: draftBooking(),
          origin: "http://localhost:3000",
          now,
        }),
      (error: unknown) => {
        assert.equal(error instanceof PaymentStartError, true);
        assert.equal((error as PaymentStartError).status, 502);
        return true;
      }
    );

    assert.equal(payments.rows[0]?.status, "FAILED");
    assert.equal(payments.rows[0]?.providerRef, null);
  });

  it("persists Payment.amount from the authoritative booking read inside establishment", async () => {
    const payments = createPayments([], {
      totalAmount: "100.00",
      currency: "USD",
    });
    payments.setBookingTotal("149.98");
    const stripe = createStripe({
      id: "cs_open",
      url: "https://checkout.stripe.test/cs_open",
      status: "open",
      payment_status: "unpaid",
    });

    const result = await startBookingCheckoutSession({
      payments: payments.store,
      stripe,
      booking: draftBooking({ totalAmount: "100.00" }),
      origin: "http://localhost:3000",
      now,
    });

    assert.equal(result.reused, false);
    assert.equal(payments.rows[0]?.amount, "149.98");

    const lineItems = stripe.creates[0]?.params.line_items as Array<{
      price_data: { unit_amount: number };
    }>;
    assert.equal(lineItems[0]?.price_data.unit_amount, 14998);
  });

  it("does not call Stripe while the payment-establishment transaction is active", async () => {
    const payments = createPayments();
    let stripeCalledDuringTransaction = false;

    const stripe = createStripe({
      id: "cs_open",
      url: "https://checkout.stripe.test/cs_open",
      status: "open",
      payment_status: "unpaid",
    });

    const originalCreate = stripe.checkout.sessions.create;
    stripe.checkout.sessions.create = async (...args) => {
      if (payments.transactionActive) {
        stripeCalledDuringTransaction = true;
      }

      return originalCreate(...args);
    };

    await startBookingCheckoutSession({
      payments: payments.store,
      stripe,
      booking: draftBooking(),
      origin: "http://localhost:3000",
      now,
    });

    assert.equal(stripeCalledDuringTransaction, false);
    assert.equal(payments.transactionActive, false);
  });

  it("allows a new PENDING attempt after a failed Stripe Session create", async () => {
    const payments = createPayments();
    const failingStripe = createStripe({
      id: "cs_open",
      url: "https://checkout.stripe.test/cs_open",
      status: "open",
      payment_status: "unpaid",
    });
    failingStripe.checkout.sessions.create = async () => {
      throw new Error("stripe down");
    };

    await assert.rejects(() =>
      startBookingCheckoutSession({
        payments: payments.store,
        stripe: failingStripe,
        booking: draftBooking(),
        origin: "http://localhost:3000",
        now,
      })
    );

    const stripe = createStripe({
      id: "cs_new",
      url: "https://checkout.stripe.test/cs_new",
      status: "open",
      payment_status: "unpaid",
    });

    const result = await startBookingCheckoutSession({
      payments: payments.store,
      stripe,
      booking: draftBooking({ payments: [...payments.rows] }),
      origin: "http://localhost:3000",
      now,
    });

    assert.equal(result.reused, false);
    assert.equal(payments.rows[0]?.status, "FAILED");
    assert.equal(payments.rows[1]?.status, "PENDING");
    assert.equal(payments.rows[1]?.providerRef, "cs_new");
  });
});

describe("checkout session recovery does not take webhook authority", () => {
  it("leaves Payment PAID transitions to the signed Stripe webhook", () => {
    const helper = readProjectFile("app/lib/checkoutSession.ts");
    const webhook = readProjectFile("app/lib/stripeWebhook.ts");
    const route = readProjectFile(
      "app/api/bookings/[id]/checkout-session/route.ts"
    );

    assert.equal(helper.includes('status: "PAID"'), false);
    assert.equal(route.includes('status: "PAID"'), false);
    assert.equal(webhook.includes('status: "PAID"'), true);
    assert.equal(webhook.includes("markExactPaymentPaid"), true);
  });
});

describe("payment attempt database integrity", () => {
  it("locks the booking row and reads authoritative price before inserting Payment", () => {
    const helper = readProjectFile("app/lib/checkoutSession.ts");
    const route = readProjectFile(
      "app/api/bookings/[id]/checkout-session/route.ts"
    );

    assert.equal(helper.includes("createPrismaCheckoutPaymentStore"), true);
    assert.equal(helper.includes("establishPendingStripeAttempt"), true);
    assert.match(helper, /FOR UPDATE/);
    assert.equal(route.includes("createPrismaCheckoutPaymentStore(prisma)"), true);
    assert.equal(
      helper.includes("resolveChargeFromBooking(params.booking)"),
      false
    );
  });

  it("migration allows multiple FAILED attempts and blocks two PENDING Stripe attempts", () => {
    const sql = readProjectFile(
      "prisma/migrations/20260817224500_payment_attempt_integrity/migration.sql"
    );

    assert.equal(sql.includes('CREATE UNIQUE INDEX "Payment_one_pending_stripe_attempt"'), true);
    assert.equal(sql.includes('ON "Payment" ("bookingId")'), true);
    assert.equal(sql.includes('status = \'PENDING\'::"PaymentStatus"'), true);
    assert.equal(sql.includes("provider = 'STRIPE'"), true);
    assert.equal(sql.includes('CREATE UNIQUE INDEX "Payment_providerRef_key"'), true);
    assert.equal(sql.includes('ON "Payment"("providerRef")'), true);
    assert.equal(sql.includes('@@unique([bookingId, status])'), false);
    assert.match(sql, /duplicate PENDING STRIPE payments exist/);
  });

  it("migration allows only one PAID Payment per booking", () => {
    const sql = readProjectFile(
      "prisma/migrations/20260819213000_payment_one_paid_per_booking/migration.sql"
    );

    assert.equal(sql.includes('CREATE UNIQUE INDEX "Payment_one_paid_per_booking"'), true);
    assert.equal(sql.includes('ON "Payment" ("bookingId")'), true);
    assert.equal(sql.includes('status = \'PAID\'::"PaymentStatus"'), true);
    assert.match(sql, /duplicate PAID payments exist for one booking/);
  });

  it("treats Prisma unique violations as a controlled race, not an unknown 500", () => {
    assert.equal(
      isUniqueConstraintError({ code: "P2002" }),
      true
    );
    assert.equal(
      isUniqueConstraintError({ code: "23505" }),
      true
    );
    assert.equal(isUniqueConstraintError(new Error("boom")), false);
  });

  it("distinguishes paid-per-booking unique conflicts from other database failures", () => {
    assert.equal(
      isPaidPerBookingUniqueConflict({
        code: "P2002",
        meta: { target: [PAID_PER_BOOKING_UNIQUE_INDEX] },
      }),
      true
    );
    assert.equal(
      isPaidPerBookingUniqueConflict({
        code: "P2002",
        meta: { target: [PENDING_STRIPE_UNIQUE_INDEX] },
      }),
      false
    );
    assert.equal(isPaidPerBookingUniqueConflict(new Error("db unavailable")), false);
  });
});

describe("paid capture authority", () => {
  it("treats a PAID Payment row as authoritative paid capture", () => {
    assert.equal(
      bookingHasPaidCapture({
        paymentStatus: "PENDING",
        payments: [{ status: "PAID" }],
      }),
      true
    );
  });

  it("does not treat Booking.paymentStatus PAID alone as paid capture", () => {
    assert.equal(
      bookingHasPaidCapture({
        paymentStatus: "PAID",
        payments: [],
      }),
      false
    );
    assert.equal(
      bookingHasPaidCapture({
        paymentStatus: "PAID",
      }),
      false
    );
  });

  it("does not treat PENDING or FAILED Payment rows as paid capture", () => {
    assert.equal(
      bookingHasPaidCapture({
        paymentStatus: "PAID",
        payments: [{ status: "PENDING" }],
      }),
      false
    );
    assert.equal(
      bookingHasPaidCapture({
        paymentStatus: "PAID",
        payments: [{ status: "FAILED" }],
      }),
      false
    );
  });

  it("does not treat REFUNDED Payment as active paid capture", () => {
    assert.equal(
      bookingHasPaidCapture({
        paymentStatus: "REFUNDED",
        payments: [{ status: "REFUNDED" }],
      }),
      false
    );
    assert.equal(
      bookingHasPaidCapture({
        paymentStatus: "PAID",
        payments: [{ status: "REFUNDED" }],
      }),
      false
    );
  });

  it("allows one PAID Payment with sibling non-PAID attempts", () => {
    assert.equal(
      bookingHasPaidCapture({
        paymentStatus: "PAID",
        payments: [{ status: "PAID" }, { status: "PENDING" }],
      }),
      true
    );
    assert.equal(
      bookingHasPaidCapture({
        paymentStatus: "PAID",
        payments: [{ status: "PAID" }, { status: "FAILED" }],
      }),
      true
    );
  });
});

describe("unpaid confirmation and retired payment POST", () => {
  it("treats unpaid DRAFT as not capturable", () => {
    assert.equal(
      bookingHasPaidCapture({
        paymentStatus: "PENDING",
        payments: [],
      }),
      false
    );
  });

  it("blocks unpaid customer confirmation in the confirm route", () => {
    const confirm = readProjectFile(
      "app/api/bookings/[id]/confirm/route.ts"
    );

    assert.equal(confirm.includes("bookingHasPaidCapture"), true);
    assert.equal(
      confirm.includes(
        "Booking cannot be confirmed until payment is completed."
      ),
      true
    );
  });

  it("retires POST /api/payments so it cannot create payment rows", () => {
    const payments = readProjectFile("app/api/payments/route.ts");

    assert.equal(payments.includes("prisma.payment.create"), false);
    assert.equal(payments.includes("status: 410"), true);
  });
});
