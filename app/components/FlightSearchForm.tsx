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
  X,
} from "lucide-react";

import { cn } from "@/app/lib/utils";

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

// Shared styling for the segments that live inside the single pill-shaped bar.
// No individual borders/shadows here — the outer bar carries those, and each
// segment is separated from its neighbor with a hairline divider instead.
const SEGMENT =
  "flex min-w-0 flex-1 items-center gap-3 px-5 py-3 text-primary transition-colors duration-200 hover:bg-surface-muted/60 focus-within:bg-surface-muted/60";

const SEGMENT_INPUT =
  "form-input min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-primary outline-none placeholder:text-muted";

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

  const originAirport = originAirports.find((a) => a.code === originCode);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-5xl">
      {/* Compact meta row sitting above the bar, mirroring the reference's
          "Round-trip ⌄  ·  0 bags ⌄" line — same trip-type control, quieter style. */}
      <TripTypeInlineControl value={tripType} onChange={setTripType} />

      {/* The bar: a rounded rectangle on mobile (fields stack vertically),
          becoming the full pill shape once it lays out horizontally at sm+.
          Applying rounded-full unconditionally here was clipping the first
          and last stacked fields into an oval on small screens. */}
      <div className="overflow-hidden rounded-md border border-border/70 bg-surface shadow-2xl shadow-[color:var(--shadow-color)] sm:rounded-full">
        <div className="flex flex-col divide-y divide-border sm:flex-row sm:items-stretch sm:divide-x sm:divide-y-0">
          <div className="flex flex-1 items-stretch sm:min-w-0">
            <AirportField
              name="originCode"
              value={originCode}
              onChange={setOriginCode}
              airports={originAirports}
              placeholder="From?"
              icon={
                <PlaneTakeoff
                  className="h-[18px] w-[18px] shrink-0 text-primary"
                  aria-hidden="true"
                />
              }
              chipLabel={
                originAirport
                  ? `${originAirport.name} (${originAirport.code})`
                  : null
              }
              onClearChip={() => setOriginCode("")}
            />

          
          </div>
         <div className ="flex justify-center  p-4">     <SwapButton onClick={handleSwapAirports} /></div>

          <AirportField
            name="destinationCode"
            value={destinationCode}
            onChange={setDestinationCode}
            airports={destinationAirports}
            placeholder="To?"
            icon={
              <PlaneLanding
                className="h-[18px] w-[18px] shrink-0 text-primary"
                aria-hidden="true"
              />
            }
          />

          <DateRangeField tripType={tripType} />

          <PassengerField />

          <button
            type="submit"
            disabled={tripType === "MULTI_CITY"}
            className="button-text flex shrink-0 cursor-pointer items-center justify-center gap-2 bg-accent px-8 py-4 text-accent-foreground transition-all duration-200 hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus-ring active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-r-full"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
            Search
          </button>
        </div>
      </div>

      {tripType === "MULTI_CITY" && (
        <p
          role="status"
          className="body-text mt-4 rounded-2xl border border-warning/30 bg-warning-muted px-4 py-3 text-sm font-medium text-warning-foreground"
        >
          Multi-city search will be supported in the advanced booking version.
          For now, please use one-way or round-trip search.
        </p>
      )}

      <div className="body-text mt-4 hidden items-center gap-3 rounded-2xl bg-primary-muted px-4 py-3 text-sm font-medium text-primary dark:text-primary sm:flex">
        <Ticket className="h-5 w-5 shrink-0 text-background dark:text-white" aria-hidden="true" />
        <span className="text-background dark:text-white">Passenger booking, route search, and aircraft details.</span>
      </div>
    </form>
  );
}




function TripTypeInlineControl({
  value,
  onChange,
}: {
  value: TripType;
  onChange: (value: TripType) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Trip type"
      className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 px-2"
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
            className={cn(
              "button-text flex cursor-pointer items-center gap-1.5 rounded-full px-1 py-1 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              active
                ? "font-semibold text-white"
                : "text-white/70 hover:text-white",
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AirportField({
  name,
  value,
  onChange,
  airports,
  placeholder,
  icon,
  chipLabel,
  onClearChip,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  airports: Airport[];
  placeholder: string;
  icon: React.ReactNode;
  chipLabel?: string | null;
  onClearChip?: () => void;
}) {
  const id = `field-${name}`;

  return (
    <label htmlFor={id} className={cn(SEGMENT, "relative")}>
      {icon}

      {chipLabel && onClearChip ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-sm font-medium text-secondary">
          {chipLabel}
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onClearChip();
            }}
            aria-label="Clear selection"
            className="cursor-pointer rounded-full p-0.5 text-primary/70 hover:text-primary"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </span>
      ) : null}

      <select
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className={cn(SEGMENT_INPUT, chipLabel ? "sr-only" : "")}
      >
        <option value="">{placeholder}</option>

        {airports.map((airport) => (
          <option key={airport.code} value={airport.code}>
            {airport.name} ({airport.code})
          </option>
        ))}
      </select>
    </label>
  );
}

function DateRangeField({ tripType }: { tripType: TripType }) {
  return (
    <div className={cn(SEGMENT, "gap-2")}>
      <CalendarDays
            className="h-[18px] w-[18px] shrink-0 text-primary"
        aria-hidden="true"
      />

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <input
          id="field-departureDate"
          name="departureDate"
          type="date"
          required
          aria-label="Departure"
          className={SEGMENT_INPUT}
        />

        {tripType === "ROUND_TRIP" && (
          <>
            <span className="shrink-0 text-muted">–</span>
            <input
              id="field-returnDate"
              name="returnDate"
              type="date"
              aria-label="Return"
              className={SEGMENT_INPUT}
            />
          </>
        )}
      </div>
    </div>
  );
}

function PassengerField() {
  return (
    <label htmlFor="field-passengersCount" className={SEGMENT}>
      <UsersRound
        className="h-[18px] w-[18px] shrink-0 text-primary"
        aria-hidden="true"
      />

      <input
        id="field-passengersCount"
        name="passengersCount"
        type="number"
        min="1"
        max="9"
        defaultValue="1"
        required
        className={cn(SEGMENT_INPUT, "w-16 flex-none")}
      />
    </label>
  );
}

function SwapButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Swap departure and destination airports"
      className="group flex shrink-0 cursor-pointer items-center justify-center px-1 text-primary transition-colors duration-200 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <ArrowRightLeft
        className="h-4 w-4 rotate-0 transition-transform duration-300 group-hover:rotate-180"
        aria-hidden="true"
      />
    </button>
  );
}