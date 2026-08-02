import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import AdminNav from "./AdminNav";
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

  const role = session.user && typeof session.user === "object" && "role" in session.user
    ? (session.user.role as string | undefined)
    : undefined;

  if (role !== "ADMIN" && role !== "STAFF") {
    redirect("/");
  }

  return (
    <>
      <div className="border-b border-border bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-sm text-muted">Logged in as</p>
            <p className="font-semibold text-primary">
              {session.user?.email} — {role}
            </p>
          </div>

          <LogoutButton />
        </div>
      </div>

      <AdminNav />

      {children}
    </>
  );
}