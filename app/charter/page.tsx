"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  CalendarDays,
  CircleDollarSign,
  Plane,
  PlaneTakeoff,
  Send,
  Sparkles,
  UsersRound,
} from "lucide-react";

export default function CharterPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setLoading(true);
    setSuccess(false);

    const payload = {
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      departureCity: formData.get("departureCity"),
      destinationCity: formData.get("destinationCity"),
      departureDate: formData.get("departureDate"),
      returnDate: formData.get("returnDate"),
      passengersCount: formData.get("passengersCount"),
      aircraftType: formData.get("aircraftType"),
      budgetRange: formData.get("budgetRange"),
      message: formData.get("message"),
    };

    const response = await fetch("/api/charter-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setSuccess(true);
      form.reset();
    }

    setLoading(false);
  }

  return (
    <>
      <Navbar />
      {/* Fully theme-aware page — no fixed dark backdrop, so every color
          here follows light/dark mode via tokens. */}
      <main className="min-h-screen bg-background text-primary">
        <section className="relative overflow-hidden px-4 py-12 sm:px-6 lg:py-16">
          <Plane
            className="pointer-events-none absolute right-6 top-24 h-60 w-60 -rotate-12 text-primary/5"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent-muted px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-accent-muted-foreground ring-1 ring-accent/30">
                  <PlaneTakeoff className="h-4 w-4" aria-hidden="true" />
                  StarJet charter
                </p>
                <h1 className="section-title text-primary lg:text-[clamp(1.75rem,1.2rem+1.5vw,2.25rem)]">
                  Reserve the whole aircraft around your mission.
                </h1>
                <p className="mt-5 text-lg leading-8 text-secondary">
                  Charter means renting an entire aircraft for private, group,
                  or urgent travel. Submit your itinerary and the team will
                  follow up with availability and pricing.
                </p>

                <div className="mt-8 grid gap-3">
                  <InfoPill
                    icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
                    text="Private and group travel"
                  />
                  <InfoPill
                    icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
                    text="Custom dates and returns"
                  />
                  <InfoPill
                    icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
                    text="Aircraft matched to the trip"
                  />
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="overflow-hidden rounded-[28px] border border-border bg-surface text-primary shadow-2xl shadow-[color:var(--shadow-color)]"
              >
                <div className="border-b border-border bg-surface-muted px-5 py-4 sm:px-8">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-accent">
                    Charter quote
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-primary">
                    Build your aircraft request.
                  </h2>
                </div>

                <div className="p-5 sm:p-8">
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField name="fullName" required placeholder="Full Name" />
                    <TextField name="email" type="email" required placeholder="Email Address" />
                    <TextField name="phone" required placeholder="Phone Number" />
                    <TextField name="passengersCount" type="number" required min="1" placeholder="Number of Passengers" />
                    <TextField name="departureCity" required placeholder="Departure City" />
                    <TextField name="destinationCity" required placeholder="Destination City" />

                    <DateField name="departureDate" required placeholder="Departure Date" />
                    <DateField name="returnDate" placeholder="Return Date" />

                    <select
                      name="aircraftType"
                      className="h-[54px] rounded-2xl border border-border bg-surface px-4 text-sm font-bold text-primary shadow-sm outline-none focus:border-accent"
                    >
                      <option value="">Preferred Aircraft Type</option>
                      <option value="Light Jet">Light Jet</option>
                      <option value="Midsize Jet">Midsize Jet</option>
                      <option value="Heavy Jet">Heavy Jet</option>
                      <option value="Turboprop">Turboprop</option>
                      <option value="Not Sure">Not Sure</option>
                    </select>

                    <div className="flex h-[54px] items-center gap-3 rounded-2xl border border-border bg-surface px-4 text-primary shadow-sm focus-within:border-accent">
                      <CircleDollarSign className="h-5 w-5 text-accent" aria-hidden="true" />
                      <select
                        name="budgetRange"
                        className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
                      >
                        <option value="">Budget Range</option>
                        <option value="$5,000 - $10,000">$5,000 - $10,000</option>
                        <option value="$10,000 - $25,000">$10,000 - $25,000</option>
                        <option value="$25,000 - $50,000">$25,000 - $50,000</option>
                        <option value="$50,000+">$50,000+</option>
                      </select>
                    </div>
                  </div>

                  <textarea
                    name="message"
                    placeholder="Additional travel details"
                    className="mt-4 min-h-36 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-bold text-primary shadow-sm outline-none placeholder:text-muted focus:border-accent"
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-6 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-accent px-8 text-sm font-black text-accent-foreground shadow-lg shadow-[color:var(--shadow-color)] transition hover:bg-accent-hover disabled:opacity-60"
                  >
                    <Send className="h-5 w-5" aria-hidden="true" />
                    {loading ? "Submitting Request..." : "Submit Charter Request"}
                  </button>

                  {success && (
                    <p className="mt-4 rounded-2xl border border-success/30 bg-success-muted px-4 py-3 text-sm font-bold text-success-foreground">
                      Charter request submitted successfully. Our team will contact you soon.
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function TextField({
  name,
  placeholder,
  type = "text",
  required,
  min,
}: {
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  min?: string;
}) {
  return (
    <input
      name={name}
      type={type}
      required={required}
      min={min}
      placeholder={placeholder}
      className="h-[54px] rounded-2xl border border-border bg-surface px-4 text-sm font-bold text-primary shadow-sm outline-none placeholder:text-muted focus:border-accent"
    />
  );
}

function DateField({
  name,
  required,
}: {
  name: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div className="flex h-[54px] items-center gap-3 rounded-2xl border border-border bg-surface px-4 text-primary shadow-sm focus-within:border-accent">
      <CalendarDays className="h-5 w-5 text-accent" aria-hidden="true" />
      <input
        name={name}
        type="date"
        required={required}
        className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
      />
    </div>
  );
}

function InfoPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm font-bold text-primary">
      <span className="text-accent">{icon}</span>
      {text}
    </div>
  );
}