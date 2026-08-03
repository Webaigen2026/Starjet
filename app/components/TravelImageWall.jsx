import Image from "next/image";

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

// Airplane-window silhouette: much rounder at the top than the bottom.
// Expressed as horizontal/vertical corner radii (border-radius shorthand
// with a "/" split) — something plain rounded-t-*/rounded-b-* utilities
// can't express, since those only take one radius per corner, not
// independent horizontal and vertical values. Kept as a shared constant
// so the outer shape and the inner hairline ring always stay in sync.
const WINDOW_RADIUS = "50% 50% 42% 42% / 64% 64% 28% 28%";
// The inner (glass) opening sits inside the plastic bezel, so it uses a
// slightly tighter version of the same silhouette — keeps the "porthole"
// reading as one continuous shape rather than two mismatched ovals.
const GLASS_RADIUS = "50% 50% 40% 40% / 62% 62% 26% 26%";

export default function TravelImageWall() {
  return (
    // overflow-hidden → overflow-visible: the right column is now pulled up
    // past the top of this container via negative margin, so clipping it
    // here would just cut the overflowing part off instead of letting it
    // spill upward the way the stagger is meant to look.
    <div className="relative mx-auto hidden h-full w-full max-w-3xl items-center overflow-visible px-2 sm:flex sm:px-4 lg:px-2 xl:max-w-none">
      <div className="grid w-full grid-cols-2 items-start gap-3 min-[400px]:gap-4 sm:gap-5 lg:gap-6">
        {/*
          Left column stays put; right column is pulled upward with a
          negative top margin so its rows sit higher than the left
          column's — the two grids fall out of row-lock the opposite
          direction from before (right rises instead of dropping).
        */}
        <ImageColumn images={leftImages} />

        <ImageColumn
          images={rightImages}
          className="-mt-[clamp(2.5rem,4vw,1.5rem)]"
        />
      </div>
    </div>
  );
}

function ImageColumn({ images, className = "" }) {
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
        />
      ))}
    </div>
  );
}

function TravelCircle({ src, alt, priority = false }) {
  return (
    // Outer plastic bezel: a thick painted rim (gradient, not a photo) that
    // reads as the window's molded frame. Shadow now uses the shared
    // --neu-highlight / --neu-shadow tokens (same spec as the navbar and
    // hero card: -20/-20px highlight + 20/20px shadow, 28px blur, scaled
    // down to suit this control's small size — offset ≈ blur × 0.35,
    // matching the ratio used for the navbar's NEU_RAISED buttons). These
    // tokens already flip automatically between light and dark mode via
    // globals.css, so the old dark:max-[639px]:shadow-none /
    // dark:min-[640px]:shadow-[...] overrides are no longer needed.
    <div
      className="group relative mx-auto aspect-square w-full max-w-[clamp(7rem,34vw,12rem)] p-[clamp(0.4rem,1.4vw,0.65rem)] shadow-[-3px_-3px_7px_var(--color-neu-highlight),3px_3px_7px_var(--color-neu-shadow)]"
      style={{
        borderRadius: WINDOW_RADIUS,
        // background:
        //   "linear-gradient(145deg, #f8fafc 0%, #e2e8f0 45%, #cbd5e1 100%)",
        background: "#ffffff",
      }}
    >
      {/* Inner bevel ring — a thin dark groove between the outer bezel and
          the glass, the way a real window's rim casts a shadow line onto
          itself. Pure box-shadow, no extra markup needed. */}
      <div
        className="relative h-full w-full overflow-hidden"
        style={{
          borderRadius: GLASS_RADIUS,
          boxShadow:
            "inset 0 0 0 1px rgba(15,23,42,0.15), inset 0 2px 4px rgba(15,23,42,0.25)",
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

        {/* Glass tint + vignette so the "sky" reads as viewed through
            glass rather than a flat cutout photo. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-50/10 via-transparent to-slate-900/25"
        />

        {/* Curved highlight streak — the classic window-glare arc. Sits on
            top of everything else in this layer, below the bezel above it. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-1/4 -top-1/4 h-1/2 w-3/4 rotate-[-25deg] rounded-full bg-white/25 blur-md"
        />
      </div>
    </div>
  );
}