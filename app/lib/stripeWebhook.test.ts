import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { expireUnpaidReservation } from "./reservationLifecycle";
import {
  asCheckoutSession,
  confirmableDraftWhere,
  expiredDraftWhere,
  handleStripeWebhookRequest,
  isReservationHoldOpen,
  processStripeWebhookEvent,
  sessionMatchesAuthoritativeCharge,
  sessionMetadataConflictsWithPayment,
  type StripeCheckoutSessionLike,
  type StripeEventLike,
  type StripeWebhookStore,
  type WebhookBookingRow,
  type WebhookPaymentRow,
} from "./stripeWebhook";

const root = path.join(import.meta.dirname, "..", "..");

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const NOW = new Date("2026-08-18T17:30:00.000Z");
const OPEN_HOLD = new Date("2026-08-18T17:40:00.000Z");
const EXPIRED_HOLD = new Date("2026-08-18T17:20:00.000Z");

type SeatRow = {
  id: string;
  bookingId: string | null;
  status: string;
};

type World = {
  booking: WebhookBookingRow;
  payments: WebhookPaymentRow[];
  seats: SeatRow[];
  availableSeats: number;
  decrementOps: number;
  incrementBy: number;
  seatClears: number;
  store: StripeWebhookStore;
};

function matchesValue(
  rowValue: unknown,
  whereValue: unknown,
  row: Record<string, unknown>,
  payments: WebhookPaymentRow[]
): boolean {
  if (whereValue && typeof whereValue === "object" && !Array.isArray(whereValue)) {
    const clause = whereValue as Record<string, unknown>;

    if ("in" in clause) {
      return (clause.in as unknown[]).includes(rowValue);
    }

    if ("not" in clause) {
      return rowValue !== clause.not;
    }

    if ("gt" in clause) {
      if (rowValue == null) {
        return false;
      }

      return new Date(String(rowValue)).getTime() > new Date(String(clause.gt)).getTime();
    }

    if ("lte" in clause) {
      if (rowValue == null) {
        return false;
      }

      return new Date(String(rowValue)).getTime() <= new Date(String(clause.lte)).getTime();
    }

    if ("none" in clause) {
      const none = clause.none as { status?: string };
      return !payments.some(
        (payment) =>
          payment.bookingId === row.id &&
          (!none.status || payment.status === none.status)
      );
    }
  }

  return rowValue === whereValue;
}

function matchesWhere(
  row: Record<string, unknown>,
  where: Record<string, unknown>,
  payments: WebhookPaymentRow[]
): boolean {
  const { OR, ...rest } = where;

  for (const [key, value] of Object.entries(rest)) {
    if (!matchesValue(row[key], value, row, payments)) {
      return false;
    }
  }

  if (Array.isArray(OR)) {
    return OR.some((clause) =>
      matchesWhere(row, clause as Record<string, unknown>, payments)
    );
  }

  return true;
}

function createWorld(options?: {
  booking?: Partial<WebhookBookingRow>;
  payments?: WebhookPaymentRow[];
  seats?: SeatRow[];
  availableSeats?: number;
}): World {
  const booking: WebhookBookingRow = {
    id: "booking-1",
    status: "DRAFT",
    paymentStatus: "PENDING",
    reservationExpiresAt: OPEN_HOLD,
    totalAmount: "123.45",
    currency: "USD",
    scheduleId: "schedule-1",
    passengersCount: 2,
    ...options?.booking,
  };

  const payments = options?.payments ?? [
    {
      id: "pay-1",
      bookingId: booking.id,
      status: "PENDING",
      providerRef: "cs_1",
      amount: "123.45",
      currency: "USD",
    },
  ];

  const seats = options?.seats ?? [
    {
      id: "seat-1",
      bookingId: booking.id,
      status: "RESERVED",
    },
    {
      id: "seat-2",
      bookingId: booking.id,
      status: "RESERVED",
    },
  ];

  const world: World = {
    booking,
    payments,
    seats,
    availableSeats: options?.availableSeats ?? 10,
    decrementOps: 0,
    incrementBy: 0,
    seatClears: 0,
    store: {} as StripeWebhookStore,
  };

  const tx = {
    payment: {
      findUnique: async ({
        where,
      }: {
        where: { id?: string; providerRef?: string };
      }) => {
        return (
          world.payments.find((payment) => {
            if (where.id && payment.id !== where.id) {
              return false;
            }

            if (where.providerRef && payment.providerRef !== where.providerRef) {
              return false;
            }

            return true;
          }) ?? null
        );
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        let count = 0;

        for (const payment of world.payments) {
          if (matchesWhere(payment as unknown as Record<string, unknown>, where, world.payments)) {
            Object.assign(payment, data);
            count += 1;
          }
        }

        return { count };
      },
    },
    booking: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        if (world.booking.id !== where.id) {
          return null;
        }

        return {
          ...world.booking,
          payments: world.payments.map((payment) => ({
            status: payment.status,
          })),
        };
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        if (
          !matchesWhere(
            world.booking as unknown as Record<string, unknown>,
            where,
            world.payments
          )
        ) {
          return { count: 0 };
        }

        Object.assign(world.booking, data);
        return { count: 1 };
      },
    },
    seat: {
      updateMany: async ({
        where,
        data,
      }: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        let count = 0;

        for (const seat of world.seats) {
          if (matchesWhere(seat as unknown as Record<string, unknown>, where, world.payments)) {
            if (data.bookingId === null) {
              world.seatClears += 1;
            }

            Object.assign(seat, data);
            count += 1;
          }
        }

        return { count };
      },
    },
    flightSchedule: {
      findUnique: async () => ({
        id: world.booking.scheduleId,
        availableSeats: world.availableSeats,
        aircraft: {
          capacity: 180,
        },
      }),
      update: async ({
        data,
      }: {
        data: {
          availableSeats?: { increment?: number; decrement?: number } | number;
        };
      }) => {
        if (
          data.availableSeats &&
          typeof data.availableSeats === "object" &&
          data.availableSeats.decrement
        ) {
          world.decrementOps += 1;
          world.availableSeats -= data.availableSeats.decrement;
        }

        if (
          data.availableSeats &&
          typeof data.availableSeats === "object" &&
          data.availableSeats.increment
        ) {
          world.incrementBy += data.availableSeats.increment;
          world.availableSeats += data.availableSeats.increment;
        }

        if (typeof data.availableSeats === "number") {
          world.availableSeats = data.availableSeats;
        }

        return {
          availableSeats: world.availableSeats,
          aircraft: {
            capacity: 180,
          },
        };
      },
      updateMany: async ({
        data,
      }: {
        data: {
          availableSeats?: { decrement?: number };
        };
      }) => {
        if (data.availableSeats?.decrement) {
          world.decrementOps += 1;
          world.availableSeats -= data.availableSeats.decrement;
          return { count: 1 };
        }

        return { count: 0 };
      },
    },
  };

  let transactionQueue = Promise.resolve();

  world.store = {
    payment: {
      findUnique: async ({
        where,
      }: {
        where: { providerRef: string };
      }) => {
        const payment = world.payments.find(
          (row) => row.providerRef === where.providerRef
        );

        if (!payment) {
          return null;
        }

        return {
          ...payment,
          booking: world.booking,
        };
      },
    },
    $transaction: async <T,>(fn: (client: typeof tx) => Promise<T>) => {
      const run = transactionQueue.then(() => fn(tx));
      transactionQueue = run.then(
        () => undefined,
        () => undefined
      );
      return run;
    },
    booking: tx.booking,
  } as StripeWebhookStore & { booking: typeof tx.booking };

  return world;
}

function paidSession(
  overrides: Partial<StripeCheckoutSessionLike> = {}
): StripeCheckoutSessionLike {
  return {
    id: "cs_1",
    object: "checkout.session",
    mode: "payment",
    payment_status: "paid",
    amount_total: 12345,
    currency: "usd",
    metadata: {
      paymentId: "pay-1",
      bookingId: "booking-1",
    },
    ...overrides,
  };
}

function stripeEvent(
  type: string,
  session: StripeCheckoutSessionLike
): StripeEventLike {
  return {
    type,
    data: {
      object: session,
    },
  };
}

async function deliverPaid(
  world: World,
  eventType = "checkout.session.completed",
  session: StripeCheckoutSessionLike = paidSession(),
  now: Date = NOW
) {
  await processStripeWebhookEvent(
    world.store,
    stripeEvent(eventType, session),
    now
  );
}

describe("reservation hold evaluation", () => {
  it("treats a null reservationExpiresAt as still open", () => {
    assert.equal(isReservationHoldOpen(null, NOW), true);
  });

  it("treats reservationExpiresAt at or before now as expired", () => {
    assert.equal(isReservationHoldOpen(EXPIRED_HOLD, NOW), false);
    assert.equal(isReservationHoldOpen(NOW, NOW), false);
    assert.equal(isReservationHoldOpen(OPEN_HOLD, NOW), true);
  });

  it("does not treat still-DRAFT as sufficient for confirmation", () => {
    const where = confirmableDraftWhere("booking-1", NOW);
    const expired = expiredDraftWhere("booking-1", NOW);

    assert.equal(where.status, "DRAFT");
    assert.deepEqual(expired.reservationExpiresAt, { lte: NOW });
    assert.equal(
      JSON.stringify(where).includes('"gt"'),
      true
    );
  });
});

describe("charge and metadata verification", () => {
  const payment: WebhookPaymentRow = {
    id: "pay-1",
    bookingId: "booking-1",
    status: "PENDING",
    providerRef: "cs_1",
    amount: "123.45",
    currency: "USD",
  };
  const booking: WebhookBookingRow = {
    id: "booking-1",
    status: "DRAFT",
    paymentStatus: "PENDING",
    reservationExpiresAt: OPEN_HOLD,
    totalAmount: "123.45",
    currency: "USD",
    scheduleId: "schedule-1",
    passengersCount: 2,
  };

  it("accepts integer-cent equality and rejects float-style mismatch", () => {
    assert.equal(
      sessionMatchesAuthoritativeCharge(paidSession(), payment, booking),
      true
    );
    assert.equal(
      sessionMatchesAuthoritativeCharge(
        paidSession({ amount_total: 12346 }),
        payment,
        booking
      ),
      false
    );
  });

  it("rejects currency mismatch without using success_url", () => {
    assert.equal(
      sessionMatchesAuthoritativeCharge(
        paidSession({ currency: "eur" }),
        payment,
        booking
      ),
      false
    );
  });

  it("treats metadata as secondary and detects conflicts", () => {
    assert.equal(
      sessionMetadataConflictsWithPayment(paidSession(), payment),
      false
    );
    assert.equal(
      sessionMetadataConflictsWithPayment(
        paidSession({
          metadata: {
            paymentId: "other-pay",
            bookingId: "booking-1",
          },
        }),
        payment
      ),
      true
    );
    assert.equal(
      asCheckoutSession({ id: "cs_1" })?.id,
      "cs_1"
    );
  });
});

describe("POST /api/webhooks/stripe signature handling", () => {
  it("rejects a missing signature", async () => {
    let processed = false;

    const response = await handleStripeWebhookRequest(
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: "{\"id\":\"evt_1\"}",
      }),
      {
        getWebhookSecret: () => "whsec_test",
        constructEvent: () => {
          throw new Error("should not construct");
        },
        processEvent: async () => {
          processed = true;
        },
      }
    );

    assert.equal(response.status, 400);
    assert.equal(processed, false);
  });

  it("rejects an invalid signature", async () => {
    let processed = false;

    const response = await handleStripeWebhookRequest(
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        headers: {
          "stripe-signature": "bad",
        },
        body: "{\"id\":\"evt_1\"}",
      }),
      {
        getWebhookSecret: () => "whsec_test",
        constructEvent: () => {
          throw new Error("invalid signature");
        },
        processEvent: async () => {
          processed = true;
        },
      }
    );

    assert.equal(response.status, 400);
    assert.equal(processed, false);
  });

  it("acknowledges an irrelevant event without mutation", async () => {
    const world = createWorld();
    const rawBody = JSON.stringify({ type: "invoice.paid" });
    let seenBody = "";

    const response = await handleStripeWebhookRequest(
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        headers: {
          "stripe-signature": "sig_test",
        },
        body: rawBody,
      }),
      {
        getWebhookSecret: () => "whsec_test",
        constructEvent: (payload, signature, secret) => {
          seenBody = payload;
          assert.equal(signature, "sig_test");
          assert.equal(secret, "whsec_test");
          return JSON.parse(payload) as StripeEventLike;
        },
        processEvent: (event) => processStripeWebhookEvent(world.store, event, NOW),
      }
    );

    assert.equal(response.status, 200);
    assert.equal(seenBody, rawBody);
    assert.equal(world.payments[0]?.status, "PENDING");
    assert.equal(world.booking.status, "DRAFT");
  });
});

describe("paid checkout session application", () => {
  let errorSpy: typeof console.error;

  beforeEach(() => {
    errorSpy = console.error;
    console.error = () => undefined;
  });

  afterEach(() => {
    console.error = errorSpy;
  });

  it("does not mutate a booking for an unknown providerRef", async () => {
    const world = createWorld();

    await deliverPaid(
      world,
      "checkout.session.completed",
      paidSession({ id: "cs_unknown" })
    );

    assert.equal(world.booking.status, "DRAFT");
    assert.equal(world.booking.paymentStatus, "PENDING");
    assert.equal(world.payments[0]?.status, "PENDING");
    assert.equal(world.availableSeats, 10);
  });

  it("does not confirm when metadata conflicts with the providerRef payment", async () => {
    const world = createWorld();

    await deliverPaid(
      world,
      "checkout.session.completed",
      paidSession({
        metadata: {
          paymentId: "pay-other",
          bookingId: "booking-1",
        },
      })
    );

    assert.notEqual(world.booking.status, "CONFIRMED");
    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.booking.status, "FAILED");
    assert.equal(world.booking.paymentStatus, "PAID");
  });

  it("does not confirm an amount mismatch", async () => {
    const world = createWorld();

    await deliverPaid(
      world,
      "checkout.session.completed",
      paidSession({ amount_total: 1 })
    );

    assert.notEqual(world.booking.status, "CONFIRMED");
    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.booking.status, "FAILED");
  });

  it("does not confirm a currency mismatch", async () => {
    const world = createWorld();

    await deliverPaid(
      world,
      "checkout.session.completed",
      paidSession({ currency: "eur" })
    );

    assert.notEqual(world.booking.status, "CONFIRMED");
    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.booking.status, "FAILED");
  });

  it("confirms an active DRAFT with a PENDING payment", async () => {
    const world = createWorld();

    await deliverPaid(world);

    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.booking.paymentStatus, "PAID");
    assert.equal(world.booking.status, "CONFIRMED");
    assert.equal(
      world.seats.every((seat) => seat.status === "BOOKED"),
      true
    );
  });

  it("does not decrement availableSeats again on payment success", async () => {
    const world = createWorld();

    await deliverPaid(world);

    assert.equal(world.decrementOps, 0);
    assert.equal(world.availableSeats, 10);
    assert.equal(world.incrementBy, 0);
  });

  it("is idempotent for duplicate successful webhooks", async () => {
    const world = createWorld();

    await deliverPaid(world);
    await deliverPaid(world);
    await deliverPaid(world, "checkout.session.async_payment_succeeded");

    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.booking.status, "CONFIRMED");
    assert.equal(world.decrementOps, 0);
    assert.equal(world.incrementBy, 0);
    assert.equal(world.availableSeats, 10);
  });

  it("cannot confirm a time-expired DRAFT even if cleanup has not run", async () => {
    const world = createWorld({
      booking: {
        reservationExpiresAt: EXPIRED_HOLD,
      },
    });

    await deliverPaid(world);

    assert.notEqual(world.booking.status, "CONFIRMED");
    assert.equal(world.booking.status, "FAILED");
  });

  it("records a time-expired paid DRAFT as FAILED and releases inventory once", async () => {
    const world = createWorld({
      booking: {
        reservationExpiresAt: EXPIRED_HOLD,
      },
    });

    await deliverPaid(world);
    await deliverPaid(world);

    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.booking.paymentStatus, "PAID");
    assert.equal(world.booking.status, "FAILED");
    assert.equal(world.incrementBy, 2);
    assert.equal(world.availableSeats, 12);
    assert.equal(world.seatClears > 0, true);
  });

  it("cannot resurrect an already FAILED booking", async () => {
    const world = createWorld({
      booking: {
        status: "FAILED",
        reservationExpiresAt: EXPIRED_HOLD,
      },
    });

    await deliverPaid(world);

    assert.equal(world.booking.status, "FAILED");
    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.booking.paymentStatus, "PAID");
    assert.equal(world.incrementBy, 0);
  });

  it("cannot resurrect an already CANCELLED booking", async () => {
    const world = createWorld({
      booking: {
        status: "CANCELLED",
      },
    });

    await deliverPaid(world);

    assert.equal(world.booking.status, "CANCELLED");
    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.booking.paymentStatus, "PAID");
    assert.equal(world.incrementBy, 0);
  });

  it("represents a late real capture as Payment PAID", async () => {
    const world = createWorld({
      booking: {
        status: "FAILED",
        paymentStatus: "PENDING",
      },
    });

    await deliverPaid(world);

    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.booking.paymentStatus, "PAID");
    assert.equal(world.booking.status, "FAILED");
  });

  it("represents a previously FAILED Payment as PAID without resurrecting the booking", async () => {
    const world = createWorld({
      booking: {
        status: "FAILED",
      },
      payments: [
        {
          id: "pay-1",
          bookingId: "booking-1",
          status: "FAILED",
          providerRef: "cs_1",
          amount: "123.45",
          currency: "USD",
        },
      ],
    });

    await deliverPaid(world);

    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.booking.status, "FAILED");
    assert.notEqual(world.booking.status, "CONFIRMED");
  });

  it("does not mark a current attempt PAID when an old attempt is captured", async () => {
    const world = createWorld({
      booking: {
        status: "FAILED",
      },
      payments: [
        {
          id: "pay-old",
          bookingId: "booking-1",
          status: "FAILED",
          providerRef: "cs_old",
          amount: "123.45",
          currency: "USD",
        },
        {
          id: "pay-new",
          bookingId: "booking-1",
          status: "PENDING",
          providerRef: "cs_new",
          amount: "123.45",
          currency: "USD",
        },
      ],
    });

    await deliverPaid(
      world,
      "checkout.session.completed",
      paidSession({
        id: "cs_old",
        metadata: {
          paymentId: "pay-old",
          bookingId: "booking-1",
        },
      })
    );

    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.payments[1]?.status, "PENDING");
    assert.equal(world.booking.status, "FAILED");
  });

  it("marks only the exact attempt FAILED on async payment failure", async () => {
    const world = createWorld({
      payments: [
        {
          id: "pay-1",
          bookingId: "booking-1",
          status: "PENDING",
          providerRef: "cs_1",
          amount: "123.45",
          currency: "USD",
        },
        {
          id: "pay-2",
          bookingId: "booking-1",
          status: "FAILED",
          providerRef: "cs_old",
          amount: "123.45",
          currency: "USD",
        },
      ],
    });

    await processStripeWebhookEvent(
      world.store,
      stripeEvent(
        "checkout.session.async_payment_failed",
        paidSession({
          payment_status: "unpaid",
        })
      ),
      NOW
    );

    assert.equal(world.payments[0]?.status, "FAILED");
    assert.equal(world.payments[1]?.status, "FAILED");
    assert.equal(world.booking.status, "DRAFT");
    assert.equal(world.booking.paymentStatus, "PENDING");
    assert.equal(world.incrementBy, 0);
    assert.equal(world.availableSeats, 10);
  });

  it("does not release inventory when a payment attempt fails", async () => {
    const world = createWorld();

    await processStripeWebhookEvent(
      world.store,
      stripeEvent(
        "checkout.session.async_payment_failed",
        paidSession({ payment_status: "unpaid" })
      ),
      NOW
    );

    assert.equal(world.incrementBy, 0);
    assert.equal(world.availableSeats, 10);
    assert.equal(world.booking.status, "DRAFT");
  });

  it("marks only the exact attempt FAILED on checkout.session.expired", async () => {
    const world = createWorld();

    await processStripeWebhookEvent(
      world.store,
      stripeEvent(
        "checkout.session.expired",
        paidSession({
          payment_status: "unpaid",
        })
      ),
      NOW
    );

    assert.equal(world.payments[0]?.status, "FAILED");
    assert.equal(world.booking.status, "DRAFT");
  });

  it("does not release inventory on Stripe session expiration", async () => {
    const world = createWorld();

    await processStripeWebhookEvent(
      world.store,
      stripeEvent(
        "checkout.session.expired",
        paidSession({ payment_status: "unpaid" })
      ),
      NOW
    );

    assert.equal(world.incrementBy, 0);
    assert.equal(world.availableSeats, 10);
    assert.equal(world.booking.status, "DRAFT");
  });

  it("gives expiration vs webhook exactly one booking-state winner", async () => {
    const expiredWorld = createWorld({
      booking: {
        reservationExpiresAt: EXPIRED_HOLD,
      },
    });

    await Promise.all([
      processStripeWebhookEvent(
        expiredWorld.store,
        stripeEvent("checkout.session.completed", paidSession()),
        NOW
      ),
      expireUnpaidReservation(expiredWorld.store as never, "booking-1", NOW),
    ]);

    assert.equal(expiredWorld.booking.status, "FAILED");
    assert.notEqual(expiredWorld.booking.status, "CONFIRMED");
    assert.equal(expiredWorld.payments[0]?.status, "PAID");
    assert.equal(expiredWorld.incrementBy, 2);

    const openWorld = createWorld();

    await Promise.all([
      processStripeWebhookEvent(
        openWorld.store,
        stripeEvent("checkout.session.completed", paidSession()),
        NOW
      ),
      expireUnpaidReservation(openWorld.store as never, "booking-1", NOW),
    ]);

    assert.equal(openWorld.booking.status, "CONFIRMED");
    assert.equal(openWorld.incrementBy, 0);
    assert.equal(openWorld.availableSeats, 10);
  });

  it("keeps already PAID and CONFIRMED duplicate processing harmless", async () => {
    const world = createWorld({
      booking: {
        status: "CONFIRMED",
        paymentStatus: "PAID",
      },
      payments: [
        {
          id: "pay-1",
          bookingId: "booking-1",
          status: "PAID",
          providerRef: "cs_1",
          amount: "123.45",
          currency: "USD",
        },
      ],
      seats: [
        {
          id: "seat-1",
          bookingId: "booking-1",
          status: "BOOKED",
        },
      ],
    });

    await deliverPaid(world);
    await deliverPaid(world);

    assert.equal(world.booking.status, "CONFIRMED");
    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.decrementOps, 0);
    assert.equal(world.incrementBy, 0);
  });

  it("cannot confirm an amount or currency integrity exception", async () => {
    const amountWorld = createWorld();
    await deliverPaid(
      amountWorld,
      "checkout.session.completed",
      paidSession({ amount_total: 99999 })
    );
    assert.notEqual(amountWorld.booking.status, "CONFIRMED");

    const currencyWorld = createWorld();
    await deliverPaid(
      currencyWorld,
      "checkout.session.completed",
      paidSession({ currency: "gbp" })
    );
    assert.notEqual(currencyWorld.booking.status, "CONFIRMED");
  });

  it("waits on completed but unpaid Checkout Sessions", async () => {
    const world = createWorld();

    await processStripeWebhookEvent(
      world.store,
      stripeEvent(
        "checkout.session.completed",
        paidSession({ payment_status: "unpaid" })
      ),
      NOW
    );

    assert.equal(world.payments[0]?.status, "PENDING");
    assert.equal(world.booking.status, "DRAFT");
  });

  it("may confirm a legacy DRAFT with null reservationExpiresAt", async () => {
    const world = createWorld({
      booking: {
        reservationExpiresAt: null,
      },
    });

    await deliverPaid(world);

    assert.equal(world.booking.status, "CONFIRMED");
    assert.equal(world.payments[0]?.status, "PAID");
  });
});

describe("webhook route architecture", () => {
  it("verifies the raw body and does not parse JSON before signature checks", () => {
    const route = readProjectFile("app/api/webhooks/stripe/route.ts");
    const helper = readProjectFile("app/lib/stripeWebhook.ts");

    assert.equal(helper.includes("await request.text()"), true);
    assert.equal(helper.includes("request.json()"), false);
    assert.equal(helper.includes("constructEvent"), true);
    assert.equal(helper.includes("stripe-signature"), true);
    assert.equal(route.includes("STRIPE_WEBHOOK_SECRET") || helper.includes("getWebhookSecret"), true);
    assert.equal(route.includes('export const runtime = "nodejs"'), true);
    assert.equal(route.includes("/api/bookings/"), false);
    assert.equal(helper.includes("reserveScheduleSeats"), false);
    assert.equal(helper.includes("claimAndReleaseInventory"), true);
    assert.equal(helper.includes("success_url"), false);
  });
});
