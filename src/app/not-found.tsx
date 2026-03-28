import Link from "next/link";
import { Home, Building2, Heart, Stethoscope } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-100 px-4 py-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold text-slate-900">
              Shift<span className="text-cyan-600">Care</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-2xl bg-cyan-100 flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl font-extrabold text-cyan-600">404</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Page Not Found
          </h1>
          <p className="text-slate-500 text-lg mb-12 max-w-md mx-auto">
            This page doesn&apos;t exist. Here&apos;s where you might want to go:
          </p>

          {/* Journey Cards */}
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            <Link
              href="/signup?role=PROVIDER&type=AGENCY"
              className="group flex flex-col items-center gap-3 p-6 bg-white border border-slate-200 rounded-2xl hover:border-cyan-300 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-50 group-hover:bg-cyan-100 flex items-center justify-center transition-colors">
                <Building2 size={22} className="text-cyan-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">I&apos;m an Employer</p>
                <p className="text-xs text-slate-400 mt-1">Post shifts and find staff</p>
              </div>
            </Link>

            <Link
              href="/signup?role=PROVIDER&type=PRIVATE"
              className="group flex flex-col items-center gap-3 p-6 bg-white border border-slate-200 rounded-2xl hover:border-rose-300 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-50 group-hover:bg-rose-100 flex items-center justify-center transition-colors">
                <Heart size={22} className="text-rose-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">I Need Home Care</p>
                <p className="text-xs text-slate-400 mt-1">Find a caregiver near you</p>
              </div>
            </Link>

            <Link
              href="/signup?role=WORKER"
              className="group flex flex-col items-center gap-3 p-6 bg-white border border-slate-200 rounded-2xl hover:border-emerald-300 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                <Stethoscope size={22} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">I&apos;m a Healthcare Professional</p>
                <p className="text-xs text-slate-400 mt-1">Browse shifts and start earning</p>
              </div>
            </Link>
          </div>

          {/* Homepage link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-cyan-600 transition-colors"
          >
            <Home size={16} />
            Or go to the homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
