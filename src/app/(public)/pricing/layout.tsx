import Link from "next/link";
import { auth } from "@/auth";

export default async function PricingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  const isLoggedIn = !!user;
  const role = user?.role as string | undefined;
  const dashboardUrl = role === "WORKER" ? "/worker/shifts" : "/provider/dashboard";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <Link href="/" className="text-xl font-bold tracking-tight text-white">
          ShiftCare
        </Link>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href={dashboardUrl}
              className="px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-100"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-slate-300 text-sm hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-100"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
      {children}
    </div>
  );
}
