import Link from "next/link";
import {
  Shield,
  Clock,
  Users,
  CheckCircle,
  ArrowRight,
  Briefcase,
  Calendar,
  UserCheck,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-blue-600">
            ShiftCare
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Fill Open Shifts in{" "}
            <span className="text-blue-600">Hours, Not Days</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Healthcare staffing relief when you need it most. Connect with
            verified, background-checked professionals ready to pick up shifts
            today.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup?role=PROVIDER"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-blue-700 transition-colors text-base"
            >
              I Need Staff
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/signup?role=WORKER"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-blue-600 font-semibold px-8 py-3.5 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors text-base"
            >
              I&apos;m Looking for Shifts
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-gray-500 text-center mb-16 max-w-xl mx-auto">
            Whether you need staff or want to pick up shifts, getting started
            takes minutes.
          </p>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
            {/* For Providers */}
            <div>
              <h3 className="text-lg font-bold text-blue-600 mb-8 flex items-center gap-2">
                <Briefcase size={20} />
                For Healthcare Providers
              </h3>
              <div className="space-y-8">
                <Step
                  number={1}
                  title="Post Your Open Shift"
                  description="Specify the role, time, location, and pay rate. It takes under 2 minutes."
                  icon={<Calendar size={20} className="text-blue-600" />}
                />
                <Step
                  number={2}
                  title="Review Qualified Workers"
                  description="Browse verified professionals with the credentials and experience you need."
                  icon={<UserCheck size={20} className="text-blue-600" />}
                />
                <Step
                  number={3}
                  title="Confirm and Go"
                  description="Accept a worker, and they show up ready. Track everything from your dashboard."
                  icon={<CheckCircle size={20} className="text-blue-600" />}
                />
              </div>
            </div>

            {/* For Workers */}
            <div>
              <h3 className="text-lg font-bold text-blue-600 mb-8 flex items-center gap-2">
                <Users size={20} />
                For Healthcare Workers
              </h3>
              <div className="space-y-8">
                <Step
                  number={1}
                  title="Create Your Profile"
                  description="Add your credentials, certifications, and availability. One-time setup."
                  icon={<UserCheck size={20} className="text-blue-600" />}
                />
                <Step
                  number={2}
                  title="Browse Available Shifts"
                  description="Filter by location, pay, schedule, and specialty. Find shifts that fit your life."
                  icon={<Calendar size={20} className="text-blue-600" />}
                />
                <Step
                  number={3}
                  title="Apply and Get Confirmed"
                  description="Apply with one tap. Get confirmed fast and start earning on your terms."
                  icon={<CheckCircle size={20} className="text-blue-600" />}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Built for Healthcare Trust
          </h2>
          <p className="text-gray-500 text-center mb-14 max-w-xl mx-auto">
            Every worker on ShiftCare meets our quality and safety standards.
          </p>
          <div className="grid sm:grid-cols-3 gap-8">
            <TrustCard
              icon={<Shield size={28} className="text-blue-600" />}
              title="Verified Credentials"
              description="Licenses, certifications, and qualifications are validated before any worker can accept shifts."
            />
            <TrustCard
              icon={<CheckCircle size={28} className="text-blue-600" />}
              title="Background-Checked Workers"
              description="Every professional undergoes a thorough background check for your peace of mind."
            />
            <TrustCard
              icon={<Clock size={28} className="text-blue-600" />}
              title="Real-Time Availability"
              description="See who is available right now. No more phone tag or waiting for callbacks."
            />
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-20 bg-gray-50 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
            Free to start. Upgrade when you need more. Workers always use
            ShiftCare at no cost.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors text-base"
          >
            View Pricing Plans
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-lg font-bold text-blue-600">ShiftCare</div>
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} ShiftCare. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/pricing"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Step({
  number,
  title,
  description,
  icon,
}: {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
        {number}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <h4 className="font-semibold text-gray-900">{title}</h4>
        </div>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function TrustCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6 text-center shadow-sm">
      <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
