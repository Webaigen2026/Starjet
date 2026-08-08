"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  Headphones,
  Mail,
  MessageSquareText,
  Phone,
  Plane,
  Send,
} from "lucide-react";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setLoading(true);

    const response = await fetch("/api/contact-messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        subject: formData.get("subject"),
        message: formData.get("message"),
      }),
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
            className="pointer-events-none absolute right-8 top-24 h-56 w-56 -rotate-12 text-primary/5"
            aria-hidden="true"
          />

          <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-accent-muted px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-accent-muted-foreground ring-1 ring-accent/30">
                <Headphones className="h-4 w-4" aria-hidden="true" />
                Contact StarJet
              </p>

              <h1 className="section-title mt-4 text-primary lg:text-[clamp(1.75rem,1.2rem+1.5vw,2.25rem)]">
                Talk to the team before takeoff.
              </h1>

              <p className="mt-5 text-lg leading-8 text-secondary">
                Send a message about flights, cargo, charter travel, or a
                custom route. The team will get back to you shortly.
              </p>

              <div className="mt-8 grid gap-3">
                <InfoPill
                  icon={<Mail className="h-5 w-5" aria-hidden="true" />}
                  text="Flight and booking questions"
                />
                <InfoPill
                  icon={<Phone className="h-5 w-5" aria-hidden="true" />}
                  text="Cargo or charter follow-up"
                />
                <InfoPill
                  icon={<MessageSquareText className="h-5 w-5" aria-hidden="true" />}
                  text="Route support and special requests"
                />
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="overflow-hidden rounded-[28px] border border-border bg-surface text-primary shadow-2xl shadow-[color:var(--shadow-color)]"
            >
              <div className="border-b border-border bg-surface-muted px-5 py-4 sm:px-8">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-accent">
                  Message center
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-primary">
                  How can we help?
                </h2>
              </div>

              <div className="p-5 sm:p-8">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField name="fullName" required placeholder="Full Name" />
                  <TextField name="email" type="email" required placeholder="Email Address" />
                  <TextField name="phone" placeholder="Phone Number" />
                  <TextField name="subject" placeholder="Subject" />
                </div>

                <textarea
                  name="message"
                  required
                  placeholder="Message"
                  className="mt-4 min-h-40 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-bold text-primary shadow-sm outline-none placeholder:text-muted focus:border-accent"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-accent px-8 text-sm font-black text-accent-foreground shadow-lg shadow-[color:var(--shadow-color)] transition hover:bg-accent-hover disabled:opacity-60"
                >
                  <Send className="h-5 w-5" aria-hidden="true" />
                  {loading ? "Sending..." : "Send Message"}
                </button>

                {success && (
                  <p className="mt-4 rounded-2xl border border-success/30 bg-success-muted px-4 py-3 text-sm font-bold text-success-foreground">
                    Message sent successfully.
                  </p>
                )}
              </div>
            </form>
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
}: {
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <input
      name={name}
      type={type}
      required={required}
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