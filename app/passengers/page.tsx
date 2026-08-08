"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PassengersPage() {
  return (
    <Suspense fallback={<PassengersLoading />}>
      <PassengersContent />
    </Suspense>
  );
}

function PassengersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const flightId = searchParams.get("flightId") || "";
  const airline = searchParams.get("airline") || "SkyBridge Air";
  const originCode = searchParams.get("originCode") || "";
  const destinationCode = searchParams.get("destinationCode") || "";
  const departureDate = searchParams.get("departureDate") || "";
  const returnDate = searchParams.get("returnDate") || "";
  const passengersCount = searchParams.get("passengersCount") || "1";
  const price = searchParams.get("price") || "0";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setLoading(true);

    try {
      const payload = {
        flightId,
        customerName: `${formData.get("firstName")} ${formData.get(
          "lastName"
        )}`,
        customerEmail: formData.get("customerEmail"),
        customerPhone: formData.get("customerPhone"),
        originCode,
        destinationCode,
        departureDate,
        returnDate,
        passengersCount,
        airlineName: airline,
        totalAmount: price,
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        dateOfBirth: formData.get("dateOfBirth"),
        gender: formData.get("gender"),
        nationality: formData.get("nationality"),
        passportNumber: formData.get("passportNumber"),
        passportCountry: formData.get("passportCountry"),
        passportExpiry: formData.get("passportExpiry"),
      };

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to create booking");
        return;
      }

      if (!data?.data?.id) {
        alert("Booking was created, but no booking ID was returned.");
        return;
      }

      router.push(`/checkout?bookingId=${data.data.id}`);
    } catch (error) {
      console.error("CREATE BOOKING ERROR:", error);

      alert(
        "Something went wrong while creating the booking. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Passenger Details
          </p>

          <h1 className="mt-3 text-4xl font-bold text-slate-950">
            Enter Traveler Information
          </h1>

          <p className="mt-3 text-slate-600">
            Enter passenger details exactly as shown on the travel document.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">
              Passenger 1
            </h2>

            <form
              onSubmit={handleSubmit}
              className="mt-6 grid gap-5 md:grid-cols-2"
            >
              <Input
                name="firstName"
                label="First Name"
                required
              />

              <Input
                name="lastName"
                label="Last Name"
                required
              />

              <Input
                name="customerEmail"
                label="Customer Email"
                type="email"
                required
              />

              <Input
                name="customerPhone"
                label="Customer Phone"
                required
              />

              <Input
                name="dateOfBirth"
                label="Date of Birth"
                type="date"
              />

              <div>
                <label
                  htmlFor="gender"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Gender
                </label>

                <select
                  id="gender"
                  name="gender"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <Input
                name="nationality"
                label="Nationality"
              />

              <Input
                name="passportNumber"
                label="Passport Number"
              />

              <Input
                name="passportCountry"
                label="Passport Country"
              />

              <Input
                name="passportExpiry"
                label="Passport Expiry"
                type="date"
              />

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-slate-950 px-8 py-4 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Creating Booking..."
                    : "Continue to Checkout"}
                </button>
              </div>
            </form>
          </section>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Trip Summary
            </p>

            <h2 className="mt-3 text-2xl font-bold text-slate-950">
              {airline}
            </h2>

            <div className="mt-6 space-y-4 text-sm">
              <Summary
                label="Route"
                value={`${originCode} → ${destinationCode}`}
              />

              <Summary
                label="Departure"
                value={departureDate}
              />

              {returnDate && (
                <Summary
                  label="Return"
                  value={returnDate}
                />
              )}

              <Summary
                label="Passengers"
                value={passengersCount}
              />

              <div className="border-t border-slate-200 pt-4">
                <p className="text-slate-500">Total</p>

                <p className="text-3xl font-bold text-slate-950">
                  ${price}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function PassengersLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-slate-600">
            Loading passenger information...
          </p>
        </div>
      </div>
    </main>
  );
}

function Input({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-slate-500">{label}</p>

      <p className="text-right font-semibold text-slate-900">
        {value || "N/A"}
      </p>
    </div>
  );
}