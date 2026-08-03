"use client";

import type { CSSProperties } from "react";

interface RouteCity {
  code: string;
  label: string;
  x: number;
  y: number;
  labelX?: number;
  labelY?: number;
  labelAnchor?: "start" | "middle" | "end";
  emphasis?: boolean;
}

// City coordinates are geographically derived: each city's real
// latitude/longitude was run through a projection fitted to this specific
// map image (using its actual coastline extremes as control points), then
// converted into this SVG's coordinate space. Coastal cities were snapped
// to the nearest point on the actual landmass so they sit on the coast
// rather than just offshore.
const originCities: RouteCity[] = [
  {
    code: "SEA",
    label: "Seattle",
    x: 191,
    y: 161,
    labelX: 191,
    labelY: 143,
  },
  {
    code: "LAX",
    label: "Los Angeles",
    x: 246,
    y: 338,
    labelX: 232,
    labelY: 320,
    labelAnchor: "end",
    emphasis: true,
  },
  {
    code: "SAN",
    label: "San Diego",
    x: 264,
    y: 347,
    labelX: 252,
    labelY: 369,
    labelAnchor: "end",
  },
  {
    code: "LAS",
    label: "Las Vegas",
    x: 259,
    y: 319,
    labelX: 259,
    labelY: 301,
  },
  {
    code: "DEN",
    label: "Denver",
    x: 359,
    y: 251,
    labelX: 359,
    labelY: 232,
  },
  {
    code: "DFW",
    label: "Dallas",
    x: 438,
    y: 342,
    labelX: 438,
    labelY: 364,
  },
  {
    code: "ORD",
    label: "Chicago",
    x: 530,
    y: 193,
    labelX: 530,
    labelY: 174,
  },
  {
    code: "ATL",
    label: "Atlanta",
    x: 560,
    y: 308,
    labelX: 560,
    labelY: 290,
  },
  {
    code: "IAD",
    label: "Washington, D.C.",
    x: 633,
    y: 220,
    labelX: 633,
    labelY: 201,
  },
  {
    code: "BOS",
    label: "Boston",
    x: 692,
    y: 160,
    labelX: 692,
    labelY: 138,
    emphasis: true,
  },
  {
    code: "JFK",
    label: "New York",
    x: 663,
    y: 189,
    labelX: 663,
    labelY: 167,
    emphasis: true,
  },
  {
    code: "MIA",
    label: "Miami",
    x: 622,
    y: 397,
    labelX: 622,
    labelY: 376,
    emphasis: true,
  },
];

const destinationCities: RouteCity[] = [
  {
    code: "CAP",
    label: "Cap-Haïtien",
    x: 878,
    y: 455,
    labelX: 900,
    labelY: 459,
    labelAnchor: "start",
    emphasis: true,
  },
  {
    code: "PAP",
    label: "Port-au-Prince",
    x: 876,
    y: 477,
    labelX: 898,
    labelY: 482,
    labelAnchor: "start",
    emphasis: true,
  },
];

const USA_MAP = {
  x: 85,
  y: 55,
  width: 720,
  height: 410,
};

const HAITI_MAP = {
  x: 802,
  y: 421,
  width: 115,
  height: 102,
};

function createRoutePath(
  origin: RouteCity,
  destination: RouteCity,
  destinationIndex: number,
) {
  const horizontalDistance = destination.x - origin.x;
  const midpointX = origin.x + horizontalDistance * 0.56;

  /*
   * Longer routes receive a higher arc. The second Haiti destination gets
   * a slightly different control point so the two route lines do not sit
   * directly on top of one another.
   */
  const arcHeight = Math.min(155, 58 + horizontalDistance * 0.11);
  const destinationOffset = destinationIndex === 0 ? -10 : 12;
  const midpointY =
    Math.min(origin.y, destination.y) - arcHeight + destinationOffset;

  return `M ${origin.x} ${origin.y}
          Q ${midpointX} ${midpointY}
            ${destination.x} ${destination.y}`;
}

export default function RouteMap() {
  return (
    <section className="overflow-hidden bg-background py-14 sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10">
        <header className="mx-auto max-w-2xl text-center">
          <h2 className="section-title text-primary">Where we fly.</h2>

          <p className="mt-3 text-sm font-medium leading-relaxed text-secondary sm:text-base">
            Request a flight from cities across the United States to
            Cap-Haïtien or Port-au-Prince.
          </p>
        </header>

        <div className="route-map mt-8 sm:mt-10">
          <svg
            viewBox="0 0 1000 560"
            className="mx-auto block h-auto w-full max-w-6xl"
            role="img"
            aria-labelledby="route-map-title route-map-description"
          >
            <title id="route-map-title">
              StarJet routes from the United States to Haiti
            </title>

            <desc id="route-map-description">
              A map showing flight routes from twelve cities in the contiguous
              United States to Cap-Haïtien and Port-au-Prince in Haiti.
            </desc>

            <defs>
              <filter
                id="map-soft-shadow"
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feDropShadow
                  dx="0"
                  dy="6"
                  stdDeviation="8"
                  floodColor="currentColor"
                  floodOpacity="0.16"
                />
              </filter>

              <filter
                id="destination-glow"
                x="-150%"
                y="-150%"
                width="400%"
                height="400%"
              >
                <feGaussianBlur stdDeviation="3.5" result="blur" />

                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <linearGradient
                id="route-line-gradient"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop
                  offset="0%"
                  stopColor="currentColor"
                  stopOpacity="0.26"
                />

                <stop
                  offset="68%"
                  stopColor="currentColor"
                  stopOpacity="0.58"
                />

                <stop
                  offset="100%"
                  stopColor="currentColor"
                  stopOpacity="0.9"
                />
              </linearGradient>
            </defs>

            {/* Country maps */}
            <g
              aria-hidden="true"
              className="text-[color:var(--shadow-color)]"
              filter="url(#map-soft-shadow)"
            >
              <image
                href="/maps/map-transparent.png"
                x={USA_MAP.x}
                y={USA_MAP.y}
                width={USA_MAP.width}
                height={USA_MAP.height}
                preserveAspectRatio="xMidYMid meet"
                className="opacity-90 dark:opacity-80"
              />

              <image
                href="/maps/haiti.png"
                x={HAITI_MAP.x}
                y={HAITI_MAP.y}
                width={HAITI_MAP.width}
                height={HAITI_MAP.height}
                preserveAspectRatio="xMidYMid meet"
                className="opacity-90 dark:opacity-85"
              />
            </g>

            {/* Flight routes */}
            <g
              aria-hidden="true"
              className="text-accent"
            >
              {originCities.flatMap((origin, originIndex) =>
                destinationCities.map((destination, destinationIndex) => (
                  <path
                    key={`${origin.code}-${destination.code}`}
                    d={createRoutePath(
                      origin,
                      destination,
                      destinationIndex,
                    )}
                    pathLength="1"
                    className="route-path fill-none"
                    stroke="url(#route-line-gradient)"
                    strokeWidth={origin.emphasis ? 1.7 : 1.2}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    style={
                      {
                        "--route-delay": `${
                          0.12 +
                          originIndex * 0.045 +
                          destinationIndex * 0.025
                        }s`,
                      } as CSSProperties
                    }
                  />
                )),
              )}
            </g>

            {/* Origin city markers */}
            <g aria-label="United States departure cities">
              {originCities.map((city) => (
                <g key={city.code}>
                  {city.emphasis && (
                    <circle
                      cx={city.x}
                      cy={city.y}
                      r="10"
                      className="fill-accent/15"
                    />
                  )}

                  <circle
                    cx={city.x}
                    cy={city.y}
                    r={city.emphasis ? 5 : 3.75}
                    className={
                      city.emphasis ? "fill-accent" : "fill-primary/75"
                    }
                  />

                  <text
                    x={city.labelX ?? city.x}
                    y={city.labelY ?? city.y - 13}
                    textAnchor={city.labelAnchor ?? "middle"}
                    className={
                      city.emphasis
                        ? "fill-primary text-[13px] font-bold"
                        : "fill-secondary text-[11px] font-semibold"
                    }
                  >
                    {city.label}
                  </text>
                </g>
              ))}
            </g>

            {/* Haiti destination markers */}
            <g aria-label="Haiti destination cities">
              {destinationCities.map((city, index) => (
                <g key={city.code}>
                  <circle
                    cx={city.x}
                    cy={city.y}
                    r="15"
                    className="destination-pulse fill-accent/15"
                    style={
                      {
                        "--pulse-delay": `${index * 0.35}s`,
                      } as CSSProperties
                    }
                  />

                  <circle
                    cx={city.x}
                    cy={city.y}
                    r="10"
                    className="fill-none stroke-accent/55"
                    strokeWidth="1.6"
                    vectorEffect="non-scaling-stroke"
                  />

                  <circle
                    cx={city.x}
                    cy={city.y}
                    r="6"
                    className="fill-accent"
                    filter="url(#destination-glow)"
                  />

                  <text
                    x={city.labelX}
                    y={city.labelY}
                    textAnchor={city.labelAnchor}
                    className="fill-primary text-[13px] font-bold"
                  >
                    {city.label}
                  </text>
                </g>
              ))}
            </g>

            {/* Small Haiti destination label */}
            <g aria-hidden="true">
              <text
                x="822"
                y="405"
                className="fill-secondary text-[10px] font-semibold uppercase tracking-[0.18em]"
              >
                Haiti
              </text>
            </g>
          </svg>
        </div>
      </div>

      <style>{`
        .route-path {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          opacity: 0;
          animation: route-draw 1.8s cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
          animation-delay: var(--route-delay, 0.2s);
        }

        .destination-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: destination-pulse 2.8s ease-in-out infinite;
          animation-delay: var(--pulse-delay, 0s);
        }

        @keyframes route-draw {
          0% {
            stroke-dashoffset: 1;
            opacity: 0;
          }

          18% {
            opacity: 1;
          }

          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        @keyframes destination-pulse {
          0%,
          100% {
            opacity: 0.28;
            transform: scale(0.82);
          }

          50% {
            opacity: 0.72;
            transform: scale(1.16);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .route-path {
            animation: none;
            stroke-dashoffset: 0;
            opacity: 1;
          }

          .destination-pulse {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}