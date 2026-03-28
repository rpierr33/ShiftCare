"use client";

const FAQ_ITEMS = [
  {
    question: "How does worker credentialing work?",
    answer:
      "Workers submit their license and certifications during signup. We verify credentials within 14 days, granting provisional shift access immediately. Expired credentials are automatically flagged and workers are notified 60, 30, 14, and 7 days before expiry.",
  },
  {
    question: "What happens if a worker no-shows?",
    answer:
      "Our 3-strike system protects employers. After 1 no-show, the worker sees 25% fewer shifts. After 2, 50% fewer. After 3, their account is suspended. We automatically detect no-shows 30 minutes after shift start and reopen the shift for other workers.",
  },
  {
    question: "How quickly can I fill a shift?",
    answer:
      "Most shifts are filled within 30 minutes. Urgent shifts (starting within 24 hours) are prioritized in our matching algorithm and sent as push notifications to qualified workers in your area.",
  },
  {
    question: "Is there a contract or commitment?",
    answer:
      "No contracts, no commitments. Cancel your subscription anytime. The free plan never expires \u2014 upgrade only when you need more capacity.",
  },
  {
    question: "How do workers get paid?",
    answer:
      "Workers can choose Same Day Pay (paid within hours of shift completion) or Standard Pay (released 4 hours after employer confirms). All fees are transparent \u2014 workers see their exact take-home before accepting.",
  },
  {
    question: "Is ShiftCare available outside of Florida?",
    answer:
      "We\u2019re currently launching in Florida with plans to expand to Georgia, Texas, and California in 2026. Join our waitlist to be notified when we\u2019re available in your state.",
  },
];

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
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
