import Link from "next/link";
import { getSessionUser } from "@/lib/auth-utils";
import { SignOutButton } from "./sign-out-button";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  const isProvider = user.role === "PROVIDER";
  const initial = user.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          {/* Left: Logo + Nav links */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-lg font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              ShiftCare
            </Link>
            <nav className="flex items-center gap-1 flex-wrap">
              {isProvider ? (
                <>
                  <Link
                    href="/provider/dashboard"
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/provider/shifts/new"
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Post Shift
                  </Link>
                  <Link
                    href="/provider/workers"
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Workers
                  </Link>
                  <Link
                    href="/provider/billing"
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Billing
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/worker/shifts"
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Available Shifts
                  </Link>
                  <Link
                    href="/worker/my-shifts"
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    My Shifts
                  </Link>
                  <Link
                    href="/worker/profile"
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Profile
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Right: User info + Sign out */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {initial}
            </div>
            <span className="text-sm text-gray-700 font-medium hidden sm:inline">
              {user.name}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isProvider
                  ? "bg-blue-100 text-blue-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {isProvider ? "Provider" : "Worker"}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Gradient accent line */}
      <div className="h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
