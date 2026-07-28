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
      <main className="min-h-screen bg-slate-950 text-white">
        <section className="relative overflow-hidden px-4 py-12 sm:px-6 lg:py-16">
          <div
            className="absolute inset-0 scale-110 bg-cover bg-center opacity-[0.24] blur-md"
            style={{ backgroundImage: "url('/image/hero-bck.jpeg')" }}
          />
          <div className="absolute inset-0 bg-slate-950/82" />
          <div className="absolute inset-x-0 top-0 h-56 bg-cyan-400/10 blur-3xl" />
          <Plane className="pointer-events-none absolute right-8 top-24 h-56 w-56 -rotate-12 text-white/5" />

          <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
                <Headphones className="h-4 w-4" />
                Contact SkyBridge
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-6xl">
                Talk to the team before takeoff.
              </h1>

              <p className="mt-5 text-lg leading-8 text-slate-300">
                Send a message about flights, cargo, charter travel, or a
                custom route. The team will get back to you shortly.
              </p>

              <div className="mt-8 grid gap-3">
                <InfoPill icon={<Mail className="h-5 w-5" />} text="Flight and booking questions" />
                <InfoPill icon={<Phone className="h-5 w-5" />} text="Cargo or charter follow-up" />
                <InfoPill icon={<MessageSquareText className="h-5 w-5" />} text="Route support and special requests" />
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="overflow-hidden rounded-[28px] border border-white/15 bg-white text-slate-950 shadow-2xl shadow-slate-950/40"
            >
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-8">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
                  Message center
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">
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
                  className="mt-4 min-h-40 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-cyan-600"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-8 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/25 hover:bg-cyan-400 disabled:opacity-60"
                >
                  <Send className="h-5 w-5" />
                  {loading ? "Sending..." : "Send Message"}
                </button>

                {success && (
                  <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
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
      className="h-[54px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-cyan-600"
    />
  );
}

function InfoPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur">
      <span className="text-cyan-200">{icon}</span>
      {text}
    </div>
  );
}
