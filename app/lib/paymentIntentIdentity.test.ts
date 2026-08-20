import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { claimAndReleaseInventory } from "./reservationLifecycle";
import { isTicketEligible } from "./ticketAccess";
import { buildCheckoutSessionRequest } from "../checkout/checkoutPayment";

const root = path.join(import.meta.dirname, "..", "..");

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("cancellation does not fake Stripe refunds", () => {
  it("does not mark Payment or paymentStatus REFUNDED on cancel", () => {
    const cancel = readProjectFile("app/api/bookings/[id]/cancel/route.ts");

    assert.equal(cancel.includes('status: "REFUNDED"'), false);
    assert.equal(cancel.includes("paymentStatus: \"REFUNDED\""), false);
    assert.equal(cancel.includes("refundStatus: \"NOT_REFUNDED\""), true);
    assert.equal(cancel.includes("claimAndReleaseInventory"), true);
  });

  it("keeps a captured Payment PAID after booking cancellation", () => {
    const cancel = readProjectFile("app/api/bookings/[id]/cancel/route.ts");

    assert.equal(cancel.includes("Captured Payments stay PAID"), true);
    assert.equal(cancel.includes("tx.payment.updateMany"), false);
  });

  it("still releases inventory only when the cancel claim wins", async () => {
    let incrementBy = 0;
    let seatsCleared = 0;
    let updateCalls = 0;

    const tx = {
      booking: {
        updateMany: async () => {
          updateCalls += 1;
          return { count: updateCalls === 1 ? 1 : 0 };
        },
      },
      seat: {
        updateMany: async () => {
          seatsCleared += 1;
          return { count: 2 };
        },
      },
      flightSchedule: {
        findUnique: async () => ({
          id: "schedule-1",
          availableSeats: 10,
          aircraft: { capacity: 180 },
        }),
        update: async ({
          data,
        }: {
          data: { availableSeats?: { increment?: number } };
        }) => {
          if (data.availableSeats?.increment) {
            incrementBy += data.availableSeats.increment;
          }

          return {
            availableSeats: 10 + incrementBy,
            aircraft: { capacity: 180 },
          };
        },
      },
    };

    const first = await claimAndReleaseInventory(tx as never, {
      bookingId: "booking-1",
      scheduleId: "schedule-1",
      passengersCount: 2,
      fromWhere: { id: "booking-1" },
      toStatus: "CANCELLED",
    });
    const second = await claimAndReleaseInventory(tx as never, {
      bookingId: "booking-1",
      scheduleId: "schedule-1",
      passengersCount: 2,
      fromWhere: { id: "booking-1" },
      toStatus: "CANCELLED",
    });

    assert.equal(first, "won");
    assert.equal(second, "lost");
    assert.equal(incrementBy, 2);
    assert.equal(seatsCleared, 1);
  });
});

describe("PaymentIntent identity boundaries", () => {
  it("does not let the browser set stripePaymentIntentId on checkout-session", () => {
    const request = buildCheckoutSessionRequest("booking-1");
    const checkout = readProjectFile(
      "app/api/bookings/[id]/checkout-session/route.ts"
    );

    assert.equal(request.init.body, undefined);
    assert.equal(
      JSON.stringify(request.init).includes("stripePaymentIntentId"),
      false
    );
    assert.equal(checkout.includes("stripePaymentIntentId"), false);
    assert.equal(
      checkout.includes("await request.json().catch(() => null)"),
      true
    );
  });

  it("does not invent PaymentIntent ids in the checkout-session helper", () => {
    const helper = readProjectFile("app/lib/checkoutSession.ts");

    assert.equal(helper.includes("stripePaymentIntentId"), false);
    assert.equal(helper.includes("payment_intent"), false);
  });

  it("keeps FAILED/CANCELLED late captures off the ticket page", () => {
    assert.equal(
      isTicketEligible({
        status: "FAILED",
        paymentStatus: "PAID",
        payments: [{ status: "PAID" }],
      }),
      false
    );
    assert.equal(
      isTicketEligible({
        status: "CANCELLED",
        paymentStatus: "PAID",
        payments: [{ status: "PAID" }],
      }),
      false
    );
  });

  it("adds a unique Payment.stripePaymentIntentId migration", () => {
    const sql = readProjectFile(
      "prisma/migrations/20260818223000_payment_stripe_payment_intent_id/migration.sql"
    );
    const schema = readProjectFile("prisma/schema.prisma");

    assert.equal(sql.includes("stripePaymentIntentId"), true);
    assert.equal(sql.includes("Payment_stripePaymentIntentId_key"), true);
    assert.equal(schema.includes("stripePaymentIntentId String? @unique"), true);
  });
});
