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

export default function TravelImageWall() {
  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden px-2  sm:px-4  lg:px-2 xl:h-full xl:max-w-none ">
      {/* Decorative background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 "
      />

      <div className="grid grid-cols-2 items-start gap-3 min-[400px]:gap-4 sm:gap-5 lg:gap-6">
        <ImageColumn
          images={leftImages}
          className=""
        />

        <ImageColumn images={rightImages} />
      </div>
    </div>
  );
}

function ImageColumn({ images, className = "" }) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-3 min-[400px]:gap-4 sm:gap-5 lg:gap-6 ${className}`}
    >
      {images.map((image, index) => (
        <TravelCircle
          key={image.src}
          src={image.src}
          alt={image.alt}
          priority={index === 0}
        />
      ))}
    </div>
  );
}

function TravelCircle({ src, alt, priority = false }) {
  return (
    <div className="group relative mx-auto aspect-square w-full max-w-[clamp(8rem,40vw,14rem)] overflow-hidden rounded-full border border-white/60 shadow-[0_18px_45px_-20px_rgba(15,23,42,0.55)] ring-1 ring-slate-900/5">
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

      {/* Subtle inner border */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-1 rounded-full border border-white/20"
      />
    </div>
  );
}