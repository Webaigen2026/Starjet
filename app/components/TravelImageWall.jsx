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

// Airplane-window silhouette: much rounder at the top than the bottom.
// Expressed as horizontal/vertical corner radii (border-radius shorthand
// with a "/" split) — something plain rounded-t-*/rounded-b-* utilities
// can't express, since those only take one radius per corner, not
// independent horizontal and vertical values. Kept as a shared constant
// so the outer shape and the inner hairline ring always stay in sync.
const WINDOW_RADIUS = "50% 50% 42% 42% / 64% 64% 28% 28%";

export default function TravelImageWall() {
  return (
    <div className="relative   mx-auto w-full max-w-3xl overflow-hidden py-10 px-2  sm:px-4  lg:px-2 xl:h-full xl:max-w-none ">
      {/* Decorative background glow */}
      {/* <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 "
      /> */}

      <div className="grid grid-cols-2 items-start gap-3 min-[400px]:gap-4 sm:gap-5 lg:gap-6">
        <ImageColumn images={leftImages} className="" />

        {/* Offset upward by roughly half a window's height so the two
            columns fall out of row-lock with each other — a brick/masonry
            stagger instead of a perfect grid. The clamp mirrors half of
            each circle's own clamp(8rem,40vw,14rem) sizing, so the offset
            scales in step with the windows themselves at every breakpoint.
            Negative margin pushes the column above the wrapper's top edge;
            the wrapper's own overflow-hidden (set on the outermost div
            above) clips that excess cleanly instead of spilling out. */}
        <ImageColumn
          images={rightImages}
          className="-mt-[clamp(2.5rem,4vw,6.5rem)]"
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
    <div
      className="group relative mx-auto aspect-square w-full max-w-[clamp(7rem,34vw,12rem)] overflow-hidden border border-white/60 shadow-[0_2px_8px_rgba(0,0,0,0.06),_0_16px_32px_-8px_rgba(0,0,0,0.12)] ring-1 ring-slate-900/5"
      style={{ borderRadius: WINDOW_RADIUS }}
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