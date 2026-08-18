import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { authorizeBookingAccess } from "../lib/authorization";
import {
  buildCheckoutSessionRequest,
  checkoutLoginPath,
  checkoutSessionRequestHasMoneyFields,
  CHECKOUT_POLL_INTERVAL_MS,
  CHECKOUT_POLL_MAX_ATTEMPTS,
  createExclusiveRunner,
  fetchAuthoritativeBooking,
  hasOpenStripeAttempt,
  isSafeCheckoutRedirectUrl,
  isTicketEligible,
  isTransientInitializationConflict,
  pollAuthoritativeBooking,
  requestCheckoutSession,
  requestCheckoutSessionWithTransientRetry,
  resolveCheckoutView,
  type CheckoutPaymentSnapshot,
} from "./checkoutPayment";

const root = path.join(import.meta.dirname, "..", "..");

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function snapshot(
  overrides: Partial<CheckoutPaymentSnapshot> = {}
): CheckoutPaymentSnapshot {
  return {
    id: "booking-1",
    status: "DRAFT",
    paymentStatus: "PENDING",
    payments: [
      {
        status: "PENDING",
        provider: "STRIPE",
        providerRef: null,
      },
    ],
    ...overrides,
  };
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

describe("checkout session request", () => {
  it("calls only the booking-scoped checkout-session endpoint", () => {
    const request = buildCheckoutSessionRequest("booking-1");

    assert.equal(
      request.url,
      "/api/bookings/booking-1/checkout-session"
    );
    assert.equal(request.init.method, "POST");
    assert.equal(request.init.body, undefined);
  });

  it("does not send amount, currency, or total", () => {
    const request = buildCheckoutSessionRequest("booking-1");

    assert.equal(checkoutSessionRequestHasMoneyFields(request.init), false);
    assert.equal(
      JSON.stringify(request.init).includes("amount"),
      false
    );
    assert.equal(
      JSON.stringify(request.init).includes("currency"),
      false
    );
    assert.equal(
      JSON.stringify(request.init).includes("totalAmount"),
      false
    );
  });
});

describe("Pay redirect and errors", () => {
  it("redirects only to the returned data.url", async () => {
    const result = await requestCheckoutSession("booking-1", {
      fetch: async () =>
        jsonResponse(201, {
          success: true,
          data: {
            url: "https://checkout.stripe.test/cs_live",
          },
        }),
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.url, "https://checkout.stripe.test/cs_live");
      assert.equal(isSafeCheckoutRedirectUrl(result.url), true);
    }
  });

  it("does not redirect on API error", async () => {
    const result = await requestCheckoutSession("booking-1", {
      fetch: async () =>
        jsonResponse(503, {
          success: false,
          message: "Payment is not configured.",
        }),
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 503);
    }
  });

  it("rejects javascript URLs", () => {
    assert.equal(
      isSafeCheckoutRedirectUrl("javascript:alert(1)"),
      false
    );
  });
});

describe("double-click protection", () => {
  it("cannot start a second frontend request while the first is in flight", async () => {
    const runner = createExclusiveRunner();
    let starts = 0;
    let release: () => void = () => undefined;

    const first = runner.run(async () => {
      starts += 1;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return "one";
    });

    const second = await runner.run(async () => {
      starts += 1;
      return "two";
    });

    assert.equal(second, undefined);
    assert.equal(starts, 1);
    release();
    assert.equal(await first, "one");
  });
});

describe("409 handling", () => {
  it("retries transient initialization 409 at most once", async () => {
    let calls = 0;

    const result = await requestCheckoutSessionWithTransientRetry(
      "booking-1",
      {
        sleep: async () => undefined,
        fetch: async () => {
          calls += 1;

          if (calls === 1) {
            return jsonResponse(409, {
              success: false,
              message:
                "A payment attempt is already being prepared. Retry shortly.",
            });
          }

          return jsonResponse(200, {
            success: true,
            data: {
              url: "https://checkout.stripe.test/cs_reused",
            },
          });
        },
      }
    );

    assert.equal(calls, 2);
    assert.equal(result.ok, true);
  });

  it("does not blindly retry a non-transient 409", async () => {
    let calls = 0;

    const result = await requestCheckoutSessionWithTransientRetry(
      "booking-1",
      {
        sleep: async () => undefined,
        fetch: async () => {
          calls += 1;
          return jsonResponse(409, {
            success: false,
            message:
              "This reservation has expired and can no longer be paid.",
          });
        },
      }
    );

    assert.equal(calls, 1);
    assert.equal(result.ok, false);
    assert.equal(
      isTransientInitializationConflict(409, "This booking has already been paid."),
      false
    );
    assert.equal(
      isTransientInitializationConflict(
        409,
        "A payment for this booking is already completing."
      ),
      false
    );
  });
});

describe("authoritative checkout views", () => {
  it("treats DRAFT unpaid as payment-safe UI, not local success", () => {
    assert.equal(resolveCheckoutView(snapshot()), "pay");
    assert.equal(isTicketEligible(snapshot()), false);
  });

  it("shows confirming only when an open Stripe attempt exists", () => {
    assert.equal(
      resolveCheckoutView(
        snapshot({
          payments: [
            {
              status: "PENDING",
              provider: "STRIPE",
              providerRef: "cs_1",
            },
          ],
        })
      ),
      "confirming"
    );
    assert.equal(
      hasOpenStripeAttempt(
        snapshot({
          payments: [
            {
              status: "PENDING",
              provider: "STRIPE",
              providerRef: "cs_1",
            },
          ],
        })
      ),
      true
    );
  });

  it("enables ticket flow only for paid eligible lifecycle states", () => {
    assert.equal(
      isTicketEligible(
        snapshot({
          status: "CONFIRMED",
          paymentStatus: "PAID",
        })
      ),
      true
    );
    assert.equal(
      isTicketEligible(
        snapshot({
          status: "CHECKED_IN",
          paymentStatus: "PAID",
        })
      ),
      true
    );
    assert.equal(
      isTicketEligible(
        snapshot({
          status: "CONFIRMED",
          paymentStatus: "PENDING",
          payments: [],
        })
      ),
      false
    );
    assert.equal(
      resolveCheckoutView(
        snapshot({
          status: "CONFIRMED",
          paymentStatus: "PAID",
        })
      ),
      "confirmed"
    );
  });

  it("never treats FAILED or CANCELLED as success", () => {
    assert.equal(
      resolveCheckoutView(
        snapshot({
          status: "FAILED",
          paymentStatus: "PAID",
        })
      ),
      "failed"
    );
    assert.equal(
      resolveCheckoutView(
        snapshot({
          status: "CANCELLED",
          paymentStatus: "PAID",
        })
      ),
      "cancelled"
    );
    assert.equal(
      isTicketEligible(
        snapshot({
          status: "FAILED",
          paymentStatus: "PAID",
        })
      ),
      false
    );
  });
});

describe("bounded polling", () => {
  it("sees webhook confirmation and stops", async () => {
    let calls = 0;

    const result = await pollAuthoritativeBooking({
      bookingId: "booking-1",
      intervalMs: 0,
      maxAttempts: 15,
      sleep: async () => undefined,
      fetch: async () => {
        calls += 1;

        if (calls < 3) {
          return jsonResponse(200, {
            success: true,
            data: snapshot(),
          });
        }

        return jsonResponse(200, {
          success: true,
          data: snapshot({
            status: "CONFIRMED",
            paymentStatus: "PAID",
            payments: [{ status: "PAID", provider: "STRIPE", providerRef: "cs_1" }],
          }),
        });
      },
    });

    assert.equal(result.reason, "confirmed");
    assert.equal(result.attempts, 3);
    assert.equal(calls, 3);
  });

  it("stops after a finite timeout", async () => {
    const result = await pollAuthoritativeBooking({
      bookingId: "booking-1",
      intervalMs: 0,
      maxAttempts: 4,
      sleep: async () => undefined,
      fetch: async () =>
        jsonResponse(200, {
          success: true,
          data: snapshot(),
        }),
    });

    assert.equal(result.reason, "timeout");
    assert.equal(result.attempts, 4);
    assert.equal(CHECKOUT_POLL_MAX_ATTEMPTS, 15);
    assert.equal(CHECKOUT_POLL_INTERVAL_MS, 2000);
  });

  it("stops on FAILED and CANCELLED", async () => {
    const failed = await pollAuthoritativeBooking({
      bookingId: "booking-1",
      intervalMs: 0,
      maxAttempts: 15,
      sleep: async () => undefined,
      fetch: async () =>
        jsonResponse(200, {
          success: true,
          data: snapshot({ status: "FAILED" }),
        }),
    });

    assert.equal(failed.reason, "failed");
    assert.equal(failed.attempts, 1);

    const cancelled = await pollAuthoritativeBooking({
      bookingId: "booking-1",
      intervalMs: 0,
      maxAttempts: 15,
      sleep: async () => undefined,
      fetch: async () =>
        jsonResponse(200, {
          success: true,
          data: snapshot({ status: "CANCELLED" }),
        }),
    });

    assert.equal(cancelled.reason, "cancelled");
  });

  it("does not overlap polling requests", async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    await pollAuthoritativeBooking({
      bookingId: "booking-1",
      intervalMs: 0,
      maxAttempts: 3,
      sleep: async () => undefined,
      fetch: async () => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await Promise.resolve();
        inFlight -= 1;
        return jsonResponse(200, {
          success: true,
          data: snapshot(),
        });
      },
    });

    assert.equal(maxInFlight, 1);
  });
});

describe("Stripe return is not payment authority", () => {
  it("does not locally mark PAID or CONFIRMED from a URL", async () => {
    const refreshed = await fetchAuthoritativeBooking("booking-1", {
      fetch: async () =>
        jsonResponse(200, {
          success: true,
          data: snapshot(),
        }),
    });

    assert.equal(refreshed.kind, "ok");
    if (refreshed.kind === "ok") {
      assert.equal(refreshed.booking.paymentStatus, "PENDING");
      assert.equal(refreshed.booking.status, "DRAFT");
      assert.equal(resolveCheckoutView(refreshed.booking), "pay");
    }

    const payButton = readProjectFile("app/checkout/CheckoutPayButton.tsx");
    assert.equal(payButton.includes('status: "PAID"'), false);
    assert.equal(payButton.includes('status: "CONFIRMED"'), false);
    assert.equal(payButton.includes("from=success"), false);
    assert.equal(payButton.includes("session_id"), false);
  });
});

describe("client secrets and navigation", () => {
  it("does not require a Stripe secret or publishable key client-side", () => {
    const payButton = readProjectFile("app/checkout/CheckoutPayButton.tsx");
    const helper = readProjectFile("app/checkout/checkoutPayment.ts");
    const checkoutPage = readProjectFile("app/checkout/page.tsx");

    assert.equal(payButton.includes("STRIPE_SECRET_KEY"), false);
    assert.equal(payButton.includes("NEXT_PUBLIC_STRIPE"), false);
    assert.equal(helper.includes("STRIPE_SECRET_KEY"), false);
    assert.equal(helper.includes("loadStripe"), false);
    assert.equal(checkoutPage.includes("/payment"), false);
    assert.equal(checkoutPage.includes("CheckoutPayButton"), true);
  });

  it("sends review continue to /checkout instead of /payment", () => {
    const review = readProjectFile("app/review/ReviewActions.tsx");

    assert.equal(review.includes("/payment?bookingId="), false);
    assert.equal(review.includes("/checkout?bookingId="), true);
    assert.equal(review.includes("We will build /payment next."), false);
  });
});

describe("ticket authorization", () => {
  it("allows the owner to load a protected ticket", () => {
    const access = authorizeBookingAccess(
      { id: "user-1", role: "CUSTOMER" },
      { userId: "user-1" }
    );

    assert.equal(access.authorized, true);
  });

  it("does not allow the wrong owner to load ticket PII", () => {
    const access = authorizeBookingAccess(
      { id: "user-2", role: "CUSTOMER" },
      { userId: "user-1" }
    );

    assert.equal(access.authorized, false);

    const ticketPage = readProjectFile("app/tickets/[bookingId]/page.tsx");
    assert.equal(ticketPage.includes("localhost:3000"), false);
    assert.equal(ticketPage.includes("authorizeBookingAccess"), true);
    assert.equal(ticketPage.includes("isTicketEligible"), true);
    assert.equal(ticketPage.includes("email"), false);
  });
});

describe("login callback", () => {
  it("preserves the checkout callback URL", () => {
    assert.equal(
      checkoutLoginPath("booking-1"),
      "/login?callbackUrl=%2Fcheckout%3FbookingId%3Dbooking-1"
    );
  });
});
