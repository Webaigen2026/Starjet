"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  adminLifecycleActionPath,
  getAdminBookingLifecycleActions,
  type AdminLifecycleAction,
} from "../../../lib/adminBookingLifecycle";

const ACTION_LABELS: Record<AdminLifecycleAction, string> = {
  cancel: "Cancel",
  checkin: "Check in",
  board: "Board",
  complete: "Complete",
};

export default function BookingLifecycleActions({
  bookingId,
  currentStatus,
}: {
  bookingId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] =
    useState<AdminLifecycleAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions = getAdminBookingLifecycleActions(currentStatus);

  async function runAction(action: AdminLifecycleAction) {
    setError(null);
    setPendingAction(action);

    try {
      const response = await fetch(
        adminLifecycleActionPath(bookingId, action),
        {
          method: "PATCH",
        }
      );

      const result = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        setError(result?.message || "Unable to update booking.");
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to update booking.");
    } finally {
      setPendingAction(null);
    }
  }

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-950">
        Booking actions
      </h3>

      <div className="flex flex-wrap gap-3">
        {actions.map((action) => (
          <button
            key={action}
            type="button"
            disabled={pendingAction !== null}
            onClick={() => {
              void runAction(action);
            }}
            className="rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {pendingAction === action
              ? "Updating..."
              : ACTION_LABELS[action]}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-4 text-sm font-medium text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
