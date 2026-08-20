import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "path";

import {
  adminRefundRequestHasFinancialAuthority,
  buildAdminRefundRequest,
  formatAdminRefundAmount,
  getAdminRefundPaymentUiKind,
  interpretAdminRefundResponse,
  isAdminRefundSubmitLocked,
} from "./adminRefundUi";

const root = path.join(import.meta.dirname, "..", "..");

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("admin refund UI visibility", () => {
  it("shows an actionable refund for ADMIN with FAILED and PAID Payment", () => {
    assert.equal(
      getAdminRefundPaymentUiKind("ADMIN", "FAILED", "PAID"),
      "actionable"
    );
  });

  it("shows an actionable refund for ADMIN with CANCELLED and PAID Payment", () => {
    assert.equal(
      getAdminRefundPaymentUiKind("ADMIN", "CANCELLED", "PAID"),
      "actionable"
    );
  });

  it("hides refund action for ADMIN with an active booking and PAID Payment", () => {
    for (const status of [
      "DRAFT",
      "CONFIRMED",
      "CHECKED_IN",
      "BOARDED",
      "COMPLETED",
    ]) {
      assert.equal(
        getAdminRefundPaymentUiKind("ADMIN", status, "PAID"),
        "hidden"
      );
    }
  });

  it("shows a non-actionable Refunded state for already-refunded recovery payments", () => {
    assert.equal(
      getAdminRefundPaymentUiKind("ADMIN", "FAILED", "REFUNDED"),
      "refunded"
    );
    assert.equal(
      getAdminRefundPaymentUiKind("ADMIN", "CANCELLED", "REFUNDED"),
      "refunded"
    );
  });

  it("hides refund action for PENDING or FAILED Payments", () => {
    assert.equal(
      getAdminRefundPaymentUiKind("ADMIN", "FAILED", "PENDING"),
      "hidden"
    );
    assert.equal(
      getAdminRefundPaymentUiKind("ADMIN", "CANCELLED", "FAILED"),
      "hidden"
    );
  });

  it("hides refund action from STAFF and CUSTOMER", () => {
    assert.equal(
      getAdminRefundPaymentUiKind("STAFF", "FAILED", "PAID"),
      "hidden"
    );
    assert.equal(
      getAdminRefundPaymentUiKind("CUSTOMER", "CANCELLED", "PAID"),
      "hidden"
    );
  });
});

describe("admin refund request", () => {
  it("targets the exact Payment.id without financial authority", () => {
    const request = buildAdminRefundRequest("pay-paid");

    assert.equal(request.url, "/api/payments/pay-paid/refund");
    assert.equal(request.init.method, "POST");
    assert.equal(request.init.body, undefined);
    assert.equal(adminRefundRequestHasFinancialAuthority(request.init), false);
    assert.equal(JSON.stringify(request).includes("amount"), false);
    assert.equal(JSON.stringify(request).includes("currency"), false);
    assert.equal(JSON.stringify(request).includes("paymentIntent"), false);
    assert.equal(JSON.stringify(request).includes("payment_intent"), false);
  });

  it("prevents double submit while a refund request is in progress", () => {
    assert.equal(isAdminRefundSubmitLocked(null), false);
    assert.equal(isAdminRefundSubmitLocked("pay-paid"), true);
  });

  it("formats server-provided amount and currency for confirmation", () => {
    assert.equal(
      formatAdminRefundAmount({
        id: "pay-paid",
        status: "PAID",
        amount: "123.45",
        currency: "usd",
      }),
      "USD 123.45"
    );
  });
});

describe("admin refund response handling", () => {
  it("treats 200 as success that must refresh server state", () => {
    const outcome = interpretAdminRefundResponse(200, {
      success: true,
      message: "Payment refunded.",
      data: {
        paymentStatus: "REFUNDED",
        alreadyRefunded: false,
      },
    });

    assert.equal(outcome.kind, "success");
    assert.equal(outcome.refresh, true);
  });

  it("treats already-refunded 200 as success without a new refund action", () => {
    const outcome = interpretAdminRefundResponse(200, {
      success: true,
      message: "Payment is already refunded.",
      data: {
        paymentStatus: "REFUNDED",
        alreadyRefunded: true,
      },
    });

    assert.equal(outcome.kind, "success");
    assert.equal(outcome.refresh, true);
    assert.match(outcome.message, /already refunded/i);
  });

  it("explains BOOKING_ACTIVE without marking refunded", () => {
    const outcome = interpretAdminRefundResponse(409, {
      success: false,
      code: "BOOKING_ACTIVE",
      message: "Cancel this booking before refunding a captured payment.",
    });

    assert.equal(outcome.kind, "booking_active");
    assert.equal(outcome.refresh, false);
    assert.match(outcome.message, /active|Cancel/i);
  });

  it("explains PAYMENT_NOT_PAID without marking refunded", () => {
    const outcome = interpretAdminRefundResponse(409, {
      success: false,
      code: "PAYMENT_NOT_PAID",
      message: "Only captured PAID payments can be refunded.",
    });

    assert.equal(outcome.kind, "payment_not_paid");
    assert.equal(outcome.refresh, false);
  });

  it("surfaces RECONCILIATION_REQUIRED as an operational warning", () => {
    const outcome = interpretAdminRefundResponse(409, {
      success: false,
      code: "RECONCILIATION_REQUIRED",
      message:
        "PaymentIntent reconciliation is required before this payment can be refunded.",
    });

    assert.equal(outcome.kind, "reconciliation_required");
    assert.equal(outcome.refresh, false);
    assert.equal(outcome.message.includes("unrefunded"), false);
  });

  it("surfaces Stripe processing failure without local REFUNDED", () => {
    const outcome = interpretAdminRefundResponse(502, {
      success: false,
      code: "STRIPE_ERROR",
      message: "Unable to refund this payment.",
    });

    assert.equal(outcome.kind, "stripe_error");
    assert.equal(outcome.refresh, false);
    assert.equal(outcome.message.includes("REFUNDED"), false);
  });

  it("warns that persistence failure may already have refunded at Stripe", () => {
    const outcome = interpretAdminRefundResponse(500, {
      success: false,
      code: "REFUND_PERSISTENCE_FAILED",
      message:
        "Stripe refund succeeded but local payment state could not be saved. Retry the same refund; do not assume the money is unrefunded.",
    });

    assert.equal(outcome.kind, "persistence_uncertain");
    assert.equal(outcome.refresh, false);
    assert.match(outcome.message, /Retry the same refund/i);
    assert.match(outcome.message, /do not assume the money is unrefunded/i);
  });

  it("surfaces unverified Stripe refund as reconciliation, not success", () => {
    const outcome = interpretAdminRefundResponse(409, {
      success: false,
      code: "STRIPE_REFUND_UNVERIFIED",
      message:
        "Stripe refund requires reconciliation because the response could not be verified against the captured payment. Retry the same refund; do not assume the money is unrefunded.",
    });

    assert.equal(outcome.kind, "unverified");
    assert.equal(outcome.refresh, false);
    assert.notEqual(outcome.kind, "success");
  });
});

describe("admin refund UI wiring", () => {
  it("uses the existing payment refund endpoint and confirms before submit", () => {
    const helper = readProjectFile("app/lib/adminRefundUi.ts");
    const component = readProjectFile(
      "app/admin/bookings/[id]/AdminRefundActions.tsx"
    );
    const page = readProjectFile("app/admin/bookings/[id]/page.tsx");

    assert.equal(helper.includes("/api/payments/"), true);
    assert.equal(helper.includes("refund"), true);
    assert.equal(component.includes("buildAdminRefundRequest"), true);
    assert.equal(component.includes("pendingPaymentId"), true);
    assert.equal(component.includes("router.refresh()"), true);
    assert.equal(component.includes("Confirm full refund"), true);
    assert.equal(component.includes("stripePaymentIntentId"), false);
    assert.equal(component.includes("STRIPE_SECRET_KEY"), false);
    assert.equal(page.includes("AdminRefundActions"), true);
    assert.equal(page.includes("getServerSession"), true);
  });

  it("does not invent client idempotency or financial fields", () => {
    const component = readProjectFile(
      "app/admin/bookings/[id]/AdminRefundActions.tsx"
    );

    assert.equal(component.includes("idempotency"), false);
    assert.equal(component.includes("payment_intent"), false);
    assert.equal(component.includes("amount:"), false);
    assert.equal(component.includes("currency:"), false);
  });
});
