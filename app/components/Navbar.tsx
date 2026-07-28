import Link from "next/link";
import { Menu, Plane, Search, UserRound } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/20 bg-slate-950/90 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/25">
            <Plane className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-black tracking-tight text-white">
              SkyBridge
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-200">
              Air & Cargo
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-sm font-semibold text-slate-200 md:flex">
          <Link href="/flights" className="rounded-full px-4 py-2 hover:bg-white/10 hover:text-white">
            Flights
          </Link>
          <Link href="/cargo" className="rounded-full px-4 py-2 hover:bg-white/10 hover:text-white">
            Cargo
          </Link>
          <Link href="/charter" className="rounded-full px-4 py-2 hover:bg-white/10 hover:text-white">
            Charter
          </Link>
          <Link href="/contact" className="rounded-full px-4 py-2 hover:bg-white/10 hover:text-white">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/10 sm:inline-flex"
          >
            <UserRound className="h-4 w-4" />
            Sign in
          </Link>

          <Link
            href="/flights"
            className="hidden items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-black/20 hover:bg-cyan-100 sm:inline-flex"
          >
            <Search className="h-4 w-4" />
            Search flights
          </Link>

          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 md:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
