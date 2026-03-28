"use client";

import { useState } from "react";

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
      "Workers submit their license and certifications during signup. We verify credentials within 14 days, granting provisional shift access immediately. Expired credentials are automatically flagged and workers are notified 60, 30, 14, and 7 days before expiry.",
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
      "We\u2019re currently launching in Florida with plans to expand to Georgia, Texas, and California in 2026. Join our waitlist to be notified when we\u2019re available in your state.",
    key: "expansion",
  },
];

function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedState, setSubmittedState] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !state) return;

    // Store in localStorage for now; hook up to mailing list later
    const existing = JSON.parse(localStorage.getItem("shiftcare-waitlist") || "[]");
    existing.push({ email, state, date: new Date().toISOString() });
    localStorage.setItem("shiftcare-waitlist", JSON.stringify(existing));

    setSubmittedState(state);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
        We&apos;ll notify you when ShiftCare launches in {submittedState}!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="flex-1 min-w-0 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
      />
      <select
        value={state}
        onChange={(e) => setState(e.target.value)}
        required
        className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
      >
        <option value="">Select state</option>
        {US_STATES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="px-4 py-2 text-sm font-semibold bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors whitespace-nowrap"
      >
        Notify Me
      </button>
    </form>
  );
}

export function FAQSection() {
  return (
    <section className="py-20 sm:py-28 px-4 bg-white">
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
                {item.key === "expansion" && <WaitlistForm />}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
