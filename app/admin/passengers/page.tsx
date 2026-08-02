import type { Passenger } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export default async function AdminPassengersPage() {
  const passengers: Passenger[] = await prisma.passenger.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-blue-600 font-semibold uppercase tracking-wide">
          Admin / Passengers
        </p>

        <h1 className="text-5xl font-bold mt-2">
          Passenger Management
        </h1>

        <p className="text-gray-600 mt-3">
          View all passenger records in the system.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Passenger</th>
              <th className="p-4 text-left">Gender</th>
              <th className="p-4 text-left">Nationality</th>
              <th className="p-4 text-left">Passport Number</th>
              <th className="p-4 text-left">Passport Country</th>
            </tr>
          </thead>

          <tbody>
            {passengers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-gray-500"
                >
                  No passengers found.
                </td>
              </tr>
            ) : (
              passengers.map((passenger) => (
                <tr
                  key={passenger.id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="p-4 font-medium">
                    {passenger.firstName} {passenger.lastName}
                  </td>

                  <td className="p-4">
                    {passenger.gender || "N/A"}
                  </td>

                  <td className="p-4">
                    {passenger.nationality || "N/A"}
                  </td>

                  <td className="p-4">
                    {passenger.passportNumber || "N/A"}
                  </td>

                  <td className="p-4">
                    {passenger.passportCountry || "N/A"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}