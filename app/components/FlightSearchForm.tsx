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
          This bar floats *over* the hero card's photo/gradient background
          (HeroBackground), not over the flat #ECF0F3 page background that
          PromoCard/StatCard sit on. A dual highlight+shadow reads as "raised
          off this exact surface color" — against a photo, the white-highlight
          half stops making sense (there's no matching light surface for it to
          blend into) and instead looks like a stray glow/halo. So here it's a
          single soft drop shadow only, no highlight component, same as how a
          normal floating card/toolbar reads against photography. Kept the
          neumorphic bg-[#ECF0F3] surface (so the bar itself still matches the
          style family) but paired it with a plain shadow instead of the dual
          tone. */}
      <div className="overflow-hidden rounded-md bg-[#ECF0F3] shadow-[0_20px_45px_-10px_rgba(13,39,80,0.45),0_8px_20px_-6px_rgba(13,39,80,0.3)] dark:bg-surface dark:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.6),0_8px_20px_-6px_rgba(0,0,0,0.45)] sm:rounded-full">
        <div className="flex flex-col divide-y divide-border sm:flex-row sm:items-stretch sm:divide-x sm:divide-y-0">
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

          <SwapButton onClick={handleSwapAirports} />

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

      {/* bg-primary-muted / text-background aren't defined tokens — they were
          silently no-op-ing, leaving this bar unstyled and the text
          effectively invisible against the page. Swapped to real tokens
          (surface-muted / secondary) so it renders correctly in both themes. */}
      <div className="body-text mt-4 hidden items-center gap-3 rounded-2xl bg-surface-muted px-4 py-3 text-sm font-medium text-secondary sm:flex">
        <Ticket className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
        <span>Passenger booking, route search, and aircraft details.</span>
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
              "button-text flex cursor-pointer items-center gap-1.5 rounded-full px-1 py-1 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-muted px-3 py-1 text-sm font-medium text-accent-muted-foreground">
          {chipLabel}
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onClearChip();
            }}
            aria-label="Clear selection"
            className="cursor-pointer rounded-full p-0.5 text-accent-muted-foreground/70 hover:text-accent-muted-foreground"
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
          className={cn(
            SEGMENT_INPUT,
            "text-white [color-scheme:light] dark:text-white dark:[color-scheme:dark]",
          )}
          style={{ colorScheme: "dark" }}
        />

        {tripType === "ROUND_TRIP" && (
          <>
            <span className="shrink-0 text-muted">–</span>
            <input
              id="field-returnDate"
              name="returnDate"
              type="date"
              aria-label="Return"
              className={cn(
                SEGMENT_INPUT,
                "text-white [color-scheme:light] dark:text-white dark:[color-scheme:dark]",
              )}
              style={{ colorScheme: "dark" }}
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
      className="group flex shrink-0 cursor-pointer items-center justify-center border-y border-border px-3 py-3 text-primary transition-colors duration-200 hover:bg-surface-muted/60 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring sm:border-x sm:border-y-0"
    >
      <ArrowRightLeft
        className="h-4 w-4 rotate-0 transition-transform duration-300 group-hover:rotate-180"
        aria-hidden="true"
      />
    </button>
  );
}