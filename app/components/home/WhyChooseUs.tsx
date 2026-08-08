const features = [
    {
      title: "Secure Booking",
      description:
        "Your booking information is protected using modern security standards.",
    },
    {
      title: "Competitive Pricing",
      description:
        "Access flight options and travel services at competitive market rates.",
    },
    {
      title: "Customer Support",
      description:
        "Our team is available to assist before, during, and after your trip.",
    },
    {
      title: "Fast Confirmation",
      description:
        "Receive booking details and request updates without unnecessary delays.",
    },
  ];
  
  export default function WhyChooseUs() {
    return (
      <section className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-700">
              Why SkyBridge
            </p>
  
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
              Built for reliable travel planning and booking
            </h2>
  
            <p className="mt-5 text-lg leading-8 text-slate-600">
              We focus on providing a simple booking experience, dependable
              customer service, and travel solutions connecting Haiti,
              the United States, and international destinations.
            </p>
          </div>
  
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[2rem] bg-white p-7 shadow-sm"
              >
                <div className="h-12 w-12 rounded-2xl bg-blue-50" />
  
                <h3 className="mt-6 text-xl font-black text-slate-950">
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