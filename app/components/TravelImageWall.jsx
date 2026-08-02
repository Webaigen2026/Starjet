import Image from "next/image";
import ThemeProvider from "./ThemeProvider";

const leftImages = [
  {
    src: "/airplane/greatnessdon-ai-generated-8635794_1920.jpg",
    alt: "Airplane wing above the clouds",
  },
  {
    src: "/airplane/kim_r_hunter-airplane-5645875_1920.jpg",
    alt: "Passenger inside an airplane cabin",
  },
  {
    src: "/airplane/ornaw-flight-4516478_1920.jpg",
    alt: "Tropical travel destination",
  },
];

const rightImages = [
  {
    src: "/airplane/ornaw-flight-4516478_1920.jpg",
    alt: "Night landscape viewed from above",
  },
  {
    src: "/airplane/istockphoto-1276398647-612x612.jpg",
    alt: "Airplane landing at sunset",
  },
  {
    src: "/airplane/airplane.jpg",
    alt: "Airplane flying through a blue night sky",
  },
];

// Three subtly different float rhythms so the circles drift out of sync
// with each other instead of bobbing like a single mechanical unit.
const FLOAT_VARIANTS = [
  { duration: "7.5s", amplitude: "10px" },
  { duration: "6.2s", amplitude: "7px" },
  { duration: "8.4s", amplitude: "12px" },
];

// Airplane-window silhouette: much rounder at the top than the bottom.
// Expressed as horizontal/vertical corner radii (border-radius shorthand
// with a "/" split) — something plain rounded-t-*/rounded-b-* utilities
// can't express, since those only take one radius per corner, not
// independent horizontal and vertical values. Kept as a shared constant
// so the outer shape and the inner hairline ring always stay in sync.
const WINDOW_RADIUS = "50% 50% 42% 42% / 64% 64% 28% 28%";

export default function TravelImageWall() {
  return (
    <div className="relative   mx-auto w-full max-w-3xl overflow-hidden px-2  sm:px-4  lg:px-2 xl:h-full xl:max-w-none ">
      {/* Decorative background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 "
      />

      <div className="grid grid-cols-2 items-start gap-3 min-[400px]:gap-4 sm:gap-5 lg:gap-6">
        <ImageColumn images={leftImages} columnIndex={0} className="" />

        <ImageColumn images={rightImages} columnIndex={1} />
      </div>

      {/* Entrance + float keyframes, scoped with a unique prefix to avoid
          colliding with any other component's global styles. */}
      <style>{`
        @keyframes tiw-rise-in {
          from {
            opacity: 0;
            transform: translateY(22px) scale(0.92);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes tiw-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(calc(var(--tiw-amplitude, 8px) * -1));
          }
        }

        .tiw-circle {
          opacity: 0;
          animation:
            tiw-rise-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards,
            tiw-float var(--tiw-duration, 7s) ease-in-out infinite;
          animation-delay: var(--tiw-rise-delay, 0s), calc(var(--tiw-rise-delay, 0s) + 0.7s);
        }

        @media (prefers-reduced-motion: reduce) {
          .tiw-circle {
            opacity: 1;
            animation: none;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}

function ImageColumn({ images, columnIndex, className = "" }) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-3 min-[400px]:gap-4 sm:gap-5 lg:gap-6 ${className}`}
    >
      {images.map((image, rowIndex) => (
        <TravelCircle
          key={image.src}
          src={image.src}
          alt={image.alt}
          priority={rowIndex === 0}
          // Interleave left/right so the reveal reads left-right-left-right
          // down the wall, rather than one column finishing before the next starts.
          orderIndex={rowIndex * 2 + columnIndex}
        />
      ))}
    </div>
  );
}

function TravelCircle({ src, alt, priority = false, orderIndex = 0 }) {
  const { duration, amplitude } = FLOAT_VARIANTS[orderIndex % FLOAT_VARIANTS.length];

  return (
    <div
      className="tiw-circle group relative mx-auto aspect-square w-full max-w-[clamp(8rem,40vw,14rem)] overflow-hidden border border-white/60 shadow-[0_18px_45px_-20px_rgba(15,23,42,0.55)] ring-1 ring-slate-900/5"
      style={{
        // @ts-expect-error -- CSS custom properties aren't in the style typings
        "--tiw-rise-delay": `${orderIndex * 0.1}s`,
        "--tiw-duration": duration,
        "--tiw-amplitude": amplitude,
        borderRadius: WINDOW_RADIUS,
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="
          (max-width: 399px) calc(50vw - 22px),
          (max-width: 639px) calc(50vw - 32px),
          (max-width: 1023px) 224px,
          (max-width: 1535px) 208px,
          224px
        "
        className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-105"
      />

      {/* Image treatment */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      />

      {/* Subtle inner border — matches the outer window silhouette so the
          hairline ring reads as one continuous shape, not a mismatched oval. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-1 border border-white/20"
        style={{ borderRadius: WINDOW_RADIUS }}
      />
    </div>
  );
}