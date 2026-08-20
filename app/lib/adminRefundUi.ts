export const ADMIN_REFUND_RECOVERY_BOOKING_STATUSES = [
  "FAILED",
  "CANCELLED",
] as const;

export const ADMIN_REFUND_ACTIVE_BOOKING_STATUSES = [
  "DRAFT",
  "CONFIRMED",
  "CHECKED_IN",
  "BOARDED",
  "COMPLETED",
] as const;

export type AdminRefundViewerRole = "ADMIN" | "STAFF" | "CUSTOMER" | string;

export type AdminRefundPaymentView = {
  id: string;
  status: string;
  amount: unknown;
  currency: string;
};

export type AdminRefundBookingView = {
  bookingCode: string;
  status: string;
};

export type AdminRefundRequest = {
  url: string;
  init: RequestInit;
};

export type AdminRefundUiKind =
  | "hidden"
  | "actionable"
  | "refunded";

export type AdminRefundOutcomeKind =
  | "success"
  | "booking_active"
  | "payment_not_paid"
  | "reconciliation_required"
  | "stripe_error"
  | "persistence_uncertain"
  | "unverified"
  | "generic";

export type AdminRefundOutcome = {
  kind: AdminRefundOutcomeKind;
  message: string;
  refresh: boolean;
};

export function isAdminRefundViewer(role: AdminRefundViewerRole): boolean {
  return role === "ADMIN";
}

export function isRecoveryRefundBookingStatus(status: string): boolean {
  return (ADMIN_REFUND_RECOVERY_BOOKING_STATUSES as readonly string[]).includes(
    status
  );
}

export function getAdminRefundPaymentUiKind(
  role: AdminRefundViewerRole,
  bookingStatus: string,
  paymentStatus: string
): AdminRefundUiKind {
  if (!isAdminRefundViewer(role)) {
    return "hidden";
  }

  if (!isRecoveryRefundBookingStatus(bookingStatus)) {
    return "hidden";
  }

  if (paymentStatus === "REFUNDED") {
    return "refunded";
  }

  if (paymentStatus === "PAID") {
    return "actionable";
  }

  return "hidden";
}

export function formatAdminRefundAmount(payment: AdminRefundPaymentView): string {
  const amount = String(payment.amount ?? "").trim();
  const currency = String(payment.currency ?? "").trim().toUpperCase();

  if (!amount || !currency) {
    return "the captured payment amount";
  }

  return `${currency} ${amount}`;
}

export function buildAdminRefundRequest(paymentId: string): AdminRefundRequest {
  return {
    url: `/api/payments/${encodeURIComponent(paymentId)}/refund`,
    init: {
      method: "POST",
      credentials: "same-origin",
    },
  };
}

export function adminRefundRequestHasFinancialAuthority(
  init: RequestInit
): boolean {
  if (init.body == null || init.body === "") {
    return false;
  }

  const raw =
    typeof init.body === "string" ? init.body : JSON.stringify(init.body);

  return /amount|currency|payment_intent|paymentIntent|providerRef|status/i.test(
    raw
  );
}

export function isAdminRefundSubmitLocked(
  pendingPaymentId: string | null
): boolean {
  return pendingPaymentId != null;
}

export function interpretAdminRefundResponse(
  status: number,
  body: {
    success?: boolean;
    message?: string;
    code?: string;
    data?: {
      paymentStatus?: string;
      alreadyRefunded?: boolean;
    };
  } | null
): AdminRefundOutcome {
  const code = body?.code;
  const message = typeof body?.message === "string" ? body.message : null;

  if (status === 200 && body?.success) {
    return {
      kind: "success",
      message:
        message ??
        (body.data?.alreadyRefunded
          ? "Payment is already refunded."
          : "Payment refunded."),
      refresh: true,
    };
  }

  if (status === 409 && code === "BOOKING_ACTIVE") {
    return {
      kind: "booking_active",
      message:
        message ??
        "This booking is still active. Cancel it before issuing a recovery refund.",
      refresh: false,
    };
  }

  if (status === 409 && code === "PAYMENT_NOT_PAID") {
    return {
      kind: "payment_not_paid",
      message:
        message ?? "This payment is no longer eligible for a refund.",
      refresh: false,
    };
  }

  if (status === 409 && code === "RECONCILIATION_REQUIRED") {
    return {
      kind: "reconciliation_required",
      message:
        message ??
        "This payment requires operational reconciliation before a refund can be completed.",
      refresh: false,
    };
  }

  if (status === 409 && code === "STRIPE_REFUND_UNVERIFIED") {
    return {
      kind: "unverified",
      message:
        message ??
        "Stripe refund requires reconciliation because the response could not be verified. Retry the same refund; do not assume the money is unrefunded.",
      refresh: false,
    };
  }

  if (status === 502 || code === "STRIPE_ERROR" || code === "STRIPE_UNEXPECTED") {
    return {
      kind: "stripe_error",
      message:
        message ??
        "Stripe could not process this refund. The payment has not been marked refunded.",
      refresh: false,
    };
  }

  if (
    status >= 500 ||
    code === "REFUND_PERSISTENCE_FAILED"
  ) {
    return {
      kind: "persistence_uncertain",
      message:
        message ??
        "Stripe may already have refunded this payment, but local payment state could not be saved. Retry the same refund; do not assume the money is unrefunded.",
      refresh: false,
    };
  }

  if (status === 409 && code === "STRIPE_REFUND_PENDING") {
    return {
      kind: "unverified",
      message:
        message ??
        "Stripe refund is pending and has not completed. Retry the same refund; do not assume the money is unrefunded.",
      refresh: false,
    };
  }

  if (status === 409 && code === "STRIPE_REFUND_FAILED") {
    return {
      kind: "stripe_error",
      message:
        message ?? "Stripe did not complete this refund.",
      refresh: false,
    };
  }

  return {
    kind: "generic",
    message: message ?? "Unable to refund this payment.",
    refresh: false,
  };
}
