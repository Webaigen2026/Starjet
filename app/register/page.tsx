"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        password: formData.get("password"),
      }),
    });

    if (response.ok) {
      router.push("/login");
    } else {
      alert("Registration failed");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-950">Create Account</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <input name="name" required placeholder="Full Name" className="w-full rounded-xl border border-slate-300 px-4 py-3" />
          <input name="email" type="email" required placeholder="Email" className="w-full rounded-xl border border-slate-300 px-4 py-3" />
          <input name="phone" placeholder="Phone" className="w-full rounded-xl border border-slate-300 px-4 py-3" />
          <input name="password" type="password" required placeholder="Password" className="w-full rounded-xl border border-slate-300 px-4 py-3" />

          <button disabled={loading} className="w-full rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white disabled:opacity-60">
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
      </div>
    </main>
  );
}