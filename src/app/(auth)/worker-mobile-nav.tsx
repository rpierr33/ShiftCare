"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Calendar, CalendarDays, User, DollarSign } from "lucide-react";

const tabs = [
  { href: "/worker/shifts", label: "Shifts", icon: ClipboardList },
  { href: "/worker/my-shifts", label: "My Shifts", icon: Calendar },
  { href: "/worker/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/worker/earnings", label: "Earnings", icon: DollarSign },
  { href: "/worker/profile", label: "Profile", icon: User },
];

export function WorkerMobileNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 relative transition-colors ${
                isActive ? "text-cyan-600" : "text-slate-400"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
                {tab.label}
              </span>
              {/* Notification badge on My Shifts tab as a signal */}
              {tab.href === "/worker/my-shifts" && unreadCount > 0 && (
                <span className="absolute -top-0.5 right-0.5 h-4 w-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      <style>{`
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
    </nav>
  );
}
