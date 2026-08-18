import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { bookingHasPaidCapture } from "./checkoutSession";
import { isTicketEligible } from "./ticketAccess";
import {
  handleStripeWebhookRequest,
  processStripeWebhookEvent,
  StripeWebhookRetryError,
  STRIPE_WEBHOOK_REFUND_EVENTS,
  type StripeEventLike,
  type StripeWebhookStore,
  type WebhookBookingRow,
  type WebhookPaymentRow,
} from "./stripeWebhook";

const root = path.join(import.meta.dirname, "..", "..");

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

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
  persistFailuresRemaining: number;
  store: StripeWebhookStore;
};

function matchesWhere(
  row: Record<string, unknown>,
  where: Record<string, unknown>
): boolean {
  for (const [key, value] of Object.entries(where)) {
    if (value && typeof value === "object" && !Array.isArray(value) && "in" in value) {
      if (!(value.in as unknown[]).includes(row[key])) {
        return false;
      }

      continue;
    }

    if (row[key] !== value) {
      return false;
    }
  }

  return true;
}

function createWorld(
  options: {
    booking?: Partial<WebhookBookingRow>;
    payment?: Partial<WebhookPaymentRow>;
  } = {}
): World {
  const booking: WebhookBookingRow = {
    id: "booking-1",
    status: "FAILED",
    paymentStatus: "PAID",
    reservationExpiresAt: null,
    totalAmount: "123.45",
    currency: "USD",
    scheduleId: "schedule-1",
    passengersCount: 2,
    ...options.booking,
  };

  const payments: WebhookPaymentRow[] = [
    {
      id: "pay-1",
      bookingId: booking.id,
      status: "PAID",
      providerRef: "cs_1",
      stripePaymentIntentId: "pi_1",
      amount: "123.45",
      currency: "USD",
      ...options.payment,
    },
  ];

  const world: World = {
    booking,
    payments,
    seats: [
      {
        id: "seat-1",
        bookingId: booking.id,
        status: "AVAILABLE",
      },
    ],
    availableSeats: 10,
    persistFailuresRemaining: 0,
    store: {} as StripeWebhookStore,
  };

  const tx = {
    payment: {
      findUnique: async () => world.payments[0] ?? null,
      updateMany: async ({
        where,
        data,
      }: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        let count = 0;

        for (const payment of world.payments) {
          if (matchesWhere(payment as unknown as Record<string, unknown>, where)) {
            Object.assign(payment, data);
            count += 1;
          }
        }

        return { count };
      },
    },
    booking: {
      findUnique: async () => world.booking,
      updateMany: async ({
        where,
        data,
      }: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        if (!matchesWhere(world.booking as unknown as Record<string, unknown>, where)) {
          return { count: 0 };
        }

        Object.assign(world.booking, data);
        return { count: 1 };
      },
    },
    seat: {
      updateMany: async () => ({ count: 0 }),
    },
    flightSchedule: {
      findUnique: async () => ({
        availableSeats: world.availableSeats,
        aircraft: { capacity: 180 },
      }),
      update: async () => ({
        availableSeats: world.availableSeats,
        aircraft: { capacity: 180 },
      }),
    },
  };

  world.store = {
    payment: {
      findUnique: async ({
        where,
      }: {
        where: { providerRef?: string; stripePaymentIntentId?: string };
      }) => {
        const payment = world.payments.find((row) => {
          if (
            where.stripePaymentIntentId &&
            row.stripePaymentIntentId !== where.stripePaymentIntentId
          ) {
            return false;
          }

          if (where.providerRef && row.providerRef !== where.providerRef) {
            return false;
          }

          return Boolean(where.providerRef || where.stripePaymentIntentId);
        });

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
      if (world.persistFailuresRemaining > 0) {
        world.persistFailuresRemaining -= 1;
        throw new Error("db unavailable");
      }

      const snapshot = {
        booking: { ...world.booking },
        payments: world.payments.map((payment) => ({ ...payment })),
        availableSeats: world.availableSeats,
      };

      try {
        return await fn(tx);
      } catch (error) {
        Object.assign(world.booking, snapshot.booking);
        world.payments.splice(
          0,
          world.payments.length,
          ...snapshot.payments
        );
        world.availableSeats = snapshot.availableSeats;
        throw error;
      }
    },
  };

  return world;
}

function refundObject(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    id: "re_1",
    object: "refund",
    status: "succeeded",
    amount: 12345,
    currency: "usd",
    payment_intent: "pi_1",
    ...overrides,
  };
}

function refundEvent(
  type: string,
  refund: Record<string, unknown> = refundObject()
): StripeEventLike {
  return {
    id: "evt_refund_1",
    type,
    data: {
      object: refund,
    },
  };
}

async function deliverRefund(
  world: World,
  type = "refund.updated",
  refund: Record<string, unknown> = refundObject()
) {
  await processStripeWebhookEvent(world.store, refundEvent(type, refund));
}

async function postRefundWebhook(
  world: World,
  type = "refund.updated",
  refund: Record<string, unknown> = refundObject()
) {
  const event = refundEvent(type, refund);

  return handleStripeWebhookRequest(
    new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
      },
      body: "{}",
    }),
    {
      getWebhookSecret: () => "whsec_test",
      constructEvent: () => event,
      processEvent: (incoming) =>
        processStripeWebhookEvent(world.store, incoming),
    }
  );
}

describe("Stripe refund webhook reconciliation", () => {
  let errorSpy: typeof console.error;
  let logs: Array<{ code: string; details: Record<string, unknown> }>;

  beforeEach(() => {
    errorSpy = console.error;
    logs = [];
    console.error = (code: unknown, details?: unknown) => {
      if (typeof code === "string") {
        logs.push({
          code,
          details:
            details && typeof details === "object"
              ? (details as Record<string, unknown>)
              : {},
        });
      }
    };
  });

  afterEach(() => {
    console.error = errorSpy;
  });

  it("reconciles a valid full refund to Payment REFUNDED", async () => {
    const world = createWorld();

    await deliverRefund(world);

    assert.equal(world.payments[0]?.status, "REFUNDED");
  });

  it("sets Booking.paymentStatus REFUNDED atomically with Payment", async () => {
    const world = createWorld();

    await deliverRefund(world);

    assert.equal(world.payments[0]?.status, "REFUNDED");
    assert.equal(world.booking.paymentStatus, "REFUNDED");
  });

  it("does not change Booking.status", async () => {
    const world = createWorld({
      booking: {
        status: "FAILED",
      },
    });

    await deliverRefund(world);

    assert.equal(world.booking.status, "FAILED");
  });

  it("does not touch inventory", async () => {
    const world = createWorld();

    await deliverRefund(world);

    assert.equal(world.availableSeats, 10);
    assert.equal(world.seats[0]?.status, "AVAILABLE");
    assert.equal(world.seats[0]?.bookingId, "booking-1");
  });

  it("is idempotent for duplicate successful refund webhooks", async () => {
    const world = createWorld();

    await deliverRefund(world);
    await deliverRefund(world);

    assert.equal(world.payments[0]?.status, "REFUNDED");
    assert.equal(world.booking.paymentStatus, "REFUNDED");
    assert.equal(world.booking.status, "FAILED");
    assert.equal(world.availableSeats, 10);
  });

  it("remains idempotent for a third identical refund webhook", async () => {
    const world = createWorld();

    await deliverRefund(world, "refund.created");
    await deliverRefund(world, "refund.updated");
    await deliverRefund(world, "refund.updated");

    assert.equal(world.payments[0]?.status, "REFUNDED");
    assert.equal(world.booking.paymentStatus, "REFUNDED");
  });

  it("recovers a prior refund-endpoint DB failure", async () => {
    const world = createWorld({
      payment: {
        status: "PAID",
      },
      booking: {
        status: "CANCELLED",
        paymentStatus: "PAID",
      },
    });

    await deliverRefund(world);

    assert.equal(world.payments[0]?.status, "REFUNDED");
    assert.equal(world.booking.paymentStatus, "REFUNDED");
    assert.equal(world.booking.status, "CANCELLED");
  });

  it("does not mark REFUNDED for a pending refund", async () => {
    const world = createWorld();

    await deliverRefund(
      world,
      "refund.created",
      refundObject({ status: "pending" })
    );

    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.booking.paymentStatus, "PAID");
  });

  it("does not mark REFUNDED for a failed refund", async () => {
    const world = createWorld();

    await deliverRefund(
      world,
      "refund.failed",
      refundObject({ status: "failed" })
    );

    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.booking.paymentStatus, "PAID");
  });

  it("does not mark REFUNDED for a partial refund", async () => {
    const world = createWorld();

    await deliverRefund(
      world,
      "refund.updated",
      refundObject({ amount: 1000 })
    );

    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.booking.paymentStatus, "PAID");
  });

  it("changes nothing for an unknown PaymentIntent", async () => {
    const world = createWorld();

    await deliverRefund(
      world,
      "refund.updated",
      refundObject({ payment_intent: "pi_unknown" })
    );

    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.booking.paymentStatus, "PAID");
  });

  it("changes nothing when PaymentIntent is missing", async () => {
    const world = createWorld();

    await deliverRefund(
      world,
      "refund.updated",
      refundObject({ payment_intent: null })
    );

    assert.equal(world.payments[0]?.status, "PAID");
  });

  it("changes nothing when PaymentIntent is malformed", async () => {
    const world = createWorld();

    await deliverRefund(
      world,
      "refund.updated",
      refundObject({ payment_intent: "ch_not_a_payment_intent" })
    );

    assert.equal(world.payments[0]?.status, "PAID");
  });

  it("changes nothing on amount mismatch", async () => {
    const world = createWorld();

    await deliverRefund(
      world,
      "refund.updated",
      refundObject({ amount: 99999 })
    );

    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.booking.paymentStatus, "PAID");
  });

  it("changes nothing on currency mismatch", async () => {
    const world = createWorld();

    await deliverRefund(
      world,
      "refund.updated",
      refundObject({ currency: "eur" })
    );

    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.booking.paymentStatus, "PAID");
  });

  it("does not silently cancel a CONFIRMED booking", async () => {
    const world = createWorld({
      booking: {
        status: "CONFIRMED",
        paymentStatus: "PAID",
      },
    });

    const response = await postRefundWebhook(world);

    assert.equal(response.status, 200);
    assert.equal(world.booking.status, "CONFIRMED");
    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.booking.paymentStatus, "PAID");
    assert.equal(world.availableSeats, 10);
    assert.equal(world.seats[0]?.status, "AVAILABLE");
    assert.equal(world.seats[0]?.bookingId, "booking-1");
    assert.equal(
      logs.some((log) => log.code === "STRIPE_WEBHOOK_REFUND_ACTIVE_BOOKING"),
      true
    );
    const conflict = logs.find(
      (log) => log.code === "STRIPE_WEBHOOK_REFUND_ACTIVE_BOOKING"
    );
    assert.equal(conflict?.details.eventId, "evt_refund_1");
    assert.equal(conflict?.details.refundId, "re_1");
    assert.equal(conflict?.details.paymentIntentId, "pi_1");
    assert.equal(conflict?.details.paymentId, "pay-1");
    assert.equal(conflict?.details.bookingId, "booking-1");
    assert.equal(conflict?.details.bookingStatus, "CONFIRMED");
  });

  it("does not silently change CHECKED_IN", async () => {
    const world = createWorld({
      booking: {
        status: "CHECKED_IN",
        paymentStatus: "PAID",
      },
    });

    const response = await postRefundWebhook(world);

    assert.equal(response.status, 200);
    assert.equal(world.booking.status, "CHECKED_IN");
    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.availableSeats, 10);
  });

  it("does not silently change BOARDED", async () => {
    const world = createWorld({
      booking: {
        status: "BOARDED",
        paymentStatus: "PAID",
      },
    });

    const response = await postRefundWebhook(world);

    assert.equal(response.status, 200);
    assert.equal(world.booking.status, "BOARDED");
    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.availableSeats, 10);
  });

  it("does not silently change COMPLETED", async () => {
    const world = createWorld({
      booking: {
        status: "COMPLETED",
        paymentStatus: "PAID",
      },
    });

    const response = await postRefundWebhook(world);

    assert.equal(response.status, 200);
    assert.equal(world.booking.status, "COMPLETED");
    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.availableSeats, 10);
  });

  it("keeps duplicate active-booking refund deliveries terminal and unmutated", async () => {
    const world = createWorld({
      booking: {
        status: "CONFIRMED",
        paymentStatus: "PAID",
      },
    });

    const first = await postRefundWebhook(world);
    const second = await postRefundWebhook(world);

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(world.booking.status, "CONFIRMED");
    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.booking.paymentStatus, "PAID");
    assert.equal(world.availableSeats, 10);
  });

  it("can reconcile a FAILED recovery booking", async () => {
    const world = createWorld({
      booking: {
        status: "FAILED",
        paymentStatus: "PAID",
      },
    });

    await deliverRefund(world);

    assert.equal(world.booking.status, "FAILED");
    assert.equal(world.booking.paymentStatus, "REFUNDED");
    assert.equal(world.payments[0]?.status, "REFUNDED");
  });

  it("can reconcile a CANCELLED recovery booking", async () => {
    const world = createWorld({
      booking: {
        status: "CANCELLED",
        paymentStatus: "PAID",
      },
    });

    await deliverRefund(world);

    assert.equal(world.booking.status, "CANCELLED");
    assert.equal(world.booking.paymentStatus, "REFUNDED");
    assert.equal(world.payments[0]?.status, "REFUNDED");
  });

  it("keeps concurrent duplicate reconciliation consistent", async () => {
    const world = createWorld();

    await Promise.all([
      deliverRefund(world),
      deliverRefund(world),
    ]);

    assert.equal(world.payments[0]?.status, "REFUNDED");
    assert.equal(world.booking.paymentStatus, "REFUNDED");
    assert.equal(world.booking.status, "FAILED");
    assert.equal(world.availableSeats, 10);
  });

  it("leaves Payment and Booking financial states unchanged when the transaction fails", async () => {
    const world = createWorld();
    world.persistFailuresRemaining = 1;

    await assert.rejects(
      () => deliverRefund(world),
      (error: unknown) =>
        error instanceof StripeWebhookRetryError &&
        error.code === "STRIPE_WEBHOOK_REFUND_PERSISTENCE_FAILED"
    );
    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.booking.paymentStatus, "PAID");
  });

  it("returns retry-safe HTTP 5xx for a transient DB failure", async () => {
    const world = createWorld();
    world.persistFailuresRemaining = 1;

    const response = await postRefundWebhook(world);

    assert.equal(response.status, 500);
    assert.equal(world.payments[0]?.status, "PAID");
    assert.equal(world.booking.paymentStatus, "PAID");
  });

  it("never calls Stripe refund creation", () => {
    const helper = readProjectFile("app/lib/stripeRefundWebhook.ts");
    const webhook = readProjectFile("app/lib/stripeWebhook.ts");
    const route = readProjectFile("app/api/webhooks/stripe/route.ts");

    assert.equal(helper.includes("refunds.create"), false);
    assert.equal(webhook.includes("refunds.create"), false);
    assert.equal(route.includes("refunds.create"), false);
    assert.deepEqual([...STRIPE_WEBHOOK_REFUND_EVENTS], [
      "refund.created",
      "refund.updated",
      "refund.failed",
    ]);
  });

  it("does not make a refunded payment ticket-accessible", async () => {
    const world = createWorld({
      booking: {
        status: "FAILED",
        paymentStatus: "PAID",
      },
    });

    await deliverRefund(world);

    assert.equal(
      bookingHasPaidCapture({
        paymentStatus: world.booking.paymentStatus,
        payments: world.payments.map((payment) => ({ status: payment.status })),
      }),
      false
    );
    assert.equal(
      isTicketEligible({
        status: world.booking.status,
        paymentStatus: world.booking.paymentStatus,
        payments: world.payments.map((payment) => ({ status: payment.status })),
      }),
      false
    );
  });

  it("returns 200 for successful FAILED and CANCELLED reconciliation", async () => {
    const failed = createWorld({
      booking: {
        status: "FAILED",
        paymentStatus: "PAID",
      },
    });
    const cancelled = createWorld({
      booking: {
        status: "CANCELLED",
        paymentStatus: "PAID",
      },
    });

    const failedResponse = await postRefundWebhook(failed);
    const cancelledResponse = await postRefundWebhook(cancelled);

    assert.equal(failedResponse.status, 200);
    assert.equal(cancelledResponse.status, 200);
    assert.equal(failed.payments[0]?.status, "REFUNDED");
    assert.equal(cancelled.payments[0]?.status, "REFUNDED");
  });

  it("acknowledges pending, failed, partial, unknown, malformed, and mismatched refunds with 2xx", async () => {
    const pending = await postRefundWebhook(
      createWorld(),
      "refund.created",
      refundObject({ status: "pending" })
    );
    const failed = await postRefundWebhook(
      createWorld(),
      "refund.failed",
      refundObject({ status: "failed" })
    );
    const partial = await postRefundWebhook(
      createWorld(),
      "refund.updated",
      refundObject({ amount: 1 })
    );
    const unknown = await postRefundWebhook(
      createWorld(),
      "refund.updated",
      refundObject({ payment_intent: "pi_unknown" })
    );
    const missing = await postRefundWebhook(
      createWorld(),
      "refund.updated",
      refundObject({ payment_intent: null })
    );
    const amount = await postRefundWebhook(
      createWorld(),
      "refund.updated",
      refundObject({ amount: 99999 })
    );
    const currency = await postRefundWebhook(
      createWorld(),
      "refund.updated",
      refundObject({ currency: "eur" })
    );

    assert.equal(pending.status, 200);
    assert.equal(failed.status, 200);
    assert.equal(partial.status, 200);
    assert.equal(unknown.status, 200);
    assert.equal(missing.status, 200);
    assert.equal(amount.status, 200);
    assert.equal(currency.status, 200);
  });

  it("logs amount and currency mismatches as terminal reconciliation conflicts", async () => {
    const amountWorld = createWorld();
    const currencyWorld = createWorld();

    const amountResponse = await postRefundWebhook(
      amountWorld,
      "refund.updated",
      refundObject({ amount: 99999 })
    );
    const currencyResponse = await postRefundWebhook(
      currencyWorld,
      "refund.updated",
      refundObject({ currency: "eur" })
    );

    assert.equal(amountResponse.status, 200);
    assert.equal(currencyResponse.status, 200);
    assert.equal(amountWorld.payments[0]?.status, "PAID");
    assert.equal(currencyWorld.payments[0]?.status, "PAID");

    const amountLog = logs.find(
      (log) => log.code === "STRIPE_WEBHOOK_REFUND_AMOUNT_MISMATCH"
    );
    const currencyLog = logs.find(
      (log) => log.code === "STRIPE_WEBHOOK_REFUND_CURRENCY_MISMATCH"
    );

    assert.equal(amountLog?.details.eventId, "evt_refund_1");
    assert.equal(amountLog?.details.refundId, "re_1");
    assert.equal(amountLog?.details.paymentIntentId, "pi_1");
    assert.equal(amountLog?.details.paymentId, "pay-1");
    assert.equal(amountLog?.details.bookingId, "booking-1");
    assert.equal(currencyLog?.details.eventId, "evt_refund_1");
    assert.equal(currencyLog?.details.refundId, "re_1");
    assert.equal(currencyLog?.details.paymentIntentId, "pi_1");
    assert.equal(currencyLog?.details.paymentId, "pay-1");
    assert.equal(currencyLog?.details.bookingId, "booking-1");
  });
});
