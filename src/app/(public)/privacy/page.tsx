import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | ShiftCare",
  description: "ShiftCare Privacy Policy — How we collect, use, and protect your data.",
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500">
            Last updated: March 26, 2026
          </p>
        </div>

        <div className="prose prose-slate max-w-none space-y-10">
          {/* 1. Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </span>
              Information We Collect
            </h2>
            <div className="pl-9 space-y-3 text-slate-600 leading-relaxed">
              <p>We collect the following categories of information:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Account Information:</strong> Name, email address, phone
                  number, password, and role selection (Employer or Worker).
                </li>
                <li>
                  <strong>Professional Credentials:</strong> License numbers,
                  issuing state, license type, certifications, expiration dates,
                  and supporting documentation.
                </li>
                <li>
                  <strong>Business Information:</strong> Company name, NPI number,
                  EIN, AHCA license number, employer type, address, and contact
                  person details (for Employers).
                </li>
                <li>
                  <strong>Payment Information:</strong> Payment details are
                  processed via Stripe. ShiftCare does not store credit card
                  numbers, bank account numbers, or other sensitive financial
                  data on its servers.
                </li>
                <li>
                  <strong>Usage Data:</strong> Shifts posted, shifts accepted,
                  platform interactions, reliability metrics, and earnings data.
                </li>
                <li>
                  <strong>Device &amp; Technical Data:</strong> IP address, browser
                  type, device type, operating system, and geolocation data (when
                  you enable clock-in features).
                </li>
              </ul>
            </div>
          </section>

          {/* 2. How We Use It */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </span>
              How We Use Your Information
            </h2>
            <div className="pl-9 space-y-3 text-slate-600 leading-relaxed">
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Operate the Platform:</strong> Create and manage
                  accounts, facilitate shift posting and acceptance, and manage
                  user profiles.
                </li>
                <li>
                  <strong>Match Workers with Shifts:</strong> Use role,
                  credentials, availability, and location data to surface relevant
                  shift opportunities.
                </li>
                <li>
                  <strong>Process Payments:</strong> Facilitate escrow, payouts,
                  refunds, and subscription billing through Stripe.
                </li>
                <li>
                  <strong>Send Notifications:</strong> Deliver shift
                  confirmations, payment updates, credential status changes, and
                  platform communications.
                </li>
                <li>
                  <strong>Verify Credentials:</strong> Validate professional
                  licenses and certifications to maintain platform trust and
                  safety.
                </li>
                <li>
                  <strong>Prevent Fraud:</strong> Detect and prevent fraudulent
                  activity, abuse, and unauthorized access to the platform.
                </li>
                <li>
                  <strong>Legal Compliance:</strong> Meet regulatory, tax, and
                  legal reporting obligations.
                </li>
              </ul>
            </div>
          </section>

          {/* 3. Information Sharing */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </span>
              Information Sharing
            </h2>
            <div className="pl-9 space-y-3 text-slate-600 leading-relaxed">
              <p>We share information only in the following circumstances:</p>
              <ul className="list-disc pl-5 space-y-3">
                <li>
                  <strong>With Employers (on shift assignment):</strong> Worker
                  name, professional role, credential verification status, and
                  reliability score.
                </li>
                <li>
                  <strong>With Workers (on shift assignment):</strong> Employer name,
                  shift location, and contact information.
                </li>
                <li>
                  <strong>With Stripe:</strong> Payment information necessary to
                  process transactions, escrow, and payouts.
                </li>
                <li>
                  <strong>With Credential Verification Services:</strong>{" "}
                  Information necessary to verify professional licenses and
                  certifications.
                </li>
              </ul>
              <p className="mt-4 p-4 bg-cyan-50 rounded-xl border border-cyan-100 font-medium text-cyan-800">
                We do not sell personal data to third parties. We do not share
                your information with advertisers or data brokers.
              </p>
            </div>
          </section>

          {/* 4. Data Security */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                4
              </span>
              Data Security
            </h2>
            <div className="pl-9 space-y-3 text-slate-600 leading-relaxed">
              <p>
                We implement industry-standard security measures to protect your
                data:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>TLS Encryption:</strong> All data transmitted between
                  your device and our servers is encrypted in transit using TLS
                  (Transport Layer Security).
                </li>
                <li>
                  <strong>Encrypted Storage:</strong> Sensitive data is encrypted
                  at rest in our databases.
                </li>
                <li>
                  <strong>Credential Documents:</strong> Uploaded credential
                  documents are stored in access-controlled, encrypted cloud
                  storage with strict access policies.
                </li>
                <li>
                  <strong>Payment Data:</strong> All payment and financial data is
                  handled exclusively by Stripe, a PCI-DSS Level 1 certified
                  payment processor. ShiftCare never stores card numbers or bank
                  account details.
                </li>
              </ul>
            </div>
          </section>

          {/* 5. Data Retention */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                5
              </span>
              Data Retention
            </h2>
            <div className="pl-9 space-y-3 text-slate-600 leading-relaxed">
              <p>
                We retain your personal data for the duration of your active
                account plus <strong>7 years</strong> following account closure.
                This retention period is necessary to meet legal, tax, and
                regulatory obligations applicable to healthcare staffing
                transactions.
              </p>
              <p>
                Deletion requests are honoured subject to applicable data
                retention requirements. Where legal obligations require us to
                retain certain data, we will inform you of the specific data
                retained and the legal basis.
              </p>
            </div>
          </section>

          {/* 6. Your Rights */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                6
              </span>
              Your Rights
            </h2>
            <div className="pl-9 space-y-3 text-slate-600 leading-relaxed">
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Access</strong> the personal data we hold about you
                </li>
                <li>
                  <strong>Correct</strong> inaccurate or incomplete personal data
                </li>
                <li>
                  <strong>Delete</strong> your personal data (subject to retention
                  requirements)
                </li>
                <li>
                  <strong>Opt out</strong> of non-essential communications
                </li>
              </ul>
              <p>
                To exercise any of these rights, contact us at{" "}
                <a
                  href="mailto:privacy@shiftcare.com"
                  className="text-cyan-600 hover:text-cyan-700 font-medium underline"
                >
                  privacy@shiftcare.com
                </a>
                . We will respond to your request within 30 days.
              </p>
            </div>
          </section>

          {/* 7. Cookies */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                7
              </span>
              Cookies
            </h2>
            <div className="pl-9 space-y-3 text-slate-600 leading-relaxed">
              <p>
                ShiftCare uses <strong>essential cookies only</strong> for
                authentication and session management. These cookies are strictly
                necessary for the platform to function and cannot be disabled.
              </p>
              <p>
                We do <strong>not</strong> use advertising cookies, tracking
                cookies, or any third-party analytics cookies that track your
                activity across other websites.
              </p>
            </div>
          </section>

          {/* 8. Contact */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                8
              </span>
              Contact
            </h2>
            <div className="pl-9 space-y-3 text-slate-600 leading-relaxed">
              <p>
                For questions or concerns regarding this Privacy Policy or our
                data practices, please contact us at:
              </p>
              <p>
                <a
                  href="mailto:privacy@shiftcare.com"
                  className="text-cyan-600 hover:text-cyan-700 font-medium underline"
                >
                  privacy@shiftcare.com
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-slate-200 flex flex-wrap gap-6 text-sm text-slate-500">
          <Link
            href="/terms"
            className="hover:text-cyan-600 transition-colors"
          >
            Terms of Service
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
