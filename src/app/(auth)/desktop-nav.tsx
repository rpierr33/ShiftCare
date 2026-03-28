"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={className || `px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
        isActive
          ? "text-cyan-600 bg-cyan-50"
          : "text-slate-600 hover:text-cyan-600"
      }`}
    >
      {children}
    </Link>
  );
}

export function ProviderDesktopNav() {
  return (
    <>
      <NavLink href="/agency/dashboard">Dashboard</NavLink>
      <NavLink href="/agency/shifts" >Shifts</NavLink>
      <Link
        href="/agency/shifts/new"
        className="bg-cyan-600 text-white px-4 py-2 text-sm font-semibold rounded-xl hover:bg-cyan-700 shadow-sm transition-colors"
      >
        Post Shift
      </Link>
      <NavLink href="/agency/workers">Workers</NavLink>
      <NavLink href="/agency/settings">Settings</NavLink>
    </>
  );
}

export function WorkerDesktopNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();

  const links = [
    { href: "/worker/shifts", label: "Available Shifts", live: true },
    { href: "/worker/my-shifts", label: "My Shifts" },
    { href: "/worker/schedule", label: "Schedule" },
    { href: "/worker/profile", label: "Profile" },
    { href: "/worker/earnings", label: "Earnings" },
    { href: "/worker/documents", label: "Documents" },
    { href: "/worker/notifications", label: "Notifications", badge: unreadCount },
    { href: "/worker/settings", label: "Settings" },
  ];

  return (
    <>
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors relative flex items-center gap-1.5 ${
              isActive
                ? "text-cyan-600 bg-cyan-50"
                : "text-slate-600 hover:text-cyan-600"
            }`}
          >
            {link.label}
            {link.live && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            )}
            {link.badge && link.badge > 0 ? (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {link.badge > 9 ? "9+" : link.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </>
  );
}
