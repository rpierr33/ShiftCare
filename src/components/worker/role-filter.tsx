"use client";

import { useRouter, usePathname } from "next/navigation";

const ROLES = [
  { value: "", label: "All Roles" },
  { value: "RN", label: "RN" },
  { value: "LPN", label: "LPN" },
  { value: "CNA", label: "CNA" },
  { value: "HHA", label: "HHA" },
  { value: "MEDICAL_ASSISTANT", label: "Medical Assistant" },
  { value: "COMPANION", label: "Companion" },
];

export function RoleFilter({ currentRole }: { currentRole?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <select
      value={currentRole || ""}
      onChange={(e) => {
        const role = e.target.value;
        router.push(role ? `${pathname}?role=${role}` : pathname);
      }}
      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
    >
      {ROLES.map((r) => (
        <option key={r.value} value={r.value}>
          {r.label}
        </option>
      ))}
    </select>
  );
}
