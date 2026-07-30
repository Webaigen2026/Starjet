"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ArrowRightLeft,
  CalendarDays,
  PlaneLanding,
  PlaneTakeoff,
  Repeat2,
  Route,
  Search,
  Ticket,
  UsersRound,
} from "lucide-react";

type TripType = "ROUND_TRIP" | "ONE_WAY" | "MULTI_CITY";

interface Airport {
  code: string;
  name: string;
}

const originAirports: Airport[] = [
  { code: "BOS", name: "Boston" },
  { code: "MIA", name: "Miami" },
  { code: "FLL", name: "Fort Lauderdale" },
  { code: "JFK", name: "New York" },
  { code: "CAP", name: "Cap-Haitien" },
  { code: "PAP", name: "Port-au-Prince" },
];

const destinationAirports: Airport[] = [
  { code: "CAP", name: "Cap-Haitien" },
  { code: "PAP", name: "Port-au-Prince" },
  { code: "BOS", name: "Boston" },
  { code: "MIA", name: "Miami" },
  { code: "FLL", name: "Fort Lauderdale" },
  { code: "JFK", name: "New York" },
];

const TRIP_TYPES: { value: TripType; label: string; icon: LucideIcon }[] = [
  { value: "ROUND_TRIP", label: "Round Trip", icon: Repeat2 },
  { value: "ONE_WAY", label: "One Way", icon: ArrowRight },
  { value: "MULTI_CITY", label: "Multi City", icon: Route },
];

// Shared field styling so every input/select renders at the same height
// and shares focus/hover behavior without repeating classes per field.
const FIELD_SHELL =
  "flex h-14 min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-slate-950 shadow-sm shadow-slate-900/5 transition-all duration-200 hover:border-slate-300 focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-500/10";

const FIELD_INPUT =
  "min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400";

export default function FlightSearchForm() {
  const router = useRouter();

  const [tripType, setTripType] = useState<TripType>("ROUND_TRIP");
  const [originCode, setOriginCode] = useState("");
  const [destinationCode, setDestinationCode] = useState("");

  function handleSwapAirports() {
    setOriginCode(destinationCode);
    setDestinationCode(originCode);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (tripType === "MULTI_CITY") {
      return;
    }

    const formData = new FormData(event.currentTarget);

    const params = new URLSearchParams({
      tripType,
      originCode,
      destinationCode,
      departureDate: String(formData.get("departureDate") ?? ""),
      passengersCount: String(formData.get("passengersCount") ?? "1"),
    });

    const returnDate = formData.get("returnDate");

    if (tripType === "ROUND_TRIP" && returnDate) {
      params.set("returnDate", String(returnDate));
    }

    router.push(`/flights/results?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-white shadow-2xl shadow-slate-900/10"
    >
      <TripTypeSegmentedControl value={tripType} onChange={setTripType} />

      <div className="p-5 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-3">
          <AirportField
            name="originCode"
            label="From"
            value={originCode}
            onChange={setOriginCode}
            airports={originAirports}
            placeholder="Departure airport"
            icon={<PlaneTakeoff className="h-[18px] w-[18px] text-cyan-600" aria-hidden="true" />}
          />

          <SwapButton onClick={handleSwapAirports} />

          <AirportField
            name="destinationCode"
            label="To"
            value={destinationCode}
            onChange={setDestinationCode}
            airports={destinationAirports}
            placeholder="Destination airport"
            icon={<PlaneLanding className="h-[18px] w-[18px] text-cyan-600" aria-hidden="true" />}
          />

          <DateField name="departureDate" label="Departure" />

          <PassengerField />

          {tripType === "ROUND_TRIP" && <DateField name="returnDate" label="Return" />}
        </div>

        {tripType === "MULTI_CITY" && (
          <p
            role="status"
            className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800"
          >
            Multi-city search will be supported in the advanced booking version.
            For now, please use one-way or round-trip search.
          </p>
        )}

        <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 rounded-2xl bg-cyan-50/70 px-4 py-3 text-sm font-semibold leading-6 text-slate-600 sm:items-center">
            <Ticket className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600 sm:mt-0" aria-hidden="true" />
            <span>Passenger booking, route search, and aircraft details.</span>
          </div>

          <button
            type="submit"
            disabled={tripType === "MULTI_CITY"}
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 text-white cursor-pointer px-8 text-sm font-black shadow-lg shadow-cyan-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-400 hover:shadow-xl hover:shadow-cyan-500/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-500/30 active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:w-auto sm:min-w-[220px]"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
            Search Flights
          </button>
        </div>
      </div>
    </form>
  );
}

function TripTypeSegmentedControl({
  value,
  onChange,
}: {
  value: TripType;
  onChange: (value: TripType) => void;
}) {
  return (
    <div className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-6">
      <div
        role="tablist"
        aria-label="Trip type"
        className="inline-flex w-full gap-1  p-1 sm:w-auto"
      >
        {TRIP_TYPES.map(({ value: type, label, icon: Icon }) => {
          const active = value === type;

          return (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(type)}
              className={`flex flex-1 items-center cursor-pointer rounded-xl justify-center gap-2 px-4 py-2.5 text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 sm:flex-none sm:px-5 ${
                active
                  ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/30"
                  : "bg-transparent text-slate-500 hover:bg-white hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </span>
  );
}

function AirportField({
  name,
  label,
  value,
  onChange,
  airports,
  placeholder,
  icon,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  airports: Airport[];
  placeholder: string;
  icon: React.ReactNode;
}) {
  const id = `field-${name}`;

  return (
    <label htmlFor={id} className="block min-w-0">
      <FieldLabel>{label}</FieldLabel>

      <div className={FIELD_SHELL}>
        <span className="shrink-0">{icon}</span>

        <select
          id={id}
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          className={FIELD_INPUT}
        >
          <option value="">{placeholder}</option>

          {airports.map((airport) => (
            <option key={airport.code} value={airport.code}>
              {airport.name} ({airport.code})
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function DateField({ name, label }: { name: string; label: string }) {
  const id = `field-${name}`;

  return (
    <label htmlFor={id} className="block min-w-0">
      <FieldLabel>{label}</FieldLabel>

      <div className={FIELD_SHELL}>
        <CalendarDays className="h-[18px] w-[18px] shrink-0 text-cyan-600" aria-hidden="true" />

        <input
          id={id}
          name={name}
          type="date"
          required
          className={`${FIELD_INPUT} [color-scheme:light]`}
        />
      </div>
    </label>
  );
}

function PassengerField() {
  return (
    <label htmlFor="field-passengersCount" className="block min-w-0">
      <FieldLabel>Passengers</FieldLabel>

      <div className={FIELD_SHELL}>
        <UsersRound className="h-[18px] w-[18px] shrink-0 text-cyan-600" aria-hidden="true" />

        <input
          id="field-passengersCount"
          name="passengersCount"
          type="number"
          min="1"
          max="9"
          defaultValue="1"
          required
          className={FIELD_INPUT}
        />
      </div>
    </label>
  );
}

function SwapButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex items-end justify-center pb-0.5 sm:col-span-2 lg:col-span-1 lg:pb-1">
      <button
        type="button"
        onClick={onClick}
        aria-label="Swap departure and destination airports"
        className="group flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-cyan-700 shadow-sm transition-all duration-300 hover:border-cyan-300 hover:bg-cyan-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-500/20 active:scale-95"
      >
        <ArrowRightLeft
          className="h-5 w-5 transition-transform duration-300 rotate-0 group-hover:rotate-180"
          aria-hidden="true"
        />
      </button>

    </div>
  );
}