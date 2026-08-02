"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  CalendarDays,
  MapPin,
  PackageCheck,
  PlaneTakeoff,
  Scale,
  Send,
  ShieldCheck,
} from "lucide-react";

export default function CargoPage() {
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
      fromCity: formData.get("fromCity"),
      fromAddress: formData.get("fromAddress"),
      toCity: formData.get("toCity"),
      toAddress: formData.get("toAddress"),
      cargoType: formData.get("cargoType"),
      weight: formData.get("weight"),
      dimensions: formData.get("dimensions"),
      description: formData.get("description"),
      estimatedValue: formData.get("estimatedValue"),
      preferredDate: formData.get("preferredDate"),
    };

    const response = await fetch("/api/cargo-requests", {
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
          <PlaneTakeoff
            className="pointer-events-none absolute right-6 top-28 h-56 w-56 -rotate-12 text-primary/5"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div>
                <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent-muted px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-accent-muted-foreground ring-1 ring-accent/30">
                  <PackageCheck className="h-4 w-4" aria-hidden="true" />
                  StarJet cargo
                </p>
                <h1 className="section-title text-primary lg:text-[clamp(1.75rem,1.2rem+1.5vw,2.25rem)]">
                  Air cargo requests with route clarity.
                </h1>
                <p className="mt-5 text-lg leading-8 text-secondary">
                  Send packages, boxes, documents, barrels, and business
                  shipments between the USA and Haiti. Share the shipment
                  details and the team will respond with pricing and next steps.
                </p>

                <div className="mt-8 grid gap-3">
                  <InfoPill
                    icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
                    text="Pickup and delivery city details"
                  />
                  <InfoPill
                    icon={<Scale className="h-5 w-5" aria-hidden="true" />}
                    text="Weight, dimensions, and cargo type"
                  />
                  <InfoPill
                    icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
                    text="Dedicated request review"
                  />
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="overflow-hidden rounded-[28px] border border-border bg-surface text-primary shadow-2xl shadow-[color:var(--shadow-color)]"
              >
                <div className="border-b border-border bg-surface-muted px-5 py-4 sm:px-8">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-accent">
                    Shipment intake
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-primary">
                    Tell us what is flying.
                  </h2>
                </div>

                <div className="p-5 sm:p-8">
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField name="fullName" required placeholder="Full Name" />
                    <TextField name="email" type="email" required placeholder="Email Address" />
                    <TextField name="phone" required placeholder="Phone Number" />

                    <select
                      name="cargoType"
                      className="h-[54px] rounded-2xl border border-border bg-surface px-4 text-sm font-bold text-primary shadow-sm outline-none focus:border-accent"
                    >
                      <option value="OTHER">Cargo Type</option>
                      <option value="DOCUMENTS">Documents</option>
                      <option value="BOX">Box</option>
                      <option value="BARREL">Barrel</option>
                      <option value="PALLET">Pallet</option>
                      <option value="OTHER">Other</option>
                    </select>

                    <TextField name="fromCity" required placeholder="Pickup City" />
                    <TextField name="toCity" required placeholder="Destination City" />
                    <TextField name="fromAddress" placeholder="Pickup Address" />
                    <TextField name="toAddress" placeholder="Destination Address" />
                    <TextField name="weight" type="number" step="0.01" placeholder="Estimated Weight" />
                    <TextField name="dimensions" placeholder="Dimensions" />
                    <TextField name="estimatedValue" type="number" step="0.01" placeholder="Estimated Value" />

                    <div className="flex h-[54px] items-center gap-3 rounded-2xl border border-border bg-surface px-4 text-primary shadow-sm focus-within:border-accent">
                      <CalendarDays className="h-5 w-5 text-accent" aria-hidden="true" />
                      <input
                        name="preferredDate"
                        type="date"
                        className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
                      />
                    </div>
                  </div>

                  <textarea
                    name="description"
                    required
                    placeholder="Describe what you are shipping"
                    className="mt-4 min-h-36 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-bold text-primary shadow-sm outline-none placeholder:text-muted focus:border-accent"
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-6 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-accent px-8 text-sm font-black text-accent-foreground shadow-lg shadow-[color:var(--shadow-color)] transition hover:bg-accent-hover disabled:opacity-60"
                  >
                    <Send className="h-5 w-5" aria-hidden="true" />
                    {loading ? "Submitting Request..." : "Submit Cargo Request"}
                  </button>

                  {success && (
                    <p className="mt-4 rounded-2xl border border-success/30 bg-success-muted px-4 py-3 text-sm font-bold text-success-foreground">
                      Cargo request submitted successfully. Our team will contact you soon.
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
  step,
}: {
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <input
      name={name}
      type={type}
      required={required}
      step={step}
      placeholder={placeholder}
      className="h-[54px] rounded-2xl border border-border bg-surface px-4 text-sm font-bold text-primary shadow-sm outline-none placeholder:text-muted focus:border-accent"
    />
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