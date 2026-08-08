import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
            SB
          </div>
          <div>
            <p className="text-lg font-black tracking-tight text-slate-950">
              SkyBridge
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
              Travel
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
          <Link href="/flights" className="hover:text-slate-950">
            Flights
          </Link>
          <Link href="/cargo" className="hover:text-slate-950">
            Cargo
          </Link>
          <Link href="/charter" className="hover:text-slate-950">
            Charter
          </Link>
          <Link href="/support" className="hover:text-slate-950">
            Support
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-full px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 sm:inline-flex"
          >
            Sign in
          </Link>

          <Link
            href="/flights"
            className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
          >
            Search flights
          </Link>
        </div>
      </div>
    </header>
  );
}