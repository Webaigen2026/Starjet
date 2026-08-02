import type { CharterRequest } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export default async function AdminCharterPage() {
  const charterRequests: CharterRequest[] = await prisma.charterRequest.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
          Admin / Charter
        </p>

        <h1 className="mt-3 text-4xl font-black text-slate-950">
          Charter Request Management
        </h1>

        <p className="mt-3 text-slate-600">
          View and manage private charter requests.
        </p>

        <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-6 py-4">Request Code</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Aircraft</th>
                <th className="px-6 py-4">Passengers</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {charterRequests.map((request) => (
                <tr key={request.id} className="border-t border-slate-100">
                  <td className="px-6 py-4 font-bold text-slate-950">
                    {request.requestCode}
                  </td>

                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-950">
                      {request.fullName}
                    </p>
                    <p className="text-xs text-slate-500">{request.email}</p>
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {request.departureCity} → {request.destinationCity}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {request.aircraftType || "N/A"}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {request.passengersCount}
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                      {request.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}