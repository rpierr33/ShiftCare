"use client";

import { signOutAction } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

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
      className="text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
    >
      {isPending ? "Signing out..." : "Sign Out"}
    </button>
  );
}
