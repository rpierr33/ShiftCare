import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/shared/public-nav";
import { PublicFooter } from "@/components/shared/public-footer";
import { ArrowRight, Eye, ShieldCheck, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "About ShiftCare",
  description:
    "Our mission to transform healthcare staffing in Florida.",
  alternates: {
    canonical: "/about",
  },
};

const VALUES = [
  {
    icon: <Eye size={24} className="text-cyan-600" />,
    title: "Transparency",
    description:
      "No hidden fees, no surprises. Workers see their exact take-home before accepting a shift. Employers see clear pricing with no per-shift markups on paid plans.",
  },
  {
    icon: <ShieldCheck size={24} className="text-cyan-600" />,
    title: "Reliability",
    description:
      "Every professional on ShiftCare is credential-verified. Our no-show protection system and automated matching ensure shifts get filled and stay filled.",
  },
  {
    icon: <Zap size={24} className="text-cyan-600" />,
    title: "Speed",
    description:
      "Most shifts are filled within 30 minutes. Urgent shifts trigger instant notifications to qualified workers in the area so coverage is never left to chance.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="pt-28 pb-16 px-4 text-center">
          <span className="inline-block text-sm font-semibold text-cyan-600 uppercase tracking-wider mb-3">
            About Us
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 max-w-3xl mx-auto">
            Our Mission
          </h1>
          <p className="text-slate-500 text-lg sm:text-xl max-w-2xl mx-auto mt-5 leading-relaxed">
            We believe healthcare workers deserve better. Better schedules.
            Better pay. Better technology.
          </p>
        </section>

        {/* Story */}
        <section className="pb-16 px-4">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 sm:p-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Our Story
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Founded in 2026, ShiftCare was built to solve a simple problem:
              filling open healthcare shifts shouldn&apos;t take days. Our
              platform connects verified healthcare professionals with agencies
              and families who need care — in hours, not weeks.
            </p>
            <p className="text-slate-600 leading-relaxed">
              We saw agencies spending hours on the phone trying to find
              coverage, and qualified nurses and aides sitting at home waiting
              for work. ShiftCare brings both sides together with technology
              that&apos;s fast, transparent, and built specifically for
              healthcare.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="pb-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-10">
              What We Stand For
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {VALUES.map((value) => (
                <div
                  key={value.title}
                  className="bg-white rounded-2xl border border-slate-200 p-8 text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center mx-auto mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="pb-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Where We Operate
            </h2>
            <p className="text-slate-500 leading-relaxed">
              Based in Florida, serving South Florida &mdash; Fort Lauderdale, Miami,
              and West Palm Beach &mdash; with Tampa and Orlando expansion coming
              Q4 2026.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-20 px-4">
          <div className="max-w-3xl mx-auto bg-cyan-50 border border-cyan-200 rounded-2xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Join Us
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-lg mx-auto">
              Whether you&apos;re a healthcare professional looking for flexible
              work or an employer who needs reliable coverage, ShiftCare is
              built for you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup?role=WORKER"
                className="inline-flex items-center gap-2 bg-cyan-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-cyan-700 transition-colors text-sm shadow-lg shadow-cyan-600/25"
              >
                Sign Up as a Worker
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/signup?role=PROVIDER"
                className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold px-6 py-3 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors text-sm"
              >
                Sign Up as an Employer
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
