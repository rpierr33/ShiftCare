"use client";

import { signOutAction } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOutAction();
      router.push("/login");
    });
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 px-2 py-1 text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 rounded-md hover:bg-gray-50"
    >
      <LogOut size={14} />
      {isPending ? "Signing out..." : "Sign Out"}
    </button>
  );
}
