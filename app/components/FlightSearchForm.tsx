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

const TRIP_TYPES: {
  value: TripType;
  label: string;
  icon: LucideIcon;
}[] = [
  {
    value: "ROUND_TRIP",
    label: "Round Trip",
    icon: Repeat2,
  },
  {
    value: "ONE_WAY",
    label: "One Way",
    icon: ArrowRight,
  },
  {
    value: "MULTI_CITY",
    label: "Multi City",
    icon: Route,
  },
];

const SEGMENT =
  "flex min-w-0 flex-1 items-center gap-3 px-5 py-3 text-slate-900 transition-colors duration-200 hover:bg-slate-100 focus-within:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-100 dark:focus-within:bg-slate-100";

const SEGMENT_INPUT =
  "form-input min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-slate-900 outline-none placeholder:text-slate-500 dark:text-slate-900 dark:placeholder:text-slate-500";

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

  const originAirport = originAirports.find(
    (airport) => airport.code === originCode,
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-5xl">
      <TripTypeInlineControl value={tripType} onChange={setTripType} />

      <div
        className="
          overflow-hidden
          rounded-md
          bg-[#ECF0F3]
          text-slate-900
          shadow-[-6px_-6px_12px_var(--color-neu-highlight),6px_6px_12px_var(--color-neu-shadow)]
          dark:bg-[#ECF0F3]
          dark:text-slate-900
          dark:shadow-[-6px_-6px_12px_var(--color-neu-highlight),6px_6px_12px_var(--color-neu-shadow)]
          sm:rounded-full
        "
      >
        <div
          className="
            flex
            flex-col
            divide-y
            divide-slate-200
            sm:flex-row
            sm:items-stretch
            sm:divide-x
            sm:divide-y-0
            dark:divide-slate-200
          "
        >
          <AirportField
            name="originCode"
            value={originCode}
            onChange={setOriginCode}
            airports={originAirports}
            placeholder="From?"
            icon={
              <PlaneTakeoff
                className="h-[18px] w-[18px] shrink-0 text-[#020E63]"
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
                className="h-[18px] w-[18px] shrink-0 text-[#020E63]"
                aria-hidden="true"
              />
            }
          />

          <DateRangeField tripType={tripType} />

          <PassengerField />


          <button
  type="submit"
  disabled={tripType === "MULTI_CITY"}
  className="
    button-text
    flex
    shrink-0
    cursor-pointer
    items-center
    justify-center
    gap-2
    bg-[#cdd3df]
    px-8
    py-4
    text-black
    font-extrabold
    shadow-[-6px_-6px_12px_var(--color-neu-highlight),6px_6px_12px_var(--color-neu-shadow)]
    transition-all
    duration-300
    hover:bg-gradient-to-br
    hover:from-[#8EC5F0]
    hover:via-[#3D7DC0]
    hover:to-[#0A2A5E]
    hover:text-white
    focus-visible:outline-none
    focus-visible:ring-4
    focus-visible:ring-[#020E63]/40
    active:scale-[0.98]
    disabled:cursor-not-allowed
    disabled:opacity-50
    disabled:shadow-none
    dark:bg-[#020E63]
    dark:text-white
    dark:shadow-[-6px_-6px_12px_var(--color-neu-highlight),6px_6px_12px_var(--color-neu-shadow)]
    dark:hover:bg-gradient-to-br
    dark:hover:from-[#8EC5F0]
    dark:hover:via-[#3D7DC0]
    dark:hover:to-[#0A2A5E]
    sm:rounded-r-full
  "
>
  <Search className="h-5 w-5" aria-hidden="true" />
  Search
</button>



        </div>
      </div>

      {tripType === "MULTI_CITY" && (
        <p
          role="status"
          className="
            body-text
            mt-4
            rounded-2xl
            border
            border-amber-300
            bg-amber-50
            px-4
            py-3
            text-sm
            font-medium
            text-amber-900
            dark:border-amber-300
            dark:bg-amber-50
            dark:text-amber-900
          "
        >
          Multi-city search will be supported in the advanced booking
          version. For now, please use one-way or round-trip search.
        </p>
      )}

      <div
        className="
          body-text
          mt-4
          hidden
          items-center
          gap-3
          rounded-2xl
          bg-white/90
          px-4
          py-3
          text-sm
          font-medium
          text-slate-700
          shadow-sm
          backdrop-blur-sm
          dark:bg-white/90
          dark:text-slate-700
          sm:flex
        "
      >
        <Ticket className="h-5 w-5 shrink-0 text-[#020E63]" aria-hidden="true" />

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
      className="mb-5 flex flex-wrap items-start gap-3 px-1 sm:gap-4 sm:px-2"
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
              `
                group
                flex
                w-[5.25rem]
                cursor-pointer
                flex-col
                items-center
                justify-start
                gap-2
                rounded-2xl
                p-1
                text-center
                text-black
                transition-all
                duration-200
                hover:text-primary
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-primary
                focus-visible:ring-offset-2
                disabled:cursor-not-allowed
                disabled:text-muted
                dark:hover:text-accent-foreground
                sm:w-[5.75rem]
              `,
              active ? "scale-[1.03]" : "hover:-translate-y-0.5",
            )}
          >
            {/* Icon box — carries all the surface weight (bg, border,
                shadow) for this control, so the outer button stays a
                plain hit-target instead of stacking a second shadowed
                surface underneath it. */}
            <span
              className={cn(
                `
                  flex
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  shadow-sm
                  transition-all
                  duration-200
                  sm:h-16
                  sm:w-16
                `,
                active
                  ? `
                      border-[#ECF0F3]
                      bg-[#ECF0F3]
                      dark:border-[#ECF0F3]
                      dark:bg-[#ECF0F3]
                      shadow-[-6px_-6px_12px_var(--color-neu-highlight),6px_6px_12px_var(--color-neu-shadow)]
                      dark:shadow-[-6px_-6px_12px_var(--color-neu-highlight),6px_6px_12px_var(--color-neu-shadow)]
                    `
                  : `
                      border-white/70
                      bg-[#B2BCCC]
                 
                      shadow-[-6px_-6px_12px_var(--color-neu-highlight),6px_6px_12px_var(--color-neu-shadow)]
                      group-hover:border-[#ECF0F3]
                      group-hover:bg-[#ECF0F3]
                      group-hover:shadow-[-6px_-6px_12px_var(--color-neu-highlight),6px_6px_12px_var(--color-neu-shadow)]
                      dark:border-white/70
                      dark:bg-[#ECF0F3]
                      dark:shadow-[-6px_-6px_12px_var(--color-neu-highlight),6px_6px_12px_var(--color-neu-shadow)]
                    `,
              )}
            >
              <Icon
                aria-hidden="true"
                className={cn(
                  "h-6 w-6 shrink-0 transition-colors duration-200",
                  active
                    ? "text-[#020E63]"
                    : `
                        text-white
                        group-hover:text-[#020E63]   
                        dark:text-[#020E63]
                        dark:group-hover:text-[#020E63]
                      `,
                )}
              />
            </span>

            {/* Label */}
            <span
              className={cn(
                `
                  block
                  min-h-5
                  w-full
                  whitespace-nowrap
                  text-center
                  text-xs
                  font-bold
                  leading-5
                  tracking-[-0.01em]
                  transition-all
                  duration-200
                  sm:text-sm
                  hover:scale-105
                `,
                active
                  ? "text-[#020E63] dark:text-white scale-105"
                  : `
                      text-[#020E63]/80
                      group-hover:text-[#020E63]
                      dark:text-white/80
                      dark:group-hover:text-white
                    `,
              )}
            >
              {label}
            </span>
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
    <label
      htmlFor={id}
      className="flex flex-none items-center gap-3 whitespace-nowrap px-5 py-3"
    >
      {icon}

      {chipLabel && onClearChip ? (
        <span
          className="
            inline-flex
            items-center
            gap-1.5
            rounded-full
            bg-blue-50
            px-3
            py-1
            text-sm
            font-medium
            text-[#020E63]
            dark:bg-blue-50
            dark:text-[#020E63]
          "
        >
          {chipLabel}

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onClearChip();
            }}
            aria-label="Clear selection"
            className="
              cursor-pointer
              rounded-full
              p-0.5
              text-[#020E63]/70
              transition-colors
              hover:text-[#020E63]
            "
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
        className="h-[18px] w-[18px] shrink-0 text-[#020E63]"
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
            "[color-scheme:light] dark:[color-scheme:light]",
          )}
          style={{ colorScheme: "light" }}
        />

        {tripType === "ROUND_TRIP" && (
          <>
            <span className="shrink-0 text-slate-400">–</span>

            <input
              id="field-returnDate"
              name="returnDate"
              type="date"
              aria-label="Return"
              className={cn(
                SEGMENT_INPUT,
                "[color-scheme:light] dark:[color-scheme:light]",
              )}
              style={{ colorScheme: "light" }}
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
        className="h-[18px] w-[18px] shrink-0 text-[#020E63]"
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
        className={cn(SEGMENT_INPUT, "w-8 text-center")}
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
        className="
          group
      
          absolute right-4 top-39 -translate-y-1/2
          inline-flex h-11 w-11
          cursor-pointer items-center justify-center
          rounded-full
          bg-[#ECF0F3]
          text-black
          shadow-[-6px_-6px_12px_var(--color-neu-highlight),6px_6px_12px_var(--color-neu-shadow)]
          transition-all duration-200
      
          hover:text-primary
      
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-primary
          focus-visible:ring-offset-2
      
          disabled:cursor-not-allowed
          disabled:bg-[#ECF0F3]/60
          disabled:text-muted
          disabled:shadow-none
      
          dark:bg-white
          dark:shadow-sm
          dark:hover:border-accent
          dark:hover:bg-accent
          dark:hover:text-accent-foreground
          dark:disabled:bg-white/60
          dark:disabled:opacity-60
      
          sm:static
          sm:my-2
          sm:translate-y-0
        "
      >
        <ArrowRightLeft
          className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180"
          aria-hidden="true"
        />
      </button>
    );
  }