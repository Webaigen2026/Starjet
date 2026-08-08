"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = searchParams.get("token");

    if (!token) {
      setMessage(
        "The password reset link is invalid or missing a reset token."
      );
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = formData.get("password");

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(
          "Password reset successfully. Redirecting to login..."
        );

        setTimeout(() => {
          router.push("/login");
        }, 2000);

        return;
      }

      setMessage(data.message || "Failed to reset password");
    } catch (error) {
      console.error("RESET PASSWORD ERROR:", error);

      setMessage(
        "Something went wrong while resetting your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-950">
          Reset Password
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              New Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="New Password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-slate-700">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}

function ResetPasswordLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-600">
          Loading password reset...
        </p>
      </div>
    </main>
  );
}