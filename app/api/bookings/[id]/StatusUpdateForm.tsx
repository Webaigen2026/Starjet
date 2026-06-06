"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StatusUpdateForm({
  bookingId,
  currentStatus,
  currentPaymentStatus,
}: {
  bookingId: string;
  currentStatus: string;
  currentPaymentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setLoading(true);

    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: formData.get("status"),
        paymentStatus: formData.get("paymentStatus"),
      }),
    });

    if (response.ok) {
      router.refresh();
      alert("Booking updated successfully");
    } else {
      alert("Failed to update booking");
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold text-slate-950">
        Update Booking Status
      </h2>

      <div className="grid gap-6 md:grid-cols-2">
        <select
          name="status"
          defaultValue={currentStatus}
          className="rounded-xl border border-slate-300 px-4 py-3"
        >
          <option value="DRAFT">DRAFT</option>
          <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
          <option value="PAID">PAID</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="TICKETED">TICKETED</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="REFUNDED">REFUNDED</option>
          <option value="FAILED">FAILED</option>
        </select>

        <select
          name="paymentStatus"
          defaultValue={currentPaymentStatus}
          className="rounded-xl border border-slate-300 px-4 py-3"
        >
          <option value="PENDING">PENDING</option>
          <option value="PAID">PAID</option>
          <option value="FAILED">FAILED</option>
          <option value="REFUNDED">REFUNDED</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 rounded-xl bg-slate-950 px-8 py-4 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Updating..." : "Update Booking"}
      </button>
    </form>
  );
}