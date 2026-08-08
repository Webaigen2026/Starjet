// app/admin/airports/page.tsx

import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AirportsPage() {
  const airports = await prisma.airport.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Airport Management
            </h1>

            <p className="mt-2 text-gray-500">
              Manage airports used by StarJet Airlines.
            </p>
          </div>

          <button className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white transition hover:bg-blue-700">
            + Add Airport
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  IATA
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  ICAO
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Airport
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  City
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Country
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {airports.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No airports found.
                  </td>
                </tr>
              ) : (
                airports.map((airport) => (
                  <tr
                    key={airport.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-semibold">
                      {airport.iataCode}
                    </td>

                    <td className="px-6 py-4">
                      {airport.icaoCode ?? "-"}
                    </td>

                    <td className="px-6 py-4">
                      {airport.name}
                    </td>

                    <td className="px-6 py-4">
                      {airport.city}
                    </td>

                    <td className="px-6 py-4">
                      {airport.country}
                    </td>

                    <td className="px-6 py-4">
                      {airport.isActive ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                          Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}