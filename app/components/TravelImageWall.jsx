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
    // Hidden below sm (this whole decorative wall is skipped on small
    // screens), then switches back to flex at sm+ — hidden alone only
    // toggles display:none on/off, it doesn't restore the original flex
    // layout, so the sm: variant has to explicitly say "flex" again.
    <div className="relative mx-auto hidden h-full w-full max-w-3xl items-center overflow-hidden px-2 sm:flex sm:px-4 lg:px-2 xl:max-w-none">
      <div className="grid w-full grid-cols-2 items-start gap-3 min-[400px]:gap-4 sm:gap-5 lg:gap-6">
        {/*
          Stagger without negative margin: pad the left column from the top
          and the right from the bottom by the same clamp. Both columns keep
          identical total height while the windows fall out of row-lock —
          brick/masonry instead of a perfect grid. The clamp mirrors roughly
          half a window's sizing so the offset scales with the windows.
        */}
        <ImageColumn
          images={leftImages}
          className="pt-[clamp(2.5rem,4vw,6.5rem)]"
        />

        <ImageColumn
          images={rightImages}
          className="pb-[clamp(2.5rem,4vw,6.5rem)]"
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
    // reads as the window's molded frame. Neumorphic drop shadow lifts the
    // whole assembly off the page — moved from inline `style` to a Tailwind
    // arbitrary `shadow-[...]` class specifically so it can be overridden by
    // `dark:max-[639px]:shadow-none` below; an inline style would always
    // beat a class on specificity, so the toggle couldn't win against it.
    <div
      className="group relative mx-auto aspect-square w-full max-w-[clamp(7rem,34vw,12rem)] p-[clamp(0.4rem,1.4vw,0.65rem)] shadow-[6px_6px_12px_rgba(209,217,230,0.9),-6px_-6px_12px_rgba(255,255,255,0.9)] dark:max-[639px]:shadow-none dark:min-[640px]:shadow-[0_8px_20px_var(--shadow-color)]"
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