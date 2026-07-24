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
      <section className="bg-slate-50 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
              Why SkyBridge
            </p>
  
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
              Travel services built around your journey.
            </h2>
  
            <p className="mt-5 text-lg leading-8 text-slate-600">
              From flight booking to cargo and charter requests, SkyBridge helps
              travelers and businesses move with confidence.
            </p>
          </div>
  
          <div className="mt-12 grid gap-6 md:grid-cols-3">
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
      </section>
    );
  }