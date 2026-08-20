"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  adminRefundRequestHasFinancialAuthority,
  buildAdminRefundRequest,
  formatAdminRefundAmount,
  getAdminRefundPaymentUiKind,
  interpretAdminRefundResponse,
  isAdminRefundSubmitLocked,
  type AdminRefundPaymentView,
  type AdminRefundViewerRole,
} from "../../../lib/adminRefundUi";

type AdminRefundActionsProps = {
  role: AdminRefundViewerRole;
  bookingCode: string;
  bookingStatus: string;
  payments: AdminRefundPaymentView[];
};

export default function AdminRefundActions({
  role,
  bookingCode,
  bookingStatus,
  payments,
}: AdminRefundActionsProps) {
  const router = useRouter();
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<string | null>(
    null
  );
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    tone: "success" | "warning" | "error";
    message: string;
  } | null>(null);

  const visiblePayments = payments.filter(
    (payment) =>
      getAdminRefundPaymentUiKind(role, bookingStatus, payment.status) !==
      "hidden"
  );

  if (visiblePayments.length === 0) {
    return null;
  }

  const confirmingPayment =
    visiblePayments.find((payment) => payment.id === confirmingPaymentId) ??
    null;

  async function submitRefund(paymentId: string) {
    if (isAdminRefundSubmitLocked(pendingPaymentId)) {
      return;
    }

    setNotice(null);
    setPendingPaymentId(paymentId);

    try {
      const request = buildAdminRefundRequest(paymentId);

      if (adminRefundRequestHasFinancialAuthority(request.init)) {
        setNotice({
          tone: "error",
          message: "Unable to refund this payment.",
        });
        return;
      }

      const response = await fetch(request.url, request.init);
      const body = (await response.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
        code?: string;
        data?: {
          paymentStatus?: string;
          alreadyRefunded?: boolean;
        };
      } | null;
      const outcome = interpretAdminRefundResponse(response.status, body);

      setNotice({
        tone:
          outcome.kind === "success"
            ? "success"
            : outcome.kind === "reconciliation_required" ||
                outcome.kind === "persistence_uncertain" ||
                outcome.kind === "unverified"
              ? "warning"
              : "error",
        message: outcome.message,
      });

      if (outcome.refresh) {
        setConfirmingPaymentId(null);
        router.refresh();
      }
    } catch {
      setNotice({
        tone: "error",
        message: "Unable to refund this payment.",
      });
    } finally {
      setPendingPaymentId(null);
    }
  }

  return (
    <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-950">
        Payment recovery
      </h3>

      <div className="space-y-4">
        {visiblePayments.map((payment) => {
          const kind = getAdminRefundPaymentUiKind(
            role,
            bookingStatus,
            payment.status
          );
          const amountLabel = formatAdminRefundAmount(payment);
          const busy = pendingPaymentId !== null;

          return (
            <div
              key={payment.id}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <p className="text-sm text-slate-500">Payment</p>
              <p className="font-semibold text-slate-950">{amountLabel}</p>
              <p className="mt-1 text-sm text-slate-600">
                Status: {payment.status}
              </p>

              {kind === "refunded" ? (
                <p className="mt-3 text-sm font-medium text-slate-700">
                  Refunded
                </p>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setNotice(null);
                    setConfirmingPaymentId(payment.id);
                  }}
                  className="mt-4 rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {pendingPaymentId === payment.id
                    ? "Refunding..."
                    : "Issue full refund"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {notice ? (
        <p
          className={`mt-4 text-sm font-medium ${
            notice.tone === "success"
              ? "text-emerald-700"
              : notice.tone === "warning"
                ? "text-amber-800"
                : "text-red-700"
          }`}
        >
          {notice.message}
        </p>
      ) : null}

      {confirmingPayment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">
            <h4 className="text-xl font-bold text-slate-950">
              Confirm full refund
            </h4>
            <p className="mt-4 text-sm leading-6 text-slate-700">
              This sends a full refund of{" "}
              <strong>{formatAdminRefundAmount(confirmingPayment)}</strong> for
              booking <strong>{bookingCode}</strong> to Stripe. It is not a local
              status change and cannot be undone from this screen.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={pendingPaymentId !== null}
                onClick={() => {
                  void submitRefund(confirmingPayment.id);
                }}
                className="rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {pendingPaymentId === confirmingPayment.id
                  ? "Refunding..."
                  : "Confirm full refund"}
              </button>
              <button
                type="button"
                disabled={pendingPaymentId !== null}
                onClick={() => setConfirmingPaymentId(null)}
                className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-800 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
