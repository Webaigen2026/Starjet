import { prisma } from "../../lib/prisma";

type CargoRequestStatus =
  | "NEW"
  | "CONTACTED"
  | "QUOTED"
  | "CLOSED"
  | "IN_REVIEW"
  | "ACCEPTED"
  | "CANCELLED";

interface CargoRequestItem {
  id: string;
  requestCode: string;
  fullName: string;
  fromCity: string;
  toCity: string;
  status: CargoRequestStatus;
}

export default async function AdminCargoPage() {
  const cargoRequests: CargoRequestItem[] = await prisma.cargoRequest.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-6">Cargo Requests</h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Code</th>
              <th className="p-4 text-left">Customer</th>
              <th className="p-4 text-left">Route</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {cargoRequests.map((cargo) => (
              <tr key={cargo.id} className="border-t">
                <td className="p-4">{cargo.requestCode}</td>
                <td className="p-4">{cargo.fullName}</td>
                <td className="p-4">
                  {cargo.fromCity} → {cargo.toCity}
                </td>
                <td className="p-4">{cargo.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}