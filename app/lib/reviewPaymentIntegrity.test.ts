import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  calculateBookingTotal,
  calculateTravelProtectionAmount,
} from "./bookingPricing";
import {
  isActivePendingStripeAttempt,
  type PaymentAttempt,
  type PaymentStartBooking,
} from "./checkoutSession";
import { resolveChargeFromBooking } from "./stripeMoney";
import {
  canApplyReviewPricingUpdate,
  getReviewPricingLockRejection,
  hasUnresolvedStripePaymentAttempt,
  reviewPricingUpdateWhere,
} from "./reviewPaymentIntegrity";

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
    totalAmount: "100.00",
    currency: "USD",
    payments: [],
    ...overrides,
  };
}

function pendingStripePayment(
  overrides: Partial<PaymentAttempt> = {}
): PaymentAttempt {
  return {
    id: "pay-1",
    bookingId: "booking-1",
    status: "PENDING",
    provider: "STRIPE",
    providerRef: "cs_open",
    amount: "100.00",
    currency: "USD",
    ...overrides,
  };
}

type ReviewBookingState = {
  id: string;
  paymentStatus: string;
  totalAmount: string;
  travelProtection: boolean;
  travelProtectionAmount: number;
  promoCode: string | null;
  discountAmount: number;
  termsAccepted: boolean;
  baseFare: number;
  passengersCount: number;
  taxes: number;
  serviceFee: number;
  payments: PaymentAttempt[];
};

function createReviewStore(initial: ReviewBookingState) {
  let booking = { ...initial, payments: [...initial.payments] };
  const paymentWrites: Array<{ op: string; data: Record<string, unknown> }> =
    [];

  return {
    get booking() {
      return booking;
    },
    paymentWrites,
    applyReviewPatch(input: {
      travelProtection: boolean;
      promoCode: string | null;
      termsAccepted: boolean;
    }) {
      const lock = getReviewPricingLockRejection({
        id: booking.id,
        status: "DRAFT",
        paymentStatus: booking.paymentStatus,
        reservationExpiresAt: new Date("2026-08-17T21:20:00.000Z"),
        totalAmount: booking.totalAmount,
        currency: "USD",
        payments: booking.payments,
      });

      if (lock) {
        return {
          ok: false as const,
          status: lock.status,
          message: lock.message,
        };
      }

      const travelProtectionAmount = calculateTravelProtectionAmount(
        input.travelProtection,
        booking.passengersCount
      );

      const calculatedTotal = String(
        calculateBookingTotal({
          baseFarePerPassenger: booking.baseFare,
          passengersCount: booking.passengersCount,
          taxes: booking.taxes,
          serviceFee: booking.serviceFee,
          travelProtectionAmount,
          discountAmount: 0,
        })
      );

      if (!canApplyReviewPricingUpdate(booking)) {
        return {
          ok: false as const,
          status: 409,
          message:
            "Payment is already in progress. Booking choices cannot be changed until payment completes or the checkout session expires.",
        };
      }

      booking = {
        ...booking,
        travelProtection: input.travelProtection,
        travelProtectionAmount: input.travelProtection
          ? travelProtectionAmount
          : 0,
        promoCode: input.promoCode,
        discountAmount: 0,
        termsAccepted: input.termsAccepted,
        totalAmount: calculatedTotal,
      };

      return {
        ok: true as const,
        booking,
      };
    },
    insertPendingStripePayment(amount: string) {
      if (
        booking.payments.some(
          (payment) =>
            payment.status === "PENDING" && payment.provider === "STRIPE"
        )
      ) {
        return {
          ok: false as const,
          reason: "unique",
        };
      }

      const payment = pendingStripePayment({
        id: `pay-${booking.payments.length + 1}`,
        amount,
        providerRef: null,
      });

      booking = {
        ...booking,
        payments: [...booking.payments, payment],
      };

      paymentWrites.push({
        op: "create",
        data: {
          status: "PENDING",
          provider: "STRIPE",
          amount,
        },
      });

      return {
        ok: true as const,
        payment,
      };
    },
  };
}

describe("review pricing lock", () => {
  it("allows review pricing updates before any payment attempt exists", () => {
    assert.equal(
      getReviewPricingLockRejection(draftBooking()),
      null
    );
    assert.equal(canApplyReviewPricingUpdate(draftBooking()), true);

    const store = createReviewStore({
      id: "booking-1",
      paymentStatus: "PENDING",
      totalAmount: "100.00",
      travelProtection: false,
      travelProtectionAmount: 0,
      promoCode: null,
      discountAmount: 0,
      termsAccepted: false,
      baseFare: 50,
      passengersCount: 2,
      taxes: 0,
      serviceFee: 0,
      payments: [],
    });

    const result = store.applyReviewPatch({
      travelProtection: true,
      promoCode: "SAVE10",
      termsAccepted: true,
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.booking.totalAmount, "149.98");
      assert.equal(result.booking.travelProtection, true);
    }
  });

  it("blocks repricing when an unresolved PENDING Stripe attempt exists", () => {
    const pending = pendingStripePayment();
    const rejection = getReviewPricingLockRejection(
      draftBooking({ payments: [pending] })
    );

    assert.equal(rejection?.status, 409);
    assert.match(
      rejection?.message ?? "",
      /Payment is already in progress/i
    );
    assert.equal(hasUnresolvedStripePaymentAttempt([pending]), true);
    assert.equal(isActivePendingStripeAttempt(pending), true);
  });

  it("does not change Booking.totalAmount when repricing is blocked", () => {
    const store = createReviewStore({
      id: "booking-1",
      paymentStatus: "PENDING",
      totalAmount: "100.00",
      travelProtection: false,
      travelProtectionAmount: 0,
      promoCode: null,
      discountAmount: 0,
      termsAccepted: false,
      baseFare: 50,
      passengersCount: 2,
      taxes: 0,
      serviceFee: 0,
      payments: [pendingStripePayment()],
    });

    const before = store.booking.totalAmount;
    const result = store.applyReviewPatch({
      travelProtection: true,
      promoCode: null,
      termsAccepted: true,
    });

    assert.equal(result.ok, false);
    assert.equal(store.booking.totalAmount, before);
    assert.equal(store.booking.travelProtection, false);
  });

  it("does not change Payment.amount when repricing is blocked", () => {
    const store = createReviewStore({
      id: "booking-1",
      paymentStatus: "PENDING",
      totalAmount: "100.00",
      travelProtection: false,
      travelProtectionAmount: 0,
      promoCode: null,
      discountAmount: 0,
      termsAccepted: false,
      baseFare: 50,
      passengersCount: 2,
      taxes: 0,
      serviceFee: 0,
      payments: [pendingStripePayment({ amount: "100.00" })],
    });

    store.applyReviewPatch({
      travelProtection: true,
      promoCode: null,
      termsAccepted: true,
    });

    assert.equal(store.booking.payments[0]?.amount, "100.00");
    assert.equal(store.booking.payments.length, 1);
  });

  it("does not mark Payment FAILED to unlock editing", () => {
    const store = createReviewStore({
      id: "booking-1",
      paymentStatus: "PENDING",
      totalAmount: "100.00",
      travelProtection: false,
      travelProtectionAmount: 0,
      promoCode: null,
      discountAmount: 0,
      termsAccepted: false,
      baseFare: 50,
      passengersCount: 2,
      taxes: 0,
      serviceFee: 0,
      payments: [pendingStripePayment()],
    });

    store.applyReviewPatch({
      travelProtection: true,
      promoCode: null,
      termsAccepted: true,
    });

    assert.equal(store.booking.payments[0]?.status, "PENDING");
    assert.equal(
      store.paymentWrites.some((write) => write.data.status === "FAILED"),
      false
    );
  });

  it("does not create another Payment when repricing is blocked", () => {
    const store = createReviewStore({
      id: "booking-1",
      paymentStatus: "PENDING",
      totalAmount: "100.00",
      travelProtection: false,
      travelProtectionAmount: 0,
      promoCode: null,
      discountAmount: 0,
      termsAccepted: false,
      baseFare: 50,
      passengersCount: 2,
      taxes: 0,
      serviceFee: 0,
      payments: [pendingStripePayment()],
    });

    store.applyReviewPatch({
      travelProtection: true,
      promoCode: null,
      termsAccepted: true,
    });

    assert.equal(store.booking.payments.length, 1);
    assert.equal(
      store.paymentWrites.filter((write) => write.op === "create").length,
      0
    );
  });

  it("does not call Stripe from the review lock path", () => {
    assert.equal(
      readProjectFile("app/api/bookings/[id]/review/route.ts").includes(
        "stripe"
      ),
      false
    );
  });

  it("blocks repricing for an already paid booking", () => {
    const rejection = getReviewPricingLockRejection(
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
      })
    );

    assert.equal(rejection?.status, 409);
    assert.match(
      rejection?.message ?? "",
      /already been paid/i
    );

    const store = createReviewStore({
      id: "booking-1",
      paymentStatus: "PAID",
      totalAmount: "100.00",
      travelProtection: false,
      travelProtectionAmount: 0,
      promoCode: null,
      discountAmount: 0,
      termsAccepted: true,
      baseFare: 50,
      passengersCount: 2,
      taxes: 0,
      serviceFee: 0,
      payments: [
        {
          id: "pay-paid",
          status: "PAID",
          provider: "STRIPE",
          providerRef: "cs_paid",
          amount: "100.00",
          currency: "USD",
        },
      ],
    });

    const result = store.applyReviewPatch({
      travelProtection: true,
      promoCode: null,
      termsAccepted: true,
    });

    assert.equal(result.ok, false);
    assert.equal(store.booking.totalAmount, "100.00");
  });
});

describe("review route payment integrity wiring", () => {
  const reviewRoute = readProjectFile("app/api/bookings/[id]/review/route.ts");

  it("loads payments and uses the review pricing lock helpers", () => {
    assert.equal(reviewRoute.includes("include: {"), true);
    assert.equal(reviewRoute.includes("payments: true"), true);
    assert.equal(reviewRoute.includes("getReviewPricingLockRejection"), true);
    assert.equal(reviewRoute.includes("reviewPricingUpdateWhere"), true);
    assert.equal(reviewRoute.includes("updateMany"), true);
  });

  it("does not call Stripe or mutate Payment rows from review", () => {
    assert.equal(reviewRoute.includes("stripe"), false);
    assert.equal(reviewRoute.includes("prisma.payment"), false);
    assert.equal(reviewRoute.includes("payments.update"), false);
    assert.equal(reviewRoute.includes("payments.create"), false);
    assert.equal(reviewRoute.includes("checkout-session"), false);
  });

  it("recalculates authoritative pricing server-side instead of trusting browser totals", () => {
    assert.equal(reviewRoute.includes("calculateBookingTotal"), true);
    assert.equal(reviewRoute.includes("calculateTravelProtectionAmount"), true);
    assert.equal(reviewRoute.includes("body.totalAmount"), false);
    assert.equal(reviewRoute.includes("totalAmountOverride"), false);
  });

  it("returns 409 when the atomic pricing update cannot apply", () => {
    assert.equal(reviewRoute.includes("updateResult.count !== 1"), true);
    assert.equal(reviewRoute.includes("status: 409"), true);
  });
});

describe("checkout-session recovery remains unchanged", () => {
  it("keeps retrieve-failure behavior in checkoutSession helper", () => {
    const helper = readProjectFile("app/lib/checkoutSession.ts");

    assert.equal(helper.includes("inspectExistingCheckoutSession"), true);
    assert.match(
      helper,
      /Unable to verify the existing checkout session/
    );
    assert.equal(
      helper.includes("does not mark Payment FAILED or create a replacement"),
      false
    );
  });

  it("does not alter checkout-session route recovery/idempotency wiring", () => {
    const checkoutRoute = readProjectFile(
      "app/api/bookings/[id]/checkout-session/route.ts"
    );
    const reviewRoute = readProjectFile("app/api/bookings/[id]/review/route.ts");

    assert.equal(checkoutRoute.includes("startBookingCheckoutSession"), true);
    assert.equal(
      checkoutRoute.includes("createPrismaCheckoutPaymentStore"),
      true
    );
    assert.equal(reviewRoute.includes("startBookingCheckoutSession"), false);
  });
});

describe("review pricing update predicate", () => {
  it("matches the updateMany guard used by the review route", () => {
    const where = reviewPricingUpdateWhere("booking-1");

    assert.deepEqual(where.id, "booking-1");
    assert.deepEqual(where.paymentStatus, { not: "PAID" });
    assert.deepEqual(where.payments.none.OR, [
      { status: "PAID" },
      { status: "PENDING", provider: "STRIPE" },
    ]);
  });

  it("blocks a PENDING Stripe attempt even before providerRef is set", () => {
    const rejection = getReviewPricingLockRejection(
      draftBooking({
        payments: [
          pendingStripePayment({
            providerRef: null,
          }),
        ],
      })
    );

    assert.equal(rejection?.status, 409);
  });
});

describe("review and checkout concurrency", () => {
  type CoordinatedBooking = {
    paymentStatus: string;
    totalAmount: string;
    currency: string;
    baseFare: number;
    passengersCount: number;
    taxes: number;
    serviceFee: number;
    travelProtection: boolean;
    payments: PaymentAttempt[];
  };

  function createCoordinatedReviewCheckout(initialTotal = "100.00") {
    const booking: CoordinatedBooking = {
      paymentStatus: "PENDING",
      totalAmount: initialTotal,
      currency: "USD",
      baseFare: 50,
      passengersCount: 2,
      taxes: 0,
      serviceFee: 0,
      travelProtection: false,
      payments: [],
    };

    let bookingLock: Promise<void> = Promise.resolve();
    let transactionActive = false;
    let stripeCalls = 0;

    async function withBookingLock<T>(fn: () => Promise<T> | T): Promise<T> {
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const previous = bookingLock;
      bookingLock = previous.then(() => gate);
      await previous;

      try {
        return await fn();
      } finally {
        release();
      }
    }

    async function applyReviewPatch(input: {
      travelProtection: boolean;
      termsAccepted: boolean;
    }) {
      return withBookingLock(async () => {
        const lock = getReviewPricingLockRejection({
          id: "booking-1",
          status: "DRAFT",
          paymentStatus: booking.paymentStatus,
          reservationExpiresAt: new Date("2026-08-17T21:20:00.000Z"),
          totalAmount: booking.totalAmount,
          currency: booking.currency,
          payments: booking.payments,
        });

        if (lock) {
          return {
            ok: false as const,
            status: lock.status,
            message: lock.message,
          };
        }

        if (!canApplyReviewPricingUpdate(booking)) {
          return {
            ok: false as const,
            status: 409,
            message:
              "Payment is already in progress. Booking choices cannot be changed until payment completes or the checkout session expires.",
          };
        }

        const travelProtectionAmount = calculateTravelProtectionAmount(
          input.travelProtection,
          booking.passengersCount
        );

        booking.travelProtection = input.travelProtection;
        booking.totalAmount = String(
          calculateBookingTotal({
            baseFarePerPassenger: booking.baseFare,
            passengersCount: booking.passengersCount,
            taxes: booking.taxes,
            serviceFee: booking.serviceFee,
            travelProtectionAmount,
            discountAmount: 0,
          })
        );

        return {
          ok: true as const,
          totalAmount: booking.totalAmount,
        };
      });
    }

    async function establishCheckoutPayment() {
      return withBookingLock(async () => {
        transactionActive = true;

        try {
          const charge = resolveChargeFromBooking({
            totalAmount: booking.totalAmount,
            currency: booking.currency,
          });

          if (
            booking.payments.some(
              (payment) =>
                payment.status === "PENDING" && payment.provider === "STRIPE"
            )
          ) {
            return {
              ok: false as const,
              reason: "existing",
              payment: booking.payments[0],
            };
          }

          const payment: PaymentAttempt = {
            id: `pay-${booking.payments.length + 1}`,
            bookingId: "booking-1",
            status: "PENDING",
            provider: "STRIPE",
            providerRef: null,
            amount: charge.amount,
            currency: charge.currency,
          };

          booking.payments.push(payment);

          return {
            ok: true as const,
            payment,
            charge,
          };
        } finally {
          transactionActive = false;
        }
      });
    }

    return {
      booking,
      get transactionActive() {
        return transactionActive;
      },
      get stripeCalls() {
        return stripeCalls;
      },
      callStripeOutsideTransaction() {
        assert.equal(transactionActive, false);
        stripeCalls += 1;
      },
      applyReviewPatch,
      establishCheckoutPayment,
    };
  }

  it("blocks review once a pending Stripe payment row exists", () => {
    const store = createReviewStore({
      id: "booking-1",
      paymentStatus: "PENDING",
      totalAmount: "100.00",
      travelProtection: false,
      travelProtectionAmount: 0,
      promoCode: null,
      discountAmount: 0,
      termsAccepted: false,
      baseFare: 50,
      passengersCount: 2,
      taxes: 0,
      serviceFee: 0,
      payments: [],
    });

    const inserted = store.insertPendingStripePayment("100.00");
    assert.equal(inserted.ok, true);

    const result = store.applyReviewPatch({
      travelProtection: true,
      promoCode: null,
      termsAccepted: true,
    });

    assert.equal(result.ok, false);
    assert.equal(store.booking.totalAmount, "100.00");
    assert.equal(store.booking.payments[0]?.amount, "100.00");
  });

  it("uses the updated authoritative amount when review wins first", async () => {
    const coordinated = createCoordinatedReviewCheckout("100.00");

    const reviewResult = await coordinated.applyReviewPatch({
      travelProtection: true,
      termsAccepted: true,
    });

    assert.equal(reviewResult.ok, true);
    assert.equal(coordinated.booking.totalAmount, "149.98");

    const checkoutResult = await coordinated.establishCheckoutPayment();

    assert.equal(checkoutResult.ok, true);
    if (checkoutResult.ok) {
      assert.equal(checkoutResult.payment.amount, "149.98");
      assert.equal(checkoutResult.charge.amountCents, 14998);
    }
  });

  it("returns 409 for review when checkout establishes the pending payment first", async () => {
    const coordinated = createCoordinatedReviewCheckout("100.00");

    const checkoutResult = await coordinated.establishCheckoutPayment();
    assert.equal(checkoutResult.ok, true);

    const reviewResult = await coordinated.applyReviewPatch({
      travelProtection: true,
      termsAccepted: true,
    });

    assert.equal(reviewResult.ok, false);
    if (!reviewResult.ok) {
      assert.equal(reviewResult.status, 409);
    }

    assert.equal(coordinated.booking.totalAmount, "100.00");
    assert.equal(coordinated.booking.payments[0]?.amount, "100.00");
  });

  it("cannot persist a stale pre-review Payment.amount under coordinated locking", async () => {
    const coordinated = createCoordinatedReviewCheckout("100.00");

    const [checkoutResult, reviewResult] = await Promise.all([
      coordinated.establishCheckoutPayment(),
      coordinated.applyReviewPatch({
        travelProtection: true,
        termsAccepted: true,
      }),
    ]);

    assert.equal(
      coordinated.booking.payments[0]?.amount === coordinated.booking.totalAmount,
      true
    );

    if (reviewResult.ok) {
      assert.equal(checkoutResult.ok, true);
      assert.equal(coordinated.booking.totalAmount, "149.98");
      assert.equal(coordinated.booking.payments[0]?.amount, "149.98");
    } else {
      assert.equal(checkoutResult.ok, true);
      assert.equal(coordinated.booking.totalAmount, "100.00");
      assert.equal(coordinated.booking.payments[0]?.amount, "100.00");
      assert.equal(reviewResult.status, 409);
    }
  });

  it("keeps Stripe outside the payment-establishment transaction boundary", async () => {
    const coordinated = createCoordinatedReviewCheckout("100.00");

    await coordinated.establishCheckoutPayment();
    coordinated.callStripeOutsideTransaction();

    assert.equal(coordinated.transactionActive, false);
    assert.equal(coordinated.stripeCalls, 1);
  });
});

describe("browser-supplied totals cannot bypass the lock", () => {
  it("derives totalAmount only from server booking inputs", () => {
    const store = createReviewStore({
      id: "booking-1",
      paymentStatus: "PENDING",
      totalAmount: "100.00",
      travelProtection: false,
      travelProtectionAmount: 0,
      promoCode: null,
      discountAmount: 0,
      termsAccepted: false,
      baseFare: 50,
      passengersCount: 2,
      taxes: 0,
      serviceFee: 0,
      payments: [],
    });

    const result = store.applyReviewPatch({
      travelProtection: true,
      promoCode: null,
      termsAccepted: true,
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.booking.totalAmount, "149.98");
    }

    const reviewRoute = readProjectFile("app/api/bookings/[id]/review/route.ts");
    assert.equal(reviewRoute.includes("body.totalAmount"), false);
  });
});
