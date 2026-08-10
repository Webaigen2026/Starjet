"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  ArrowRight,
  ArrowRightLeft,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Plane,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

export default function FlightsPage() {
  const router = useRouter();

  const [tripType, setTripType] = useState("ROUND_TRIP");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const originCode = String(formData.get("originCode") || "");
    const destinationCode = String(
      formData.get("destinationCode") || ""
    );
    const departureDate = String(
      formData.get("departureDate") || ""
    );
    const passengersCount = String(
      formData.get("passengersCount") || "1"
    );

    if (
      !originCode ||
      !destinationCode ||
      !departureDate
    ) {
      alert(
        "Please select your origin, destination, and departure date."
      );
      return;
    }

    if (originCode === destinationCode) {
      alert("Origin and destination cannot be the same.");
      return;
    }

    const params = new URLSearchParams({
      tripType,
      originCode,
      destinationCode,
      departureDate,
      passengersCount,
    });

    if (tripType === "ROUND_TRIP") {
      const returnDate = String(
        formData.get("returnDate") || ""
      );

      if (!returnDate) {
        alert("Please select a return date.");
        return;
      }

      params.set("returnDate", returnDate);
    }

    router.push(`/flights/results?${params.toString()}`);
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f5f7fa]">
        {/* HERO */}

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-700">
                <Plane className="h-4 w-4" />
                StarJet Air & Cargo
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Find your next flight
              </h1>

              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
                Search available StarJet flights and book your
                journey securely in just a few steps.
              </p>
            </div>

            {/* SEARCH BOX */}

            <form
              onSubmit={handleSubmit}
              className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
            >
              {/* TRIP TYPE */}

              <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 px-5 py-4">
                <TripButton
                  label="Round trip"
                  active={tripType === "ROUND_TRIP"}
                  onClick={() => setTripType("ROUND_TRIP")}
                />

                <TripButton
                  label="One way"
                  active={tripType === "ONE_WAY"}
                  onClick={() => setTripType("ONE_WAY")}
                />
              </div>

              {/* SEARCH FIELDS */}

              <div className="p-5 sm:p-6">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_1fr_1fr]">
                  <SelectField
                    name="originCode"
                    label="From"
                    icon={<MapPin className="h-4 w-4" />}
                  >
                    <option value="">
                      Select departure city
                    </option>
                    <option value="BOS">
                      Boston (BOS)
                    </option>
                    <option value="JFK">
                      New York (JFK)
                    </option>
                    <option value="MIA">
                      Miami (MIA)
                    </option>
                    <option value="FLL">
                      Fort Lauderdale (FLL)
                    </option>
                    <option value="CAP">
                      Cap-Haïtien (CAP)
                    </option>
                    <option value="PAP">
                      Port-au-Prince (PAP)
                    </option>
                  </SelectField>

                  <div className="hidden items-end pb-1 lg:flex">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
                      <ArrowRightLeft className="h-4 w-4" />
                    </div>
                  </div>

                  <SelectField
                    name="destinationCode"
                    label="To"
                    icon={<MapPin className="h-4 w-4" />}
                  >
                    <option value="">
                      Select destination
                    </option>
                    <option value="JFK">
                      New York (JFK)
                    </option>
                    <option value="BOS">
                      Boston (BOS)
                    </option>
                    <option value="MIA">
                      Miami (MIA)
                    </option>
                    <option value="FLL">
                      Fort Lauderdale (FLL)
                    </option>
                    <option value="CAP">
                      Cap-Haïtien (CAP)
                    </option>
                    <option value="PAP">
                      Port-au-Prince (PAP)
                    </option>
                  </SelectField>

                  <InputField
                    name="departureDate"
                    type="date"
                    label="Departure"
                    icon={
                      <CalendarDays className="h-4 w-4" />
                    }
                  />

                  {tripType === "ROUND_TRIP" ? (
                    <InputField
                      name="returnDate"
                      type="date"
                      label="Return"
                      icon={
                        <CalendarDays className="h-4 w-4" />
                      }
                    />
                  ) : (
                    <InputField
                      name="passengersCount"
                      type="number"
                      label="Travelers"
                      min="1"
                      max="9"
                      defaultValue="1"
                      icon={
                        <UsersRound className="h-4 w-4" />
                      }
                    />
                  )}
                </div>

                {tripType === "ROUND_TRIP" && (
                  <div className="mt-4 max-w-[250px]">
                    <InputField
                      name="passengersCount"
                      type="number"
                      label="Travelers"
                      min="1"
                      max="9"
                      defaultValue="1"
                      icon={
                        <UsersRound className="h-4 w-4" />
                      }
                    />
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Secure booking
                    </span>

                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Live availability
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0756c9] px-7 text-sm font-semibold text-white transition hover:bg-[#064bb0]"
                  >
                    <Search className="h-4 w-4" />
                    Search flights
                    <ArrowRight className="h-4 w-4" />
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
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-slate-950 text-white"
          : "text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function SelectField({
  name,
  label,
  icon,
  children,
}: {
  name: string;
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </span>

      <select
        name={name}
        required
        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
  max,
  defaultValue,
}: {
  name: string;
  type: string;
  label: string;
  icon: React.ReactNode;
  min?: string;
  max?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </span>

      <input
        name={name}
        type={type}
        min={min}
        max={max}
        defaultValue={defaultValue}
        required
        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}