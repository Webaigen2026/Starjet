"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
    >
      Logout
    </button>
  );
}