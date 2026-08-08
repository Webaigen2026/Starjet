"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FlightsPage() {
  const router = useRouter();
  const [tripType, setTripType] = useState("ROUND_TRIP");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const params = new URLSearchParams({
      tripType,
      originCode: String(formData.get("originCode")),
      destinationCode: String(formData.get("destinationCode")),
      departureDate: String(formData.get("departureDate")),
      passengersCount: String(formData.get("passengersCount")),
    });

    const returnDate = formData.get("returnDate");

    if (tripType === "ROUND_TRIP" && returnDate) {
      params.set("returnDate", String(returnDate));
    }

    router.push(`/flights/results?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">
            StarJet Flights
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-950">
            Search Flights Between Haiti and the USA
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Search available routes between Haiti and major U.S. cities. Start
            with your trip details and continue to flight results.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <div className="mb-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setTripType("ROUND_TRIP")}
              className={`rounded-full px-5 py-2 text-sm font-semibold ${
                tripType === "ROUND_TRIP"
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              Round Trip
            </button>

            <button
              type="button"
              onClick={() => setTripType("ONE_WAY")}
              className={`rounded-full px-5 py-2 text-sm font-semibold ${
                tripType === "ONE_WAY"
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              One Way
            </button>

            <button
              type="button"
              onClick={() => setTripType("MULTI_CITY")}
              className={`rounded-full px-5 py-2 text-sm font-semibold ${
                tripType === "MULTI_CITY"
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              Multi City
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <select
              name="originCode"
              required
              className="rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="">From</option>
              <option value="BOS">Boston (BOS)</option>
              <option value="MIA">Miami (MIA)</option>
              <option value="FLL">Fort Lauderdale (FLL)</option>
              <option value="JFK">New York (JFK)</option>
              <option value="CAP">Cap-Haïtien (CAP)</option>
              <option value="PAP">Port-au-Prince (PAP)</option>
            </select>

            <select
              name="destinationCode"
              required
              className="rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="">To</option>
              <option value="CAP">Cap-Haïtien (CAP)</option>
              <option value="PAP">Port-au-Prince (PAP)</option>
              <option value="BOS">Boston (BOS)</option>
              <option value="MIA">Miami (MIA)</option>
              <option value="FLL">Fort Lauderdale (FLL)</option>
              <option value="JFK">New York (JFK)</option>
            </select>

            <input
              name="departureDate"
              type="date"
              required
              className="rounded-xl border border-slate-300 px-4 py-3"
            />

            <input
              name="passengersCount"
              type="number"
              min="1"
              defaultValue="1"
              required
              className="rounded-xl border border-slate-300 px-4 py-3"
            />

            {tripType === "ROUND_TRIP" && (
              <input
                name="returnDate"
                type="date"
                required
                className="rounded-xl border border-slate-300 px-4 py-3"
              />
            )}
          </div>

          {tripType === "MULTI_CITY" && (
            <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Multi-city search will be supported in the advanced booking
              version. For now, please use one-way or round-trip search.
            </p>
          )}

          <button
            type="submit"
            disabled={tripType === "MULTI_CITY"}
            className="mt-8 rounded-xl bg-slate-950 px-8 py-4 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Search Flights
          </button>
        </form>
      </div>
    </main>
  );
}