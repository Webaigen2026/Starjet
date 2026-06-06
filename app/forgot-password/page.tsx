"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: formData.get("email"),
      }),
    });

    const data = await response.json();

    setMessage(data.message);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-950">
          Forgot Password
        </h1>

        <p className="mt-3 text-slate-600">
          Enter your email and we’ll generate a password reset link.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <input
            name="email"
            type="email"
            required
            placeholder="Email Address"
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          />

          <button
            disabled={loading}
            className="w-full rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-green-700">{message}</p>}
      </div>
    </main>
  );
}