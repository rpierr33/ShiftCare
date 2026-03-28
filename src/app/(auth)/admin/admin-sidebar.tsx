"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/actions/auth";
import {
  LayoutDashboard,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

interface AdminSidebarProps {
  userName: string;
  pendingProviders: number;
  pendingCredentials: number;
  openDisputes: number;
}

export function AdminSidebar({
  userName,
  pendingProviders,
  pendingCredentials,
  openDisputes,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV_ITEMS = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, badge: 0 },
    { href: "/admin/providers", label: "Provider Verification", icon: ShieldCheck, badge: pendingProviders },
    { href: "/admin/credentials", label: "Credential Review", icon: FileText, badge: pendingCredentials },
    { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle, badge: openDisputes },
    { href: "/admin/users", label: "Users", icon: Users, badge: 0 },
  ];

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  async function handleSignOut() {
    await signOutAction();
    window.location.href = "/login";
  }

  const sidebarContent = (
    <>
      {/* Logo + Admin badge */}
      <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
        <Link
          href="/admin"
          className="flex items-center gap-2"
          onClick={() => setMobileOpen(false)}
        >
          <span className="text-xl font-bold text-white tracking-tight">
            Shift<span className="text-cyan-400">Care</span>
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white">
            Admin
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                active
                  ? "bg-amber-600/20 text-amber-400"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
              }`}
            >
              <Icon
                className={`h-5 w-5 flex-shrink-0 ${
                  active
                    ? "text-amber-400"
                    : "text-slate-400 group-hover:text-slate-200"
                }`}
              />
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
              {active && (
                <ChevronRight className="h-4 w-4 text-amber-400 opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Account info + Sign out */}
      <div className="border-t border-slate-700/50 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-600">
            <span className="text-sm font-bold text-white">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {userName}
            </p>
            <p className="text-xs text-slate-400">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 right-4 z-50 h-8 w-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-slate-900">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] h-full bg-slate-900 flex flex-col shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
