"use client";

import { useState } from "react";
import { markAsRead, markAllRead } from "@/actions/notifications";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

export function MarkReadButton({ notificationId }: { notificationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await markAsRead(notificationId);
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs text-cyan-600 hover:text-cyan-700 font-medium whitespace-nowrap"
    >
      {loading ? "..." : "Mark read"}
    </button>
  );
}

export function MarkAllReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await markAllRead();
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-sm text-cyan-600 hover:text-cyan-700 font-medium"
    >
      <Check size={14} />
      {loading ? "Marking..." : "Mark all read"}
    </button>
  );
}
