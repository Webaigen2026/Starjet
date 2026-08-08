import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import LogoutButton from "./LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as any)?.role;

  if (role !== "ADMIN" && role !== "STAFF") {
    redirect("/");
  }

  return (
    <>
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Logged in as</p>
            <p className="font-semibold text-slate-950">
              {session.user?.email} — {role}
            </p>
          </div>

          <LogoutButton />
        </div>
      </div>

      {children}
    </>
  );
}