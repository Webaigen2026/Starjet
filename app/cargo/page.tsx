"use client";

import { useState } from "react";

export default function CargoPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);

    const payload = {
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      fromCity: formData.get("fromCity"),
      fromAddress: formData.get("fromAddress"),
      toCity: formData.get("toCity"),
      toAddress: formData.get("toAddress"),
      cargoType: formData.get("cargoType"),
      weight: formData.get("weight"),
      dimensions: formData.get("dimensions"),
      description: formData.get("description"),
      estimatedValue: formData.get("estimatedValue"),
      preferredDate: formData.get("preferredDate"),
    };

    const response = await fetch("/api/cargo-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setSuccess(true);
      event.currentTarget.reset();
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">
            StarJet Cargo
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-950">
            Request a Cargo Shipping Quote
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Send packages, boxes, documents, barrels, and business shipments
            between the USA and Haiti. Submit your request and our team will
            contact you with pricing and next steps.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <input
              name="fullName"
              required
              placeholder="Full Name"
              className="rounded-xl border border-slate-300 px-4 py-3"
            />

            <input
              name="email"
              type="email"
              required
              placeholder="Email Address"
              className="rounded-xl border border-slate-300 px-4 py-3"
            />

            <input
              name="phone"
              required
              placeholder="Phone Number"
              className="rounded-xl border border-slate-300 px-4 py-3"
            />

            <select
              name="cargoType"
              className="rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="OTHER">Cargo Type</option>
              <option value="DOCUMENTS">Documents</option>
              <option value="BOX">Box</option>
              <option value="BARREL">Barrel</option>
              <option value="PALLET">Pallet</option>
              <option value="OTHER">Other</option>
            </select>

            <input
              name="fromCity"
              required
              placeholder="Pickup City"
              className="rounded-xl border border-slate-300 px-4 py-3"
            />

            <input
              name="toCity"
              required
              placeholder="Destination City"
              className="rounded-xl border border-slate-300 px-4 py-3"
            />

            <input
              name="fromAddress"
              placeholder="Pickup Address"
              className="rounded-xl border border-slate-300 px-4 py-3"
            />

            <input
              name="toAddress"
              placeholder="Destination Address"
              className="rounded-xl border border-slate-300 px-4 py-3"
            />

            <input
              name="weight"
              type="number"
              step="0.01"
              placeholder="Estimated Weight"
              className="rounded-xl border border-slate-300 px-4 py-3"
            />

            <input
              name="dimensions"
              placeholder="Dimensions"
              className="rounded-xl border border-slate-300 px-4 py-3"
            />

            <input
              name="estimatedValue"
              type="number"
              step="0.01"
              placeholder="Estimated Value"
              className="rounded-xl border border-slate-300 px-4 py-3"
            />

            <input
              name="preferredDate"
              type="date"
              className="rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>

          <textarea
            name="description"
            required
            placeholder="Describe what you are shipping"
            className="mt-6 min-h-32 w-full rounded-xl border border-slate-300 px-4 py-3"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-6 rounded-xl bg-slate-950 px-8 py-4 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Submitting Request..." : "Submit Cargo Request"}
          </button>

          {success && (
            <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              Cargo request submitted successfully. Our team will contact you soon.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}