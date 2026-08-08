"use client";

import { useState } from "react";

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
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Contact Us
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-950">
            Get In Touch
          </h1>

          <p className="mt-4 text-slate-600">
            Send us a message and our team will get back to you shortly.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <input
              name="fullName"
              required
              placeholder="Full Name"
              className="rounded-xl border border-slate-300 px-4 py-3"
            />

            <input
              name="email"
              type="email"
              required
              placeholder="Email Address"
              className="rounded-xl border border-slate-300 px-4 py-3"
            />

            <input
              name="phone"
              placeholder="Phone Number"
              className="rounded-xl border border-slate-300 px-4 py-3"
            />

            <input
              name="subject"
              placeholder="Subject"
              className="rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>

          <textarea
            name="message"
            required
            placeholder="Message"
            className="mt-6 min-h-40 w-full rounded-xl border border-slate-300 px-4 py-3"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-6 rounded-xl bg-slate-950 px-8 py-4 font-semibold text-white"
          >
            {loading ? "Sending..." : "Send Message"}
          </button>

          {success && (
            <p className="mt-4 text-green-600">
              Message sent successfully.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}