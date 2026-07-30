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
    src: "/airplane/stubaileyphoto-plane-6511877_1920.jpg",
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
    <div className="relative p-8  w-full max-w-full ">
      <div className="grid grid-cols-2 gap-5 sm:gap-6 ">
        <div className="-translate-y-10 space-y-5 sm:space-y-6 lg:-translate-y-16">
          {leftImages.map((image) => (
            <TravelCircle
              key={image.src}
              src={image.src}
              alt={image.alt}
            />
          ))}
        </div>

        <div className="-translate-y-24 space-y-5 sm:space-y-6 lg:-translate-y-32">
          {rightImages.map((image) => (
            <TravelCircle
              key={image.src}
              src={image.src}
              alt={image.alt}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TravelCircle({
  src,
  alt,
}) {
  return (
    <div className="group relative mx-auto aspect-square w-32 overflow-hidden rounded-full border border-white/15 shadow-2xl shadow-slate-950/30 sm:w-40 md:w-48 lg:w-52 xl:w-56">
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 540px) 96px,
             (max-width: 768px) 160px,
             (max-width: 1024px) 176px,
             (max-width: 1280px) 192px,
             208px"
        
      className="object-cover transition-transform duration-500 group-hover:scale-110"
    />

    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent" />
  </div>
  );
}