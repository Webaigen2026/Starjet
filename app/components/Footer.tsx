import Link from "next/link";
import { Plane } from "lucide-react";

const links = [
  { label: "Flights", href: "/flights" },
  { label: "Cargo", href: "/cargo" },
  { label: "Charter", href: "/charter" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 px-4 py-10 text-slate-700 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-cyan-200">
            <Plane className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-black tracking-tight text-slate-950">
              SkyBridge
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
              Air & Cargo
            </p>
          </div>
        </Link>

        <nav className="flex flex-wrap gap-4 text-sm font-bold">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-slate-950">
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-sm font-semibold text-slate-500">
          Passenger, cargo, and charter travel services.
        </p>
      </div>
    </footer>
  );
}
