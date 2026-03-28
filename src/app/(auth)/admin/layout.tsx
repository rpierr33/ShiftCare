import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { AdminSidebar } from "./admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  // Fetch pending action counts for sidebar badges
  const [pendingProviders, pendingCredentials, openDisputes] = await Promise.all([
    db.providerProfile.count({
      where: { onboardingComplete: true, complianceStatus: "PENDING" },
    }),
    db.workerProfile.count({
      where: { credentialStatus: "PENDING" },
    }),
    db.shift.count({
      where: { status: "DISPUTED" },
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar
        userName={user.name}
        pendingProviders={pendingProviders}
        pendingCredentials={pendingCredentials}
        openDisputes={openDisputes}
      />

      {/* Main content area */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-100 px-4 h-14 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-lg font-bold text-cyan-600">ShiftCare</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500 text-white">
              Admin
            </span>
          </Link>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
