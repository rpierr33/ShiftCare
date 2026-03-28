"use client";

import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

const US_STATES = [
  "Georgia",
  "Texas",
  "California",
  "New York",
  "Illinois",
  "Pennsylvania",
  "Ohio",
  "North Carolina",
  "Michigan",
  "New Jersey",
  "Virginia",
  "Washington",
  "Arizona",
  "Massachusetts",
  "Tennessee",
  "Indiana",
  "Maryland",
  "Colorado",
];

const FAQ_ITEMS = [
  {
    question: "How does worker credentialing work?",
    answer:
      "Workers submit their license and certifications during signup. We verify credentials typically within 7-14 business days, granting provisional shift access immediately. Expired credentials are automatically flagged and workers are notified 60, 30, 14, and 7 days before expiry.",
    key: "credentialing",
  },
  {
    question: "What happens if a worker no-shows?",
    answer:
      "Our 3-strike system protects employers. After 1 no-show, the worker sees 25% fewer shifts. After 2, 50% fewer. After 3, their account is suspended. We automatically detect no-shows 30 minutes after shift start and reopen the shift for other workers.",
    key: "no-show",
  },
  {
    question: "How quickly can I fill a shift?",
    answer:
      "Most shifts are filled within 30 minutes. Urgent shifts (starting within 24 hours) are prioritized in our matching algorithm and sent as push notifications to qualified workers in your area.",
    key: "fill-time",
  },
  {
    question: "Is there a contract or commitment?",
    answer:
      "No contracts, no commitments. Cancel your subscription anytime. The free plan never expires \u2014 upgrade only when you need more capacity.",
    key: "contract",
  },
  {
    question: "How do workers get paid?",
    answer:
      "Workers can choose Same Day Pay (paid within hours of shift completion) or Standard Pay (released 4 hours after employer confirms). All fees are transparent \u2014 workers see their exact take-home before accepting.",
    key: "pay",
  },
  {
    question: "Is ShiftCare available outside of Florida?",
    answer:
      "We\u2019re currently serving South Florida \u2014 Fort Lauderdale, Miami, and West Palm Beach areas. We\u2019re expanding to Tampa and Orlando in Q4 2026, with Georgia, Texas, and California planned for 2027.",
    key: "expansion",
  },
];

/* Waitlist signup form — stores entries in localStorage as placeholder for future API.
   Supports inline (inside FAQ answer) and standalone (full section) variants. */
function WaitlistForm({ variant = "inline" }: { variant?: "inline" | "standalone" }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedState, setSubmittedState] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; state?: string }>({});

  function validate(): boolean {
    const newErrors: { email?: string; state?: string } = {};
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!state) {
      newErrors.state = "Please select a state";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    // Store in localStorage for now; hook up to mailing list later
    try {
      const existing = JSON.parse(localStorage.getItem("shiftcare-waitlist") || "[]");
      existing.push({ email, state, date: new Date().toISOString() });
      localStorage.setItem("shiftcare-waitlist", JSON.stringify(existing));
    } catch {
      // silently continue
    }

    // Simulate brief network delay
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setSubmittedState(state);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className={`bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 ${variant === "inline" ? "mt-4" : ""}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">You&apos;re on the list!</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              We&apos;ll notify you when ShiftCare launches in {submittedState}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`${variant === "inline" ? "mt-4" : ""} space-y-2`}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2">
        <div className="flex-1 min-w-0">
          <input
            type="email"
            name="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }}
            className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${errors.email ? "border-red-300" : "border-slate-200"}`}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>
        <div>
          <select
            name="state"
            value={state}
            onChange={(e) => { setState(e.target.value); setErrors((prev) => ({ ...prev, state: undefined })); }}
            className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${errors.state ? "border-red-300" : "border-slate-200"}`}
          >
            <option value="">Select state</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-semibold bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Joining...
            </>
          ) : (
            "Notify Me"
          )}
        </button>
      </div>
    </form>
  );
}

/* Accordion-style FAQ section using native <details> elements. The expansion FAQ
   item includes an inline WaitlistForm for state expansion notifications. */
export function FAQSection() {
  return (
    <section id="faq" className="py-20 sm:py-28 px-4 bg-white scroll-mt-20">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block text-sm font-semibold text-cyan-600 uppercase tracking-wider mb-3">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-500 text-lg mt-4 max-w-xl mx-auto leading-relaxed">
            Everything you need to know about ShiftCare.
          </p>
        </div>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group rounded-xl border border-slate-200 bg-slate-50 overflow-hidden transition-all hover:border-cyan-200"
            >
              <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-left list-none [&::-webkit-details-marker]:hidden">
                <span className="font-semibold text-slate-900 text-base pr-4">
                  {item.question}
                </span>
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 group-open:bg-cyan-600 flex items-center justify-center transition-colors">
                  <svg
                    className="w-3.5 h-3.5 text-slate-500 group-open:text-white transition-transform group-open:rotate-45"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </summary>
              <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed">
                {item.answer}
                {item.key === "expansion" && <WaitlistForm variant="inline" />}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Standalone waitlist section shown below FAQ for out-of-state users */
export function WaitlistSection() {
  return (
    <section className="py-16 sm:py-20 px-4 bg-slate-50 border-t border-slate-200">
      <div className="max-w-xl mx-auto text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
            <MapPin size={22} className="text-cyan-600" />
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Not in Florida yet?
        </h2>
        <p className="text-slate-500 text-base mt-3 mb-8 max-w-md mx-auto leading-relaxed">
          We&apos;re expanding to new states soon. Join the waitlist and be the first to know when ShiftCare launches near you.
        </p>
        <WaitlistForm variant="standalone" />
      </div>
    </section>
  );
}
