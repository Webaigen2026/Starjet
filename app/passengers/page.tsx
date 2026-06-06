"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function PassengersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const airline = searchParams.get("airline") || "Selected Flight";
  const originCode = searchParams.get("originCode") || "";
  const destinationCode = searchParams.get("destinationCode") || "";
  const departureDate = searchParams.get("departureDate") || "";
  const returnDate = searchParams.get("returnDate") || "";
  const passengersCount = searchParams.get("passengersCount") || "1";
  const price = searchParams.get("price") || "485";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setLoading(true);

    const payload = {
      customerName: `${formData.get("firstName")} ${formData.get("lastName")}`,
      customerEmail: formData.get("customerEmail"),
      customerPhone: formData.get("customerPhone"),

      originCode,
      destinationCode,
      departureDate,
      returnDate,
      passengersCount,

      airlineName: airline,
      totalAmount: price,

      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      dateOfBirth: formData.get("dateOfBirth"),
      gender: formData.get("gender"),
      nationality: formData.get("nationality"),
      passportNumber: formData.get("passportNumber"),
      passportCountry: formData.get("passportCountry"),
      passportExpiry: formData.get("passportExpiry"),
    };

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      router.push(`/checkout?bookingId=${data.data.id}`);
    } else {
      alert(data.message || "Failed to create booking");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">
            Passenger Details
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-950">
            Enter Traveler Information
          </h1>

          <p className="mt-4 max-w-2xl text-slate-600">
            Review your selected flight and enter passenger details before
            continuing to checkout.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:col-span-2">
            <h2 className="text-2xl font-bold text-slate-950">Passenger 1</h2>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-6 md:grid-cols-2">
              <input name="firstName" required placeholder="First Name" className="rounded-xl border border-slate-300 px-4 py-3" />
              <input name="lastName" required placeholder="Last Name" className="rounded-xl border border-slate-300 px-4 py-3" />

              <input name="customerEmail" type="email" required placeholder="Customer Email" className="rounded-xl border border-slate-300 px-4 py-3" />
              <input name="customerPhone" required placeholder="Customer Phone" className="rounded-xl border border-slate-300 px-4 py-3" />

              <input name="dateOfBirth" type="date" className="rounded-xl border border-slate-300 px-4 py-3" />

              <select name="gender" className="rounded-xl border border-slate-300 px-4 py-3">
                <option value="">Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>

              <input name="nationality" placeholder="Nationality" className="rounded-xl border border-slate-300 px-4 py-3" />
              <input name="passportNumber" placeholder="Passport Number" className="rounded-xl border border-slate-300 px-4 py-3" />
              <input name="passportCountry" placeholder="Passport Country" className="rounded-xl border border-slate-300 px-4 py-3" />
              <input name="passportExpiry" type="date" className="rounded-xl border border-slate-300 px-4 py-3" />

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-slate-950 px-8 py-4 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading ? "Creating Booking..." : "Continue to Checkout"}
                </button>
              </div>
            </form>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Trip Summary
            </p>

            <h2 className="mt-3 text-2xl font-bold text-slate-950">{airline}</h2>

            <div className="mt-6 space-y-4 text-sm">
              <div>
                <p className="text-slate-500">Route</p>
                <p className="font-semibold text-slate-950">
                  {originCode} → {destinationCode}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Departure</p>
                <p className="font-semibold text-slate-950">{departureDate}</p>
              </div>

              {returnDate && (
                <div>
                  <p className="text-slate-500">Return</p>
                  <p className="font-semibold text-slate-950">{returnDate}</p>
                </div>
              )}

              <div>
                <p className="text-slate-500">Passengers</p>
                <p className="font-semibold text-slate-950">{passengersCount}</p>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <p className="text-slate-500">Total</p>
                <p className="text-3xl font-bold text-slate-950">${price}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}