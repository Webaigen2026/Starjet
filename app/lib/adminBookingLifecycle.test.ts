import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { requestTouchesLifecycleStatus } from "./reservationLifecycle";
import {
  adminLifecycleActionPath,
  getAdminBookingLifecycleActions,
  isCheckInAllowedFromStatus,
} from "./adminBookingLifecycle";

const root = path.join(import.meta.dirname, "..", "..");

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("admin booking lifecycle actions", () => {
  it("exposes Cancel only for DRAFT and never Confirm", () => {
    assert.deepEqual(getAdminBookingLifecycleActions("DRAFT"), [
      "cancel",
    ]);
  });

  it("exposes Check in and Cancel for CONFIRMED", () => {
    assert.deepEqual(getAdminBookingLifecycleActions("CONFIRMED"), [
      "checkin",
      "cancel",
    ]);
  });

  it("exposes Board and Cancel for CHECKED_IN", () => {
    assert.deepEqual(getAdminBookingLifecycleActions("CHECKED_IN"), [
      "board",
      "cancel",
    ]);
  });

  it("exposes Complete for BOARDED", () => {
    assert.deepEqual(getAdminBookingLifecycleActions("BOARDED"), [
      "complete",
    ]);
  });

  it("exposes no lifecycle mutation for terminal and unimplemented statuses", () => {
    for (const status of [
      "COMPLETED",
      "CANCELLED",
      "FAILED",
      "PENDING_PAYMENT",
      "PAID",
      "TICKETED",
      "REFUNDED",
    ]) {
      assert.deepEqual(getAdminBookingLifecycleActions(status), []);
    }
  });

  it("routes actions only through dedicated endpoints", () => {
    const bookingId = "booking-1";

    assert.equal(
      adminLifecycleActionPath(bookingId, "cancel"),
      "/api/bookings/booking-1/cancel"
    );
    assert.equal(
      adminLifecycleActionPath(bookingId, "checkin"),
      "/api/bookings/booking-1/checkin"
    );
    assert.equal(
      adminLifecycleActionPath(bookingId, "board"),
      "/api/bookings/booking-1/board"
    );
    assert.equal(
      adminLifecycleActionPath(bookingId, "complete"),
      "/api/bookings/booking-1/complete"
    );
  });
});

describe("check-in allowed transitions", () => {
  it("accepts CONFIRMED", () => {
    assert.equal(isCheckInAllowedFromStatus("CONFIRMED"), true);
  });

  it("rejects COMPLETED, TICKETED, and other non-CONFIRMED statuses", () => {
    for (const status of [
      "COMPLETED",
      "TICKETED",
      "DRAFT",
      "BOARDED",
      "CANCELLED",
      "FAILED",
      "CHECKED_IN",
      "PENDING_PAYMENT",
      "PAID",
      "REFUNDED",
    ]) {
      assert.equal(isCheckInAllowedFromStatus(status), false);
    }
  });
});

describe("admin UI and generic PATCH guards", () => {
  it("still treats status and paymentStatus as generic PATCH lifecycle bypasses", () => {
    assert.equal(requestTouchesLifecycleStatus({ status: "CANCELLED" }), true);
    assert.equal(
      requestTouchesLifecycleStatus({ paymentStatus: "PAID" }),
      true
    );
  });

  it("does not send status or paymentStatus from the admin lifecycle UI", () => {
    const ui = readProjectFile(
      "app/admin/bookings/[id]/BookingLifecycleActions.tsx"
    );

    assert.equal(ui.includes("paymentStatus"), false);
    assert.equal(ui.includes("/confirm"), false);
    assert.equal(ui.includes("JSON.stringify"), false);
    assert.equal(ui.includes("/api/bookings/${bookingId}`"), false);
  });

  it("keeps cancel on the shared inventory-release helper", () => {
    const cancelRoute = readProjectFile(
      "app/api/bookings/[id]/cancel/route.ts"
    );

    assert.equal(cancelRoute.includes("claimAndReleaseInventory"), true);
  });

  it("does not introduce payment mutation in this phase", () => {
    const ui = readProjectFile(
      "app/admin/bookings/[id]/BookingLifecycleActions.tsx"
    );
    const page = readProjectFile("app/admin/bookings/[id]/page.tsx");
    const helper = readProjectFile("app/lib/adminBookingLifecycle.ts");
    const checkIn = readProjectFile("app/api/bookings/[id]/checkin/route.ts");

    for (const source of [ui, page, helper, checkIn]) {
      assert.equal(source.includes("/api/payments"), false);
      assert.equal(source.includes("Stripe"), false);
      assert.equal(source.includes("PaymentIntent"), false);
    }
  });
});
