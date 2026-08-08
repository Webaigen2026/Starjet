const destinations = [
    {
      city: "Port-au-Prince",
      code: "PAP",
      country: "Haiti",
      route: "Boston to Port-au-Prince",
    },
    {
      city: "Cap-Haïtien",
      code: "CAP",
      country: "Haiti",
      route: "Boston to Cap-Haïtien",
    },
    {
      city: "Miami",
      code: "MIA",
      country: "United States",
      route: "Haiti to Miami",
    },
    {
      city: "New York",
      code: "JFK",
      country: "United States",
      route: "Haiti to New York",
    },
  ];
  
  export default function PopularDestinations() {
    return (
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-700">
                Popular Routes
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
                Destinations travelers search often
              </h2>
            </div>
          </div>
  
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {destinations.map((item) => (
              <div
                key={item.code}
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">
                  {item.code}
                </div>
  
                <h3 className="mt-6 text-xl font-black text-slate-950">
                  {item.city}
                </h3>
  
                <p className="mt-1 text-sm text-slate-500">{item.country}</p>
  
                <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  {item.route}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }