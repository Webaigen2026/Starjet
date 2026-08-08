const features = [
    {
      title: "Flight Booking",
      description:
        "Book flights between Haiti, the United States, and international destinations.",
    },
    {
      title: "Cargo Requests",
      description:
        "Submit cargo requests and manage shipping updates from one platform.",
    },
    {
      title: "Private Charter",
      description:
        "Request private charter service for family, business, or special travel.",
    },
  ];
  
  export default function Features() {
    return (
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="relative overflow-hidden rounded-[2rem]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: "url('/image/back.jpeg')",
              }}
            />
  
            <div className="absolute inset-0 bg-slate-950/65" />
  
            <div className="relative z-10 px-8 py-24 md:px-14">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
                Discover Haiti
              </p>
  
              <h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl">
                Connecting Haiti with the United States and beyond.
              </h2>
  
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
                SkyBridge brings flight booking, cargo service, and private
                charter requests together for travelers, families, and businesses.
              </p>
            </div>
          </div>
  
          <div className="mt-16">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
              Why SkyBridge
            </p>
  
            <h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-950">
              Travel services built around your journey.
            </h2>
  
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
                >
                  <h3 className="text-xl font-semibold text-slate-950">
                    {feature.title}
                  </h3>
  
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }