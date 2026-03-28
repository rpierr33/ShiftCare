import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { AgencySidebar } from "./agency-sidebar";

export default async function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (user.role !== "PROVIDER") {
    redirect("/worker/shifts");
  }

  const [profile, unreadCount] = await Promise.all([
    db.providerProfile.findUnique({
      where: { userId: user.id },
      select: { companyName: true, providerType: true },
    }),
    db.notification.count({
      where: { userId: user.id, read: false },
    }),
  ]);

  const providerType = (profile?.providerType as "AGENCY" | "PRIVATE") || "AGENCY";
  const agencyName = profile?.companyName || user.name;
  const initial = agencyName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AgencySidebar
        agencyName={agencyName}
        initial={initial}
        userName={user.name}
        unreadCount={unreadCount}
        providerType={providerType}
      />

      {/* Main content area */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-100 px-4 h-14 flex items-center justify-between">
          <Link href="/agency/dashboard" className="text-lg font-bold text-cyan-600">
            ShiftCare
          </Link>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
