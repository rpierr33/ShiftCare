export const dynamic = "force-dynamic";

import Link from "next/link";
import { getSessionUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { SignOutButton } from "./sign-out-button";
import { WorkerMobileNav } from "./worker-mobile-nav";
import { ProviderDesktopNav, WorkerDesktopNav } from "./desktop-nav";
import { PushRegistration } from "@/components/shared/push-registration";

const ROLE_LABELS: Record<string, string> = {
  RN: "RN",
  LPN: "LPN",
  CNA: "CNA",
  HHA: "HHA",
  MEDICAL_ASSISTANT: "Med Assist",
  COMPANION: "Companion",
  OTHER: "Healthcare",
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  const isProvider = user.role === "PROVIDER";
  const initial = user.name?.charAt(0)?.toUpperCase() ?? "?";

  // Get the worker's actual role for display
  let roleBadgeText = "Provider";
  if (!isProvider) {
    const profile = await db.workerProfile.findUnique({
      where: { userId: user.id },
      select: { workerRole: true },
    });
    roleBadgeText = profile?.workerRole
      ? (ROLE_LABELS[profile.workerRole] ?? profile.workerRole)
      : "Healthcare Professional";
  }

  // Get unread notification count for workers
  let unreadCount = 0;
  if (!isProvider) {
    unreadCount = await db.notification.count({
      where: { userId: user.id, read: false },
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top navigation bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Left: Logo + Nav links */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-xl font-bold text-cyan-600 hover:text-cyan-700 transition-colors"
            >
              ShiftCare
            </Link>
            {/* Desktop nav — hidden on mobile for workers (they use bottom tab bar) */}
            <nav className={`items-center gap-1 flex-wrap ${isProvider ? "flex" : "hidden md:flex"}`}>
              {isProvider ? (
                <ProviderDesktopNav />
              ) : (
                <WorkerDesktopNav unreadCount={unreadCount} />
              )}
            </nav>
          </div>

          {/* Right: User info + Sign out */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {initial}
            </div>
            <span className="text-sm text-slate-700 font-medium hidden sm:inline">
              {user.name}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium hidden sm:inline ${
                isProvider
                  ? "bg-cyan-100 text-cyan-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {roleBadgeText}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Gradient accent line */}
      <div className="h-0.5 bg-gradient-to-r from-cyan-500 to-emerald-500" />

      {/* Main content — add bottom padding on mobile for workers to account for bottom nav */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${!isProvider ? "pb-24 md:pb-8" : ""}`}>
        {children}
      </main>

      {/* Mobile bottom tab bar for workers */}
      {!isProvider && <WorkerMobileNav unreadCount={unreadCount} />}

      {/* Push notification registration (subtle, renders its own UI) */}
      <PushRegistration />
    </div>
  );
}
