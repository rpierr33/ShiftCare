"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { List, Map } from "lucide-react";

export function ViewToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "list";

  const setView = (view: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "list") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    const qs = params.toString();
    router.push(`/worker/shifts${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
      <button
        onClick={() => setView("list")}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
          currentView === "list"
            ? "bg-cyan-600 text-white shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <List className="h-3.5 w-3.5" />
        List
      </button>
      <button
        onClick={() => setView("map")}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
          currentView === "map"
            ? "bg-cyan-600 text-white shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <Map className="h-3.5 w-3.5" />
        Map
      </button>
    </div>
  );
}
