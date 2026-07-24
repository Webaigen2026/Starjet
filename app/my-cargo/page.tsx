export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { prisma } from "../lib/prisma";

export default async function MyCargoPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;

  const cargoRequests = await prisma.cargoRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-950">
          My Cargo Requests
        </h1>

        <div className="mt-8 space-y-4">
          {cargoRequests.length === 0 ? (
            <p className="text-slate-600">No cargo requests found.</p>
          ) : (
            cargoRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="font-semibold text-slate-950">
                  {request.requestCode}
                </p>

                <p className="mt-2 text-slate-600">
                  {request.fromCity} → {request.toCity}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Type: {request.cargoType}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Status: {request.status}
                </p>

                {request.adminNotes && (
                  <p className="mt-3 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
                    Admin Note: {request.adminNotes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}