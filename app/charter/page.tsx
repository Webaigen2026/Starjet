"use client";

import { useState } from "react";

export default function CharterPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setLoading(true);
    setSuccess(false);

    const payload = {
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      departureCity: formData.get("departureCity"),
      destinationCity: formData.get("destinationCity"),
      departureDate: formData.get("departureDate"),
      returnDate: formData.get("returnDate"),
      passengersCount: formData.get("passengersCount"),
      aircraftType: formData.get("aircraftType"),
      budgetRange: formData.get("budgetRange"),
      message: formData.get("message"),
    };

    const response = await fetch("/api/charter-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setSuccess(true);
      form.reset();
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">
            StarJet Charter
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-950">
            Request a Private Charter Quote
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Charter means renting an entire aircraft for private, group, or
            urgent travel. Submit your trip details and our team will contact
            you with availability and pricing.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <input name="fullName" required placeholder="Full Name" className="rounded-xl border border-slate-300 px-4 py-3" />
            <input name="email" type="email" required placeholder="Email Address" className="rounded-xl border border-slate-300 px-4 py-3" />
            <input name="phone" required placeholder="Phone Number" className="rounded-xl border border-slate-300 px-4 py-3" />
            <input name="passengersCount" type="number" required min="1" placeholder="Number of Passengers" className="rounded-xl border border-slate-300 px-4 py-3" />
            <input name="departureCity" required placeholder="Departure City" className="rounded-xl border border-slate-300 px-4 py-3" />
            <input name="destinationCity" required placeholder="Destination City" className="rounded-xl border border-slate-300 px-4 py-3" />
            <input name="departureDate" type="date" required className="rounded-xl border border-slate-300 px-4 py-3" />
            <input name="returnDate" type="date" className="rounded-xl border border-slate-300 px-4 py-3" />

            <select name="aircraftType" className="rounded-xl border border-slate-300 px-4 py-3">
              <option value="">Preferred Aircraft Type</option>
              <option value="Light Jet">Light Jet</option>
              <option value="Midsize Jet">Midsize Jet</option>
              <option value="Heavy Jet">Heavy Jet</option>
              <option value="Turboprop">Turboprop</option>
              <option value="Not Sure">Not Sure</option>
            </select>

            <select name="budgetRange" className="rounded-xl border border-slate-300 px-4 py-3">
              <option value="">Budget Range</option>
              <option value="$5,000 - $10,000">$5,000 - $10,000</option>
              <option value="$10,000 - $25,000">$10,000 - $25,000</option>
              <option value="$25,000 - $50,000">$25,000 - $50,000</option>
              <option value="$50,000+">$50,000+</option>
            </select>
          </div>

          <textarea
            name="message"
            placeholder="Additional travel details"
            className="mt-6 min-h-32 w-full rounded-xl border border-slate-300 px-4 py-3"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-6 rounded-xl bg-slate-950 px-8 py-4 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Submitting Request..." : "Submit Charter Request"}
          </button>

          {success && (
            <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              Charter request submitted successfully. Our team will contact you soon.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}