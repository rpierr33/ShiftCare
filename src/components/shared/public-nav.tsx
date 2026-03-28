"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { Menu, X } from "lucide-react";

interface PublicNavProps {
  currentPage?: "home" | "pricing" | "login" | "signup" | "for-families" | "for-workers" | "resources";
}

export function PublicNav({ currentPage }: PublicNavProps) {
  const linkClass = (page: string) =>
    `text-sm font-medium transition-colors ${
      currentPage === page
        ? "text-cyan-600"
        : "text-slate-500 hover:text-slate-900"
    }`;

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, close]);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl z-50 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-xl font-bold text-slate-900">
            Shift<span className="text-cyan-600">Care</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/#how-it-works"
            className={linkClass("how-it-works")}
          >
            How It Works
          </Link>
          <Link href="/for-workers" className={linkClass("for-workers")}>
            For Workers
          </Link>
          <Link href="/for-families" className={linkClass("for-families")}>
            For Families
          </Link>
          <Link href="/resources" className={linkClass("resources")}>
            Resources
          </Link>
          <Link href="/pricing" className={linkClass("pricing")}>
            Pricing
          </Link>
          <Link href="/login" className={linkClass("login")}>
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold bg-cyan-600 text-white px-5 py-2.5 rounded-xl hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-600/20 hover:shadow-cyan-600/30"
          >
            Get Started Free
          </Link>
        </div>

        {/* Mobile hamburger menu */}
        <div ref={menuRef} className="md:hidden relative">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Open navigation menu"
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>

          {open && (
            <div className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] max-w-[280px] bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
              <Link
                href="/#how-it-works"
                onClick={close}
                className="block px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                How It Works
              </Link>
              <Link
                href="/for-workers"
                onClick={close}
                className="block px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                For Workers
              </Link>
              <Link
                href="/for-families"
                onClick={close}
                className="block px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                For Families
              </Link>
              <Link
                href="/resources"
                onClick={close}
                className="block px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Resources
              </Link>
              <Link
                href="/pricing"
                onClick={close}
                className="block px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                onClick={close}
                className="block px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Sign In
              </Link>
              <div className="px-6 pt-2 pb-1">
                <Link
                  href="/signup"
                  onClick={close}
                  className="block text-center text-sm font-semibold bg-cyan-600 text-white px-4 py-2.5 rounded-xl hover:bg-cyan-700 transition-all"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
