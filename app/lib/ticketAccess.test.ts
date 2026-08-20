import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { authorizeBookingAccess } from "./authorization";
import { bookingHasPaidCapture } from "./checkoutSession";
import { isTicketEligible } from "./ticketAccess";
import {
  DEFAULT_POST_LOGIN_PATH,
  getSafeLoginCallbackUrl,
} from "./safeCallbackUrl";

const root = path.join(import.meta.dirname, "..", "..");

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function booking(
  status: string,
  paymentStatus: string,
  payments: Array<{ status: string }> = [{ status: "PENDING" }]
) {
  return {
    status,
    paymentStatus,
    payments,
  };
}

function paidBooking(status: string, paymentStatus = "PAID") {
  return booking(status, paymentStatus, [{ status: "PAID" }]);
}

describe("customer ticket lifecycle gate", () => {
  it("allows paid CONFIRMED, CHECKED_IN, BOARDED, and COMPLETED", () => {
    for (const status of ["CONFIRMED", "CHECKED_IN", "BOARDED", "COMPLETED"]) {
      assert.equal(isTicketEligible(paidBooking(status)), true);
    }
  });

  it("does not allow DRAFT, FAILED, or CANCELLED even if paid", () => {
    assert.equal(isTicketEligible(paidBooking("DRAFT")), false);
    assert.equal(isTicketEligible(paidBooking("FAILED")), false);
    assert.equal(isTicketEligible(paidBooking("CANCELLED")), false);
  });

  it("does not allow unpaid CONFIRMED bookings", () => {
    assert.equal(isTicketEligible(booking("CONFIRMED", "PENDING")), false);
  });

  it("does not expose ticket PII when booking-level PAID lacks a PAID Payment row", () => {
    assert.equal(
      bookingHasPaidCapture({
        paymentStatus: "PAID",
        payments: [],
      }),
      false
    );
    assert.equal(
      isTicketEligible({
        status: "CONFIRMED",
        paymentStatus: "PAID",
        payments: [],
      }),
      false
    );
    assert.equal(
      isTicketEligible({
        status: "CONFIRMED",
        paymentStatus: "PAID",
        payments: [{ status: "PENDING" }],
      }),
      false
    );
    assert.equal(
      isTicketEligible({
        status: "CONFIRMED",
        paymentStatus: "PAID",
        payments: [{ status: "FAILED" }],
      }),
      false
    );
  });

  it("allows ticket access for CONFIRMED bookings with a real PAID Payment row", () => {
    assert.equal(isTicketEligible(paidBooking("CONFIRMED")), true);
  });

  it("does not treat a refunded Payment as a current paid capture", () => {
    assert.equal(
      isTicketEligible({
        status: "CONFIRMED",
        paymentStatus: "PAID",
        payments: [{ status: "REFUNDED" }],
      }),
      false
    );
    assert.equal(
      isTicketEligible({
        status: "FAILED",
        paymentStatus: "REFUNDED",
        payments: [{ status: "REFUNDED" }],
      }),
      false
    );
  });

  it("does not allow the wrong owner or email claiming of userId:null", () => {
    assert.equal(
      authorizeBookingAccess(
        { id: "user-2", role: "CUSTOMER" },
        { userId: "user-1" }
      ).authorized,
      false
    );
    assert.equal(
      authorizeBookingAccess(
        {
          id: "user-1",
          role: "CUSTOMER",
          email: "guest@example.com",
        } as { id?: string; role?: "CUSTOMER" },
        { userId: null }
      ).authorized,
      false
    );
  });

  it("gates the ticket page, ticket API, and legacy ticket API with isTicketEligible", () => {
    const page = readProjectFile("app/tickets/[bookingId]/page.tsx");
    const api = readProjectFile("app/api/tickets/[bookingId]/route.ts");
    const legacy = readProjectFile("app/api/bookings/[id]/ticket/route.ts");

    assert.equal(page.includes("isTicketEligible"), true);
    assert.equal(page.includes("authorizeBookingAccess"), true);
    assert.equal(api.includes("isTicketEligible"), true);
    assert.equal(api.includes("authorizeBookingAccess"), true);
    assert.equal(legacy.includes("isTicketEligible"), true);
    assert.equal(legacy.includes("authorizeBookingAccess"), true);
    assert.equal(legacy.includes("Ticket is not available for this booking"), false);
    assert.equal(legacy.includes('message: "Booking not found."'), true);
  });
});

describe("legacy ticket route parity", () => {
  const legacy = readProjectFile("app/api/bookings/[id]/ticket/route.ts");

  it("returns passport PII only after the canonical eligibility gate", () => {
    const gate = legacy.indexOf("isTicketEligible");
    const passport = legacy.indexOf("passportNumber");

    assert.equal(legacy.includes("passportNumber"), true);
    assert.ok(gate >= 0);
    assert.ok(passport >= 0);
    assert.ok(gate < passport);
  });

  it("matches canonical ticket API fail-closed semantics for ineligible bookings", () => {
    const canonical = readProjectFile("app/api/tickets/[bookingId]/route.ts");

    assert.equal(canonical.includes("isTicketEligible"), true);
    assert.equal(legacy.includes("isTicketEligible"), true);
    assert.equal(canonical.includes('message: "Booking not found."'), true);
    assert.equal(legacy.includes('message: "Booking not found."'), true);
    assert.equal(canonical.includes("status: 404"), true);
    assert.equal(legacy.includes("status: 404"), true);
  });
});

describe("ticket access verification matrix", () => {
  it("allows paid ticket-eligible lifecycle states", () => {
    for (const status of ["CONFIRMED", "CHECKED_IN", "BOARDED", "COMPLETED"]) {
      assert.equal(isTicketEligible(paidBooking(status)), true);
    }
  });

  it("denies DRAFT, unpaid CONFIRMED, FAILED, CANCELLED, and refunded capture", () => {
    assert.equal(isTicketEligible(paidBooking("DRAFT")), false);
    assert.equal(isTicketEligible(booking("CONFIRMED", "PENDING")), false);
    assert.equal(isTicketEligible(paidBooking("FAILED")), false);
    assert.equal(isTicketEligible(paidBooking("CANCELLED")), false);
    assert.equal(
      isTicketEligible({
        status: "CONFIRMED",
        paymentStatus: "REFUNDED",
        payments: [{ status: "REFUNDED" }],
      }),
      false
    );
  });

  it("denies wrong owner and userId:null customer claims", () => {
    assert.equal(
      authorizeBookingAccess(
        { id: "user-2", role: "CUSTOMER" },
        { userId: "user-1" }
      ).authorized,
      false
    );
    assert.equal(
      authorizeBookingAccess(
        {
          id: "user-1",
          role: "CUSTOMER",
          email: "guest@example.com",
        } as { id?: string; role?: "CUSTOMER" },
        { userId: null }
      ).authorized,
      false
    );
  });

  it("allows ADMIN and STAFF to reach the same eligibility gate", () => {
    assert.equal(
      authorizeBookingAccess(
        { id: "staff-1", role: "STAFF" },
        { userId: "user-1" }
      ).authorized,
      true
    );
    assert.equal(
      authorizeBookingAccess(
        { id: "admin-1", role: "ADMIN" },
        { userId: "user-1" }
      ).authorized,
      true
    );
  });
});

describe("login callbackUrl", () => {
  it("honors a safe checkout callbackUrl", () => {
    assert.equal(
      getSafeLoginCallbackUrl("/checkout?bookingId=booking-1"),
      "/checkout?bookingId=booking-1"
    );
  });

  it("rejects external and protocol-relative callbackUrls", () => {
    assert.equal(
      getSafeLoginCallbackUrl("https://evil.example/phish"),
      DEFAULT_POST_LOGIN_PATH
    );
    assert.equal(
      getSafeLoginCallbackUrl("//evil.example/phish"),
      DEFAULT_POST_LOGIN_PATH
    );
    assert.equal(
      getSafeLoginCallbackUrl("/%2F%2Fevil.example"),
      DEFAULT_POST_LOGIN_PATH
    );
  });

  it("preserves /admin when callbackUrl is missing", () => {
    assert.equal(getSafeLoginCallbackUrl(null), "/admin");
    assert.equal(getSafeLoginCallbackUrl(""), "/admin");
    assert.equal(DEFAULT_POST_LOGIN_PATH, "/admin");
  });

  it("uses the safe callback helper on the login page", () => {
    const login = readProjectFile("app/(auth)/login/page.tsx");
    const checkout = readProjectFile("app/checkout/page.tsx");

    assert.equal(login.includes("getSafeLoginCallbackUrl"), true);
    assert.equal(login.includes('router.push("/admin")'), false);
    assert.equal(checkout.includes("callbackUrl"), true);
  });
});
