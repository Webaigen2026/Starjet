"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [message, setMessage] = useState(
    "Verifying your email..."
  );

  useEffect(() => {
    async function verifyEmail() {
      const token = searchParams.get("token");

      if (!token) {
        setMessage("Verification token is missing.");
        return;
      }

      try {
        const response = await fetch(
          "/api/auth/verify-email",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          setMessage(
            "Email verified successfully. Redirecting to login..."
          );

          setTimeout(() => {
            router.push("/login");
          }, 2000);

          return;
        }

        setMessage(
          data.message || "Verification failed."
        );
      } catch (error) {
        console.error("VERIFY EMAIL ERROR:", error);

        setMessage(
          "Something went wrong while verifying your email. Please try again."
        );
      }
    }

    verifyEmail();
  }, [searchParams, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-slate-950">
          Email Verification
        </h1>

        <p className="mt-4 text-slate-600">
          {message}
        </p>
      </div>
    </main>
  );
}

function VerifyEmailLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-slate-950">
          Email Verification
        </h1>

        <p className="mt-4 text-slate-600">
          Loading verification...
        </p>
      </div>
    </main>
  );
}