export default function HeroSearch() {
    return (
      <section className="bg-white px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="relative min-h-[680px] overflow-hidden rounded-[2rem]">
            <img
              src="/image/hero-bck.jpeg"
              alt="Airplane taking off"
              className="absolute inset-0 h-full w-full object-cover"
            />
            

  
  <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent" />
  
            <div className="relative z-10 grid min-h-[680px] items-center gap-10 px-8 py-12 lg:grid-cols-[1fr_460px] lg:px-14">
              <div className="max-w-2xl">
                <p className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                  Haiti • United States • International Travel
                </p>
  
                <h1 className="mt-7 text-5xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
                  Book flights between Haiti, the U.S. and beyond.
                </h1>
  
                <p className="mt-6 max-w-xl text-lg leading-8 text-white/85">
                  Search flights, manage your trips, request cargo service, and
                  arrange private charter travel with SkyBridge.
                </p>
  
                <div className="mt-8 flex flex-wrap gap-3">
                  <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur">
                    Flight booking
                  </span>
                  <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur">
                    Cargo service
                  </span>
                  <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur">
                    Private charter
                  </span>
                </div>
              </div>
  
              <form
                action="/flights/results"
                className="rounded-[1.75rem] bg-white p-6 shadow-2xl"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-slate-950">
                    Find your flight
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Enter your route and travel dates.
                  </p>
                </div>
  
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="From" name="originCode" defaultValue="BOS" />
                    <Field label="To" name="destinationCode" defaultValue="PAP" />
                  </div>
  
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DateField label="Departure" name="departureDate" />
                    <DateField label="Return" name="returnDate" />
                  </div>
  
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Travelers
                    </label>
                    <input
                      name="passengersCount"
                      type="number"
                      min={1}
                      defaultValue={1}
                      className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-slate-950 outline-none focus:border-slate-950"
                    />
                  </div>
  
                  <input type="hidden" name="tripType" value="ROUND_TRIP" />
  
                  <button className="mt-2 h-14 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800">
                    Search flights
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    );
  }
  
  function Field({
    label,
    name,
    defaultValue,
  }: {
    label: string;
    name: string;
    defaultValue: string;
  }) {
    return (
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </label>
        <input
          name={name}
          defaultValue={defaultValue}
          className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-slate-950 outline-none focus:border-slate-950"
        />
      </div>
    );
  }
  
  function DateField({ label, name }: { label: string; name: string }) {
    return (
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </label>
        <input
          name={name}
          type="date"
          className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-slate-950 outline-none focus:border-slate-950"
        />
      </div>
    );
  }