import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service | ShiftCare",
  description: "ShiftCare terms of service and usage agreement.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-xl font-bold text-cyan-600 hover:text-cyan-700 transition-colors"
          >
            ShiftCare
          </Link>
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-cyan-600 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Home
          </Link>
        </div>
      </header>
      <div className="h-0.5 bg-gradient-to-r from-cyan-500 to-emerald-500" />

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-500">
            Last updated: March 26, 2026
          </p>
        </div>

        <div className="prose prose-slate max-w-none space-y-10">
          {/* 1. Platform Description */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </span>
              Platform Description
            </h2>
            <div className="pl-9 space-y-3 text-slate-600 leading-relaxed">
              <p>
                ShiftCare is a technology marketplace that connects healthcare
                employers (&quot;Employers&quot;) and independent healthcare workers
                (&quot;Workers&quot;). ShiftCare is <strong>not</strong> a staffing
                agency, nurse registry, or employer of any kind.
              </p>
              <p>
                ShiftCare does not employ Workers and does not exercise control over
                the manner, method, or means by which Workers perform services.
                Users transact directly with one another; ShiftCare facilitates the
                connection between parties and manages payment processing on their
                behalf.
              </p>
              <p>
                By using the ShiftCare platform, you acknowledge and agree that
                ShiftCare serves solely as a technology intermediary and marketplace
                facilitator.
              </p>
            </div>
          </section>

          {/* 2. Eligibility */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </span>
              Eligibility
            </h2>
            <div className="pl-9 space-y-3 text-slate-600 leading-relaxed">
              <p>To use ShiftCare, you must meet the following requirements:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Employers</strong> must be legally registered businesses
                  in good standing within their jurisdiction of operation.
                </li>
                <li>
                  <strong>Workers</strong> must hold valid, current professional
                  credentials (licenses, certifications) appropriate for the
                  services they intend to provide.
                </li>
                <li>
                  All users must be at least <strong>18 years of age</strong>.
                </li>
              </ul>
              <p>
                ShiftCare reserves the right to request documentation to verify
                eligibility at any time. Failure to provide requested documentation
                may result in account suspension or termination.
              </p>
            </div>
          </section>

          {/* 3. Worker Independent Contractor Status */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </span>
              Worker Independent Contractor Status
            </h2>
            <div className="pl-9 space-y-3 text-slate-600 leading-relaxed">
              <p>
                Workers who use the ShiftCare platform are{" "}
                <strong>independent contractors</strong>, not employees of
                ShiftCare or any Employer using the platform.
              </p>
              <p>As independent contractors, Workers are solely responsible for:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  All federal, state, and local <strong>tax obligations</strong>,
                  including self-employment taxes
                </li>
                <li>
                  Obtaining and maintaining their own{" "}
                  <strong>health insurance, liability insurance</strong>, and any
                  other benefits
                </li>
                <li>
                  Maintaining all required <strong>professional licenses</strong>{" "}
                  and certifications in good standing
                </li>
                <li>
                  Compliance with all applicable{" "}
                  <strong>laws and regulations</strong> governing their professional
                  practice
                </li>
              </ul>
            </div>
          </section>

          {/* 4. Agency Responsibilities */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                4
              </span>
              Agency Responsibilities
            </h2>
            <div className="pl-9 space-y-3 text-slate-600 leading-relaxed">
              <p>
                Employers using ShiftCare are solely responsible for the following:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Maintaining full <strong>regulatory compliance</strong> with all
                  applicable healthcare staffing laws and regulations
                </li>
                <li>
                  Keeping accurate <strong>hiring and engagement records</strong>{" "}
                  as required by law
                </li>
                <li>
                  Ensuring all engagements with Workers comply with{" "}
                  <strong>federal, state, and local employment law</strong>
                </li>
                <li>
                  Independently verifying that Workers meet all{" "}
                  <strong>facility-specific standards</strong> and requirements
                  before engagement
                </li>
              </ul>
              <p>
                ShiftCare&apos;s credential verification features are provided as a{" "}
                <strong>platform courtesy only</strong> and are not a substitute
                for the Employer&apos;s own due diligence obligations. Employers may not
                rely solely on ShiftCare&apos;s verification status when making
                staffing decisions.
              </p>
            </div>
          </section>

          {/* 5. Payment Terms */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                5
              </span>
              Payment Terms
            </h2>
            <div className="pl-9 space-y-3 text-slate-600 leading-relaxed">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Employers are <strong>charged when a Worker accepts</strong> a
                  posted shift. Payment is processed via Stripe and held by
                  ShiftCare in escrow.
                </li>
                <li>
                  Funds are <strong>released to the Worker</strong> upon Employer
                  confirmation of shift completion.
                </li>
                <li>
                  ShiftCare charges a <strong>10% platform fee</strong> on all
                  shift transactions, deducted from the total shift amount before
                  Worker payout.
                </li>
                <li>
                  Subscription fees are <strong>non-refundable</strong> once the
                  billing period has commenced.
                </li>
                <li>
                  Disputed payments will be <strong>held pending review</strong>.
                  ShiftCare will make reasonable efforts to resolve disputes
                  promptly.
                </li>
              </ul>
            </div>
          </section>

          {/* 6. Cancellation Policy */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                6
              </span>
              Cancellation Policy
            </h2>
            <div className="pl-9 space-y-3 text-slate-600 leading-relaxed">
              <p>
                <strong>Worker Cancellations:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Workers may cancel an accepted shift{" "}
                  <strong>without penalty up to 4 hours</strong> before the
                  scheduled start time.
                </li>
                <li>
                  Late cancellations (less than 4 hours before start) will{" "}
                  <strong>negatively affect the Worker&apos;s reliability score</strong>{" "}
                  and may result in temporary or permanent account suspension.
                </li>
              </ul>
              <p>
                <strong>Employer Cancellations:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Employer cancellations of assigned shifts will trigger an{" "}
                  <strong>automatic full refund</strong> to the Employer.
                </li>
                <li>
                  Repeated or pattern cancellations by Employers may result in
                  account review and potential suspension.
                </li>
              </ul>
            </div>
          </section>

          {/* 7. Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                7
              </span>
              Limitation of Liability
            </h2>
            <div className="pl-9 space-y-3 text-slate-600 leading-relaxed">
              <p>
                ShiftCare is <strong>not liable</strong> for the professional
                performance, conduct, or actions of any Worker or Employer using the
                platform. This includes, but is not limited to, the quality of
                care provided, workplace injuries, professional misconduct, or any
                damages arising from engagements facilitated through the platform.
              </p>
              <p>
                To the maximum extent permitted by law, ShiftCare&apos;s total
                liability is <strong>limited to the platform fees paid</strong> by
                the user in the <strong>preceding 30 days</strong>.
              </p>
            </div>
          </section>

          {/* 8. Dispute Resolution */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                8
              </span>
              Dispute Resolution
            </h2>
            <div className="pl-9 space-y-3 text-slate-600 leading-relaxed">
              <p>
                ShiftCare may, at its sole discretion, mediate disputes between
                Employers and Workers. ShiftCare is under no obligation to mediate
                and may decline involvement in any dispute.
              </p>
              <p>
                When ShiftCare does mediate a payment dispute, its{" "}
                <strong>final payment decisions are binding</strong> on all
                parties. By using the platform, you agree to accept ShiftCare&apos;s
                determination in payment-related disputes.
              </p>
            </div>
          </section>

          {/* 9. Account Termination */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                9
              </span>
              Account Termination
            </h2>
            <div className="pl-9 space-y-3 text-slate-600 leading-relaxed">
              <p>
                ShiftCare may <strong>suspend or terminate</strong> any user
                account at its sole discretion for reasons including, but not
                limited to:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Violation of these Terms of Service</li>
                <li>Fraudulent activity or misrepresentation</li>
                <li>
                  Behavior deemed harmful to other users or the integrity of the
                  platform
                </li>
                <li>Repeated cancellations or pattern abuse</li>
                <li>Failure to maintain required credentials or licensure</li>
              </ul>
            </div>
          </section>

          {/* 10. Governing Law */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                10
              </span>
              Governing Law
            </h2>
            <div className="pl-9 space-y-3 text-slate-600 leading-relaxed">
              <p>
                These Terms of Service shall be governed by and construed in
                accordance with the laws of the{" "}
                <strong>State of Florida</strong>, without regard to its conflict
                of law provisions. Any legal action arising from or related to the
                use of the ShiftCare platform shall be brought exclusively in the
                courts of the State of Florida.
              </p>
            </div>
          </section>

          {/* 11. Contact */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                11
              </span>
              Contact
            </h2>
            <div className="pl-9 space-y-3 text-slate-600 leading-relaxed">
              <p>
                For questions or concerns regarding these Terms of Service, please
                contact us at:
              </p>
              <p>
                <a
                  href="mailto:legal@shiftcare.com"
                  className="text-cyan-600 hover:text-cyan-700 font-medium underline"
                >
                  legal@shiftcare.com
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-slate-200 flex flex-wrap gap-6 text-sm text-slate-500">
          <Link
            href="/privacy"
            className="hover:text-cyan-600 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link href="/" className="hover:text-cyan-600 transition-colors">
            Home
          </Link>
          <Link
            href="/pricing"
            className="hover:text-cyan-600 transition-colors"
          >
            Pricing
          </Link>
        </div>
      </main>
    </div>
  );
}
