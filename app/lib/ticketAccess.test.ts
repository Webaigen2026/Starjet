import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { authorizeBookingAccess } from "./authorization";
import { isTicketEligible } from "./ticketAccess";
import {
  DEFAULT_POST_LOGIN_PATH,
  getSafeLoginCallbackUrl,
} from "./safeCallbackUrl";

const root = path.join(import.meta.dirname, "..", "..");

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function booking(status: string, paymentStatus: string, paidRow = false) {
  return {
    status,
    paymentStatus,
    payments: paidRow ? [{ status: "PAID" }] : [{ status: "PENDING" }],
  };
}

describe("customer ticket lifecycle gate", () => {
  it("allows paid CONFIRMED, CHECKED_IN, BOARDED, and COMPLETED", () => {
    for (const status of ["CONFIRMED", "CHECKED_IN", "BOARDED", "COMPLETED"]) {
      assert.equal(isTicketEligible(booking(status, "PAID")), true);
      assert.equal(
        isTicketEligible(booking(status, "PENDING", true)),
        true
      );
    }
  });

  it("does not allow DRAFT, FAILED, or CANCELLED even if paid", () => {
    assert.equal(isTicketEligible(booking("DRAFT", "PAID")), false);
    assert.equal(isTicketEligible(booking("FAILED", "PAID")), false);
    assert.equal(isTicketEligible(booking("CANCELLED", "PAID")), false);
  });

  it("does not allow unpaid CONFIRMED bookings", () => {
    assert.equal(isTicketEligible(booking("CONFIRMED", "PENDING")), false);
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

  it("gates the ticket page and ticket API with isTicketEligible", () => {
    const page = readProjectFile("app/tickets/[bookingId]/page.tsx");
    const api = readProjectFile("app/api/tickets/[bookingId]/route.ts");

    assert.equal(page.includes("isTicketEligible"), true);
    assert.equal(page.includes("authorizeBookingAccess"), true);
    assert.equal(api.includes("isTicketEligible"), true);
    assert.equal(api.includes("authorizeBookingAccess"), true);
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
