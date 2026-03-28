import Link from "next/link";

/* Site-wide footer with brand, platform links, company links, and legal links */
export function PublicFooter() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="text-lg font-bold text-white">
                Shift<span className="text-cyan-400">Care</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Fill open shifts in hours, not days.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
            <div className="flex flex-col gap-2.5">
              <Link href="/for-workers" className="text-sm text-slate-400 hover:text-white transition-colors">
                For Workers
              </Link>
              <Link href="/for-families" className="text-sm text-slate-400 hover:text-white transition-colors">
                For Families
              </Link>
              <Link href="/resources" className="text-sm text-slate-400 hover:text-white transition-colors">
                Resources
              </Link>
              <Link href="/demo" className="text-sm text-slate-400 hover:text-white transition-colors">
                Book a Demo
              </Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
            <div className="flex flex-col gap-2.5">
              <Link href="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">
                How It Works
              </Link>
              <Link href="/about" className="text-sm text-slate-400 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-sm text-slate-400 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Account</h4>
            <div className="flex flex-col gap-2.5">
              <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="text-sm text-slate-400 hover:text-white transition-colors">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} ShiftCare. All rights
            reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/contact" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
