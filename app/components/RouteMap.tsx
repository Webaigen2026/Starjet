"use client";

interface RouteCity {
  code: string;
  label: string;
  x: number;
  y: number;
  emphasis?: boolean;
}

// Representative spread of U.S. origin cities — not an exhaustive list of
// every state, but enough coverage (West, Mountain, Midwest, South,
// Northeast) to read as "fly from anywhere in the U.S." rather than a
// fixed route map. Coordinates are hand-placed on the 1000x560 viewBox,
// stylized rather than geographically precise.
const originCities: RouteCity[] = [
  { code: "SEA", label: "Seattle", x: 148, y: 96 },
  { code: "LAX", label: "Los Angeles", x: 122, y: 300, emphasis: true },
  { code: "SAN", label: "San Diego", x: 138, y: 330 },
  { code: "LAS", label: "Las Vegas", x: 192, y: 268 },
  { code: "DEN", label: "Denver", x: 320, y: 224 },
  { code: "DFW", label: "Dallas", x: 380, y: 340 },
  { code: "ORD", label: "Chicago", x: 470, y: 176 },
  { code: "ATL", label: "Atlanta", x: 560, y: 320 },
  { code: "IAD", label: "Washington, D.C.", x: 660, y: 220 },
  { code: "BOS", label: "Boston", x: 760, y: 118, emphasis: true },
  { code: "JFK", label: "New York", x: 720, y: 158, emphasis: true },
  { code: "MIA", label: "Miami", x: 660, y: 440, emphasis: true },
];

// Haiti's two primary airports, positioned southeast of the mainland shape.
const destinationCities: RouteCity[] = [
  { code: "CAP", label: "Cap-Haïtien", x: 830, y: 470 },
  { code: "PAP", label: "Port-au-Prince", x: 850, y: 500 },
];

export default function RouteMap() {
  return (
    <section className="bg-background py-14 sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10">
        <h2 className="section-title text-center text-primary">
          Where we fly.
        </h2>

        <p className="mx-auto mt-3 max-w-md text-center text-sm font-medium text-secondary">
          Request a flight from anywhere in the U.S. — StarJet routes to
          Cap-Haïtien and Port-au-Prince.
        </p>

        <div className="route-map mt-10 overflow-x-auto">
          <svg
            viewBox="0 0 1000 560"
            className="mx-auto w-full min-w-[720px] max-w-4xl"
            role="img"
            aria-label="Map showing StarJet flight routes from cities across the United States to Cap-Haïtien and Port-au-Prince, Haiti"
          >
            {/* Stylized U.S. silhouette — simplified, not cartographically precise */}
            <path
              d="M 90 120
                 L 200 80 L 320 70 L 460 75 L 560 60 L 660 75
                 L 740 90 Q 800 100 790 140
                 L 770 190 Q 800 210 780 240
                 L 700 260 L 690 300 Q 720 330 690 360
                 L 640 420 L 600 400 L 560 430
                 L 480 410 L 420 440 L 360 400
                 L 300 420 L 220 380 L 160 360
                 L 110 300 L 95 220 L 80 170 Z"
              className="fill-surface-muted stroke-border"
              strokeWidth="2"
            />

            {/* Flight paths */}
            {originCities.map((origin) => {
              const via = destinationCities[0];

              return (
                <g key={origin.code}>
                  {destinationCities.map((destination) => {
                    const midX = (origin.x + destination.x) / 2;
                    const midY = Math.min(origin.y, destination.y) - 60;

                    return (
                      <path
                        key={`${origin.code}-${destination.code}`}
                        d={`M ${origin.x} ${origin.y} Q ${midX} ${midY} ${destination.x} ${destination.y}`}
                        className="route-path fill-none stroke-accent/40"
                        strokeWidth="1.25"
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* Origin city markers + labels */}
            {originCities.map((city) => (
              <g key={city.code}>
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={city.emphasis ? 5 : 3.5}
                  className={
                    city.emphasis
                      ? "fill-accent"
                      : "fill-secondary"
                  }
                />
                <text
                  x={city.x}
                  y={city.y - 12}
                  textAnchor="middle"
                  className={
                    city.emphasis
                      ? "fill-primary text-[13px] font-black"
                      : "fill-secondary text-[11px] font-semibold"
                  }
                >
                  {city.label}
                </text>
              </g>
            ))}

            {/* Destination markers + labels */}
            {destinationCities.map((city) => (
              <g key={city.code}>
                <circle cx={city.x} cy={city.y} r={6} className="fill-accent" />
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={10}
                  className="fill-none stroke-accent/40"
                  strokeWidth="1.5"
                />
                <text
                  x={city.x + 16}
                  y={city.y + 4}
                  className="fill-primary text-[13px] font-black"
                >
                  {city.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      <style>{`
        .route-path {
          stroke-dasharray: 700;
          stroke-dashoffset: 700;
          animation: route-draw 1.6s ease-out forwards;
          animation-delay: 0.2s;
        }

        @keyframes route-draw {
          to {
            stroke-dashoffset: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .route-path {
            animation: none;
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </section>
  );
}