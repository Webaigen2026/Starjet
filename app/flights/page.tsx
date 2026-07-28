"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  ArrowRightLeft,
  CalendarDays,
  Plane,
  Search,
  Ticket,
  UsersRound,
} from "lucide-react";

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
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 text-white">
        <section className="relative overflow-hidden px-4 py-12 sm:px-6 lg:py-16">
          <div
            className="absolute inset-0 scale-110 bg-cover bg-center opacity-[0.24] blur-md"
            style={{ backgroundImage: "url('/image/hero-bck.jpeg')" }}
          />
          <div className="absolute inset-0 bg-slate-950/82" />
          <div className="absolute inset-x-0 top-0 h-56 bg-cyan-400/10 blur-3xl" />
          <Plane className="pointer-events-none absolute right-8 top-24 h-56 w-56 -rotate-12 text-white/5" />

          <div className="relative mx-auto max-w-6xl">
            <div className="mb-8 max-w-3xl">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
                <Plane className="h-4 w-4" />
                StarJet flights
              </p>
              <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
                Search aircraft routes between Haiti and the USA.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                Choose your route, dates, and passenger count, then continue to
                live flight results with a cleaner booking flow.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="overflow-hidden rounded-[28px] border border-white/15 bg-white text-slate-950 shadow-2xl shadow-slate-950/40"
            >
              <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 p-3">
                <TripButton
                  label="Round Trip"
                  active={tripType === "ROUND_TRIP"}
                  onClick={() => setTripType("ROUND_TRIP")}
                />
                <TripButton
                  label="One Way"
                  active={tripType === "ONE_WAY"}
                  onClick={() => setTripType("ONE_WAY")}
                />
                <TripButton
                  label="Multi City"
                  active={tripType === "MULTI_CITY"}
                  onClick={() => setTripType("MULTI_CITY")}
                />
              </div>

              <div className="p-5 sm:p-8">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_1fr_1fr]">
                  <SelectField name="originCode" label="From" icon="from">
                    <option value="">From</option>
                    <option value="BOS">Boston (BOS)</option>
                    <option value="MIA">Miami (MIA)</option>
                    <option value="FLL">Fort Lauderdale (FLL)</option>
                    <option value="JFK">New York (JFK)</option>
                    <option value="CAP">Cap-Haitien (CAP)</option>
                    <option value="PAP">Port-au-Prince (PAP)</option>
                  </SelectField>

                  <div className="hidden items-end pb-1 lg:flex">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-cyan-700">
                      <ArrowRightLeft className="h-5 w-5" />
                    </div>
                  </div>

                  <SelectField name="destinationCode" label="To" icon="to">
                    <option value="">To</option>
                    <option value="CAP">Cap-Haitien (CAP)</option>
                    <option value="PAP">Port-au-Prince (PAP)</option>
                    <option value="BOS">Boston (BOS)</option>
                    <option value="MIA">Miami (MIA)</option>
                    <option value="FLL">Fort Lauderdale (FLL)</option>
                    <option value="JFK">New York (JFK)</option>
                  </SelectField>

                  <InputField
                    name="departureDate"
                    type="date"
                    label="Departure"
                    icon={<CalendarDays className="h-5 w-5 text-cyan-700" />}
                  />

                  <InputField
                    name="passengersCount"
                    type="number"
                    label="Passengers"
                    min="1"
                    defaultValue="1"
                    icon={<UsersRound className="h-5 w-5 text-cyan-700" />}
                  />

                  {tripType === "ROUND_TRIP" && (
                    <InputField
                      name="returnDate"
                      type="date"
                      label="Return"
                      icon={<CalendarDays className="h-5 w-5 text-cyan-700" />}
                    />
                  )}
                </div>

                {tripType === "MULTI_CITY" && (
                  <p className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                    Multi-city search will be supported in the advanced booking
                    version. For now, please use one-way or round-trip search.
                  </p>
                )}

                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
                    <Ticket className="h-5 w-5 text-cyan-700" />
                    Passenger booking, route search, aircraft details.
                  </div>

                  <button
                    type="submit"
                    disabled={tripType === "MULTI_CITY"}
                    className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-8 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/25 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Search className="h-5 w-5" />
                    Search Flights
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function TripButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-5 py-3 text-sm font-black transition ${
        active
          ? "bg-slate-950 text-white shadow-lg shadow-slate-200"
          : "bg-white text-slate-600 hover:text-slate-950"
      }`}
    >
      {label}
    </button>
  );
}

function SelectField({
  name,
  label,
  children,
}: {
  name: string;
  label: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <label className="min-w-0">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <select
        name={name}
        required
        className="mt-2 h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 shadow-sm outline-none focus:border-cyan-600"
      >
        {children}
      </select>
    </label>
  );
}

function InputField({
  name,
  type,
  label,
  icon,
  min,
  defaultValue,
}: {
  name: string;
  type: string;
  label: string;
  icon: React.ReactNode;
  min?: string;
  defaultValue?: string;
}) {
  return (
    <label className="min-w-0">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <div className="mt-2 flex h-[54px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-slate-950 shadow-sm focus-within:border-cyan-600">
        {icon}
        <input
          name={name}
          type={type}
          required
          min={min}
          defaultValue={defaultValue}
          className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
        />
      </div>
    </label>
  );
}
