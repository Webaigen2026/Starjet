import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

import { bookingHasPaidCapture } from "./checkoutSession";
import { isTicketEligible } from "./ticketAccess";
import {
  getFullRefundIdempotencyKey,
  getPaymentRefundAuthRejection,
  getPaymentRefundEligibilityError,
  handlePaymentRefundRequest,
  type PaymentRefundStore,
  type RefundableBookingRow,
  type RefundablePaymentRow,
  type StripeRefundPort,
  type StripeRefundView,
} from "./paymentRefund";

const root = path.join(import.meta.dirname, "..", "..");

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

type World = {
  payment: RefundablePaymentRow;
  booking: RefundableBookingRow;
  availableSeats: number;
  stripeCalls: Array<{
    params: { payment_intent: string };
    options: { idempotencyKey: string };
  }>;
  issuedRefunds: Map<string, StripeRefundView>;
  stripeResult: StripeRefundView | Error;
  persistFailuresRemaining: number;
  failAfterPaymentUpdate: boolean;
  store: PaymentRefundStore;
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

function succeededRefund(
  overrides: Partial<StripeRefundView> = {}
): StripeRefundView {
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

function createWorld(
  options: {
    payment?: Partial<RefundablePaymentRow>;
    booking?: Partial<RefundableBookingRow>;
    stripeResult?: StripeRefundView | Error;
  } = {}
): World {
  const booking: RefundableBookingRow = {
    id: "booking-1",
    status: "FAILED",
    paymentStatus: "PAID",
    ...options.booking,
  };

  const payment: RefundablePaymentRow = {
    id: "pay-1",
    bookingId: booking.id,
    status: "PAID",
    amount: "123.45",
    currency: "USD",
    stripePaymentIntentId: "pi_1",
    ...options.payment,
  };

  const world: World = {
    payment,
    booking,
    availableSeats: 10,
    stripeCalls: [],
    issuedRefunds: new Map(),
    stripeResult: options.stripeResult ?? succeededRefund(),
    persistFailuresRemaining: 0,
    failAfterPaymentUpdate: false,
    store: {} as PaymentRefundStore,
  };

  const tx = {
    payment: {
      updateMany: async ({
        where,
        data,
      }: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        if (!matchesWhere(world.payment as unknown as Record<string, unknown>, where)) {
          return { count: 0 };
        }

        Object.assign(world.payment, data);

        if (world.failAfterPaymentUpdate) {
          throw new Error("booking update failed");
        }

        return { count: 1 };
      },
    },
    booking: {
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
  };

  world.store = {
    payment: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        if (world.payment.id !== where.id) {
          return null;
        }

        return {
          ...world.payment,
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
        payment: { ...world.payment },
        booking: { ...world.booking },
      };

      try {
        return await fn(tx);
      } catch (error) {
        Object.assign(world.payment, snapshot.payment);
        Object.assign(world.booking, snapshot.booking);
        throw error;
      }
    },
  };

  return world;
}

function stripeFor(world: World): StripeRefundPort {
  return {
    refunds: {
      create: async (params, options) => {
        world.stripeCalls.push({ params, options });

        if (world.stripeResult instanceof Error) {
          throw world.stripeResult;
        }

        const existing = world.issuedRefunds.get(options.idempotencyKey);

        if (existing) {
          return existing;
        }

        world.issuedRefunds.set(options.idempotencyKey, world.stripeResult);
        return world.stripeResult;
      },
    },
  };
}

function authFor(
  user: { id?: string; role?: string } | null,
  unauthorizedStatus?: number
) {
  return async () => {
    if (!user) {
      return {
        authorized: false as const,
        response: NextResponse.json(
          {
            success: false,
            message: "Authentication required.",
          },
          {
            status: unauthorizedStatus ?? 401,
          }
        ),
      };
    }

    if (user.role !== "ADMIN") {
      return {
        authorized: false as const,
        response: NextResponse.json(
          {
            success: false,
            message:
              "You do not have permission to perform this operation.",
          },
          {
            status: 403,
          }
        ),
      };
    }

    return {
      authorized: true as const,
      user,
    };
  };
}

async function postRefund(
  world: World,
  options: {
    user?: { id?: string; role?: string } | null;
    body?: unknown;
    paymentId?: string;
    configured?: boolean;
  } = {}
) {
  const user = options.user === undefined
    ? { id: "admin-1", role: "ADMIN" }
    : options.user;

  return handlePaymentRefundRequest(
    new Request("http://localhost/api/payments/pay-1/refund", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(options.body ?? {}),
    }),
    options.paymentId ?? "pay-1",
    {
      getAuth: authFor(user),
      isStripeConfigured: () => options.configured ?? true,
      getStripe: () => stripeFor(world),
      db: world.store,
    }
  );
}

describe("payment refund authorization", () => {
  it("rejects anonymous callers", async () => {
    const world = createWorld();
    const response = await postRefund(world, { user: null });

    assert.equal(getPaymentRefundAuthRejection(null)?.status, 401);
    assert.equal(response.status, 401);
    assert.equal(world.payment.status, "PAID");
    assert.equal(world.stripeCalls.length, 0);
  });

  it("rejects CUSTOMER callers", async () => {
    const world = createWorld();
    const response = await postRefund(world, {
      user: { id: "user-1", role: "CUSTOMER" },
    });

    assert.equal(
      getPaymentRefundAuthRejection({ role: "CUSTOMER" })?.status,
      403
    );
    assert.equal(response.status, 403);
    assert.equal(world.stripeCalls.length, 0);
  });

  it("rejects STAFF callers", async () => {
    const world = createWorld();
    const response = await postRefund(world, {
      user: { id: "staff-1", role: "STAFF" },
    });

    assert.equal(
      getPaymentRefundAuthRejection({ role: "STAFF" })?.status,
      403
    );
    assert.equal(response.status, 403);
    assert.equal(world.stripeCalls.length, 0);
  });

  it("lets ADMIN reach an eligible refund path", async () => {
    const world = createWorld();
    const response = await postRefund(world);

    assert.equal(getPaymentRefundAuthRejection({ role: "ADMIN" }), null);
    assert.equal(response.status, 200);
    assert.equal(world.payment.status, "REFUNDED");
    assert.equal(world.stripeCalls.length, 1);
  });
});

describe("payment refund eligibility", () => {
  it("fails safely for a nonexistent Payment", async () => {
    const world = createWorld();
    const response = await postRefund(world, { paymentId: "missing" });

    assert.equal(response.status, 404);
    assert.equal(world.payment.status, "PAID");
    assert.equal(world.stripeCalls.length, 0);
  });

  it("does not refund a PENDING Payment", async () => {
    const world = createWorld({
      payment: {
        status: "PENDING",
      },
    });
    const response = await postRefund(world);

    assert.equal(response.status, 409);
    assert.equal(world.payment.status, "PENDING");
    assert.equal(world.stripeCalls.length, 0);
  });

  it("does not refund a FAILED Payment", async () => {
    const world = createWorld({
      payment: {
        status: "FAILED",
      },
    });
    const response = await postRefund(world);

    assert.equal(response.status, 409);
    assert.equal(world.payment.status, "FAILED");
    assert.equal(world.stripeCalls.length, 0);
  });

  it("is idempotent for an already REFUNDED Payment and does not call Stripe again", async () => {
    const world = createWorld({
      payment: {
        status: "REFUNDED",
      },
      booking: {
        paymentStatus: "REFUNDED",
      },
    });
    const response = await postRefund(world);

    assert.equal(response.status, 200);
    assert.equal(world.payment.status, "REFUNDED");
    assert.equal(world.booking.paymentStatus, "REFUNDED");
    assert.equal(world.stripeCalls.length, 0);
  });

  it("aligns Booking.paymentStatus when Payment is already REFUNDED", async () => {
    const world = createWorld({
      payment: {
        status: "REFUNDED",
      },
      booking: {
        status: "FAILED",
        paymentStatus: "PAID",
      },
    });
    const response = await postRefund(world);

    assert.equal(response.status, 200);
    assert.equal(world.payment.status, "REFUNDED");
    assert.equal(world.booking.paymentStatus, "REFUNDED");
    assert.equal(world.booking.status, "FAILED");
    assert.equal(world.stripeCalls.length, 0);
  });

  it("requires reconciliation when a PAID Payment has no PaymentIntent", async () => {
    const world = createWorld({
      payment: {
        stripePaymentIntentId: null,
      },
    });
    const response = await postRefund(world);
    const body = await response.json();

    assert.equal(response.status, 409);
    assert.match(String(body.message), /reconciliation/i);
    assert.equal(world.payment.status, "PAID");
    assert.equal(world.stripeCalls.length, 0);
    assert.equal(
      getPaymentRefundEligibilityError(world.payment, world.booking)?.code,
      "RECONCILIATION_REQUIRED"
    );
  });
});

describe("payment refund authority and Stripe semantics", () => {
  it("ignores client-provided amount, currency, and PaymentIntent", async () => {
    const world = createWorld();

    const response = await postRefund(world, {
      body: {
        amount: 1,
        currency: "eur",
        stripePaymentIntentId: "pi_from_browser",
        payment_intent: "pi_from_browser",
      },
    });

    assert.equal(response.status, 200);
    assert.equal(world.stripeCalls.length, 1);
    assert.deepEqual(world.stripeCalls[0]?.params, {
      payment_intent: "pi_1",
    });
    assert.equal(
      Object.prototype.hasOwnProperty.call(
        world.stripeCalls[0]?.params ?? {},
        "amount"
      ),
      false
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(
        world.stripeCalls[0]?.params ?? {},
        "currency"
      ),
      false
    );
  });

  it("refunds using Payment.stripePaymentIntentId and a deterministic idempotency key", async () => {
    const world = createWorld();
    const response = await postRefund(world);

    assert.equal(response.status, 200);
    assert.equal(world.stripeCalls[0]?.params.payment_intent, "pi_1");
    assert.equal(
      world.stripeCalls[0]?.options.idempotencyKey,
      getFullRefundIdempotencyKey("pay-1")
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(
        world.stripeCalls[0]?.params ?? {},
        "idempotencyKey"
      ),
      false
    );
    assert.equal(
      getFullRefundIdempotencyKey("pay-1"),
      "starjet:payment:pay-1:full-refund:v1"
    );
  });

  it("cannot create two financial refunds for identical requests", async () => {
    const world = createWorld();

    const first = await postRefund(world);
    const second = await postRefund(world);
    const parallelWorld = createWorld();
    const [left, right] = await Promise.all([
      postRefund(parallelWorld),
      postRefund(parallelWorld),
    ]);

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(world.stripeCalls.length, 1);
    assert.equal(world.payment.status, "REFUNDED");
    assert.equal(left.status, 200);
    assert.equal(right.status, 200);
    assert.equal(
      new Set(
        parallelWorld.stripeCalls.map((call) => call.options.idempotencyKey)
      ).size,
      1
    );
    assert.equal(parallelWorld.payment.status, "REFUNDED");
  });

  it("marks Payment REFUNDED only after an authoritative succeeded Stripe refund", async () => {
    const world = createWorld();
    const response = await postRefund(world);

    assert.equal(response.status, 200);
    assert.equal(world.payment.status, "REFUNDED");
    assert.equal(world.booking.paymentStatus, "REFUNDED");
  });

  it("does not mark REFUNDED when Stripe fails the refund", async () => {
    const world = createWorld({
      stripeResult: succeededRefund({ status: "failed" }),
    });
    const response = await postRefund(world);

    assert.equal(response.status, 409);
    assert.equal(world.payment.status, "PAID");
    assert.equal(world.booking.paymentStatus, "PAID");
  });

  it("does not mark REFUNDED when Stripe returns a pending refund", async () => {
    const world = createWorld({
      stripeResult: succeededRefund({ status: "pending" }),
    });
    const response = await postRefund(world);

    assert.equal(response.status, 409);
    assert.equal(world.payment.status, "PAID");
  });

  it("does not mark REFUNDED when Stripe or the network errors", async () => {
    const world = createWorld({
      stripeResult: new Error("ECONNRESET"),
    });
    const response = await postRefund(world);

    assert.equal(response.status, 502);
    assert.equal(world.payment.status, "PAID");
  });
});

describe("payment refund Stripe-success / local-persistence boundary", () => {
  it("keeps local PAID state when Stripe succeeded but Payment DB update fails", async () => {
    const world = createWorld();
    world.persistFailuresRemaining = 1;

    const response = await postRefund(world);
    const body = await response.json();

    assert.equal(response.status, 500);
    assert.equal(body.code, "REFUND_PERSISTENCE_FAILED");
    assert.match(String(body.message), /Retry the same refund/i);
    assert.match(String(body.message), /do not assume the money is unrefunded/i);
    assert.equal(world.payment.status, "PAID");
    assert.equal(world.booking.paymentStatus, "PAID");
    assert.equal(world.issuedRefunds.size, 1);
  });

  it("retries after persist failure with the same idempotency key and finishes local REFUNDED state", async () => {
    const world = createWorld();
    world.persistFailuresRemaining = 1;

    const first = await postRefund(world);
    const second = await postRefund(world);

    assert.equal(first.status, 500);
    assert.equal(second.status, 200);
    assert.equal(world.stripeCalls.length, 2);
    assert.equal(
      world.stripeCalls[0]?.options.idempotencyKey,
      world.stripeCalls[1]?.options.idempotencyKey
    );
    assert.equal(
      world.stripeCalls[1]?.options.idempotencyKey,
      getFullRefundIdempotencyKey("pay-1")
    );
    assert.equal(world.issuedRefunds.size, 1);
    assert.equal(world.payment.status, "REFUNDED");
    assert.equal(world.booking.paymentStatus, "REFUNDED");
  });

  it("cannot create a second financial refund after Stripe success and DB failure", async () => {
    const world = createWorld();
    world.persistFailuresRemaining = 1;

    await postRefund(world);
    await postRefund(world);

    assert.equal(world.issuedRefunds.size, 1);
    assert.equal(
      new Set(world.stripeCalls.map((call) => call.options.idempotencyKey)).size,
      1
    );
  });

  it("persists Payment and Booking.paymentStatus atomically", async () => {
    const world = createWorld();
    world.failAfterPaymentUpdate = true;

    const response = await postRefund(world);

    assert.equal(response.status, 500);
    assert.equal(world.payment.status, "PAID");
    assert.equal(world.booking.paymentStatus, "PAID");
    assert.equal(world.booking.status, "FAILED");
  });

  it("leaves both local states unchanged when the refund transaction fails", async () => {
    const world = createWorld();
    world.persistFailuresRemaining = 1;

    await postRefund(world);

    assert.equal(world.payment.status, "PAID");
    assert.equal(world.booking.paymentStatus, "PAID");
    assert.equal(world.availableSeats, 10);
  });

  it("does not mark REFUNDED when Stripe succeeded but the response cannot be verified", async () => {
    const world = createWorld({
      stripeResult: succeededRefund({
        amount: 1,
        currency: "eur",
        payment_intent: "pi_other",
      }),
    });
    const response = await postRefund(world);
    const body = await response.json();

    assert.equal(response.status, 409);
    assert.equal(body.code, "STRIPE_REFUND_UNVERIFIED");
    assert.match(String(body.message), /reconciliation/i);
    assert.match(String(body.message), /do not assume the money is unrefunded/i);
    assert.equal(world.payment.status, "PAID");
    assert.equal(world.booking.paymentStatus, "PAID");
  });

  it("retries a verification mismatch with the same idempotency key", async () => {
    const world = createWorld({
      stripeResult: succeededRefund({ amount: 1 }),
    });

    const first = await postRefund(world);
    const second = await postRefund(world);
    const firstBody = await first.json();

    assert.equal(first.status, 409);
    assert.equal(firstBody.code, "STRIPE_REFUND_UNVERIFIED");
    assert.equal(second.status, 409);
    assert.equal(world.stripeCalls.length, 2);
    assert.equal(
      world.stripeCalls[0]?.options.idempotencyKey,
      world.stripeCalls[1]?.options.idempotencyKey
    );
    assert.equal(world.issuedRefunds.size, 1);
    assert.equal(world.payment.status, "PAID");
  });
});

describe("payment refund booking and inventory boundaries", () => {
  it("does not resurrect a FAILED late-capture booking", async () => {
    const world = createWorld({
      booking: {
        status: "FAILED",
        paymentStatus: "PAID",
      },
    });
    const response = await postRefund(world);

    assert.equal(response.status, 200);
    assert.equal(world.booking.status, "FAILED");
    assert.notEqual(world.booking.status, "CONFIRMED");
    assert.equal(world.booking.paymentStatus, "REFUNDED");
  });

  it("does not resurrect a CANCELLED late-capture booking", async () => {
    const world = createWorld({
      booking: {
        status: "CANCELLED",
        paymentStatus: "PAID",
      },
    });
    const response = await postRefund(world);

    assert.equal(response.status, 200);
    assert.equal(world.booking.status, "CANCELLED");
    assert.notEqual(world.booking.status, "CONFIRMED");
    assert.equal(world.booking.paymentStatus, "REFUNDED");
  });

  it("does not manipulate inventory from the refund endpoint", async () => {
    const world = createWorld();
    await postRefund(world);

    const helper = readProjectFile("app/lib/paymentRefund.ts");
    const route = readProjectFile(
      "app/api/payments/[paymentId]/refund/route.ts"
    );

    assert.equal(world.availableSeats, 10);
    assert.equal(helper.includes("availableSeats"), false);
    assert.equal(helper.includes("claimAndReleaseInventory"), false);
    assert.equal(helper.includes("seat"), false);
    assert.equal(route.includes("availableSeats"), false);
    assert.equal(route.includes("claimAndReleaseInventory"), false);
  });

  it("rejects refund of an active booking until it is cancelled", async () => {
    for (const status of ["CONFIRMED", "CHECKED_IN", "BOARDED", "COMPLETED"]) {
      const world = createWorld({
        booking: {
          status,
          paymentStatus: "PAID",
        },
      });
      const response = await postRefund(world);

      assert.equal(response.status, 409);
      assert.equal(world.payment.status, "PAID");
      assert.equal(world.booking.status, status);
      assert.equal(world.stripeCalls.length, 0);
    }
  });
});

describe("payment refund ticket and route architecture", () => {
  it("does not treat a refunded attempt as a paid ticket capture", () => {
    assert.equal(
      bookingHasPaidCapture({
        paymentStatus: "PAID",
        payments: [{ status: "REFUNDED" }],
      }),
      false
    );
    assert.equal(
      isTicketEligible({
        status: "CONFIRMED",
        paymentStatus: "REFUNDED",
        payments: [{ status: "REFUNDED" }],
      }),
      false
    );
  });

  it("is an ADMIN-only Payment-level refund route", () => {
    const route = readProjectFile(
      "app/api/payments/[paymentId]/refund/route.ts"
    );
    const helper = readProjectFile("app/lib/paymentRefund.ts");

    assert.equal(route.includes("requireAdmin"), true);
    assert.equal(route.includes("requireOperationsStaff"), false);
    assert.equal(route.includes("requireAuthenticatedUser"), false);
    assert.equal(helper.includes("Booking.stripePaymentIntentId"), false);
    assert.equal(helper.includes("stripePaymentIntentId"), true);
  });
});
