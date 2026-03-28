"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markAsRead, markAllRead } from "@/actions/notifications";
import { Check, CheckCheck } from "lucide-react";

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
      className="text-cyan-600 hover:text-cyan-700 p-1 rounded-lg hover:bg-cyan-100 transition-colors flex-shrink-0 disabled:opacity-50"
      title="Mark as read"
    >
      <Check size={16} />
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
      className="text-sm text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-cyan-50 transition-colors disabled:opacity-50"
    >
      <CheckCheck size={16} />
      {loading ? "Marking..." : "Mark all read"}
    </button>
  );
}
