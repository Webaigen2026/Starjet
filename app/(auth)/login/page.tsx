"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    router.push("/admin");
  }

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-surface p-8 shadow-sm shadow-[color:var(--shadow-color)]">
        <h1 className="text-3xl font-bold text-primary">Admin Login</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-primary outline-none placeholder:text-muted focus:border-accent"
          />

          <input
            name="password"
            type="password"
            required
            placeholder="Password"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-primary outline-none placeholder:text-muted focus:border-accent"
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-accent px-6 py-3 font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}