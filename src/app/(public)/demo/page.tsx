"use client";

import { useState } from "react";
import { PublicNav } from "@/components/shared/public-nav";
import { PublicFooter } from "@/components/shared/public-footer";
import { ArrowRight, CheckCircle } from "lucide-react";

const WORKER_RANGES = ["1-10", "10-50", "50-100", "100+"];

/* Demo request page — form collects name, email, company, phone, worker count, and message.
   Stores submissions in localStorage as a placeholder for future API integration. */
export default function DemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    workerCount: "",
    message: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Store in localStorage as a placeholder for future API integration
    try {
      const existing = JSON.parse(localStorage.getItem("demo_requests") || "[]");
      existing.push({ ...form, submittedAt: new Date().toISOString() });
      localStorage.setItem("demo_requests", JSON.stringify(existing));
    } catch {
      // silently continue
    }

    // Simulate brief network delay
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicNav />

      <main className="flex-1 pt-28 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Book a Demo with Our Team
            </h1>
            <p className="text-slate-500 text-lg mt-4 max-w-xl mx-auto leading-relaxed">
              See how ShiftCare can transform your staffing operations. Perfect
              for agencies with 10+ workers.
            </p>
          </div>

          {submitted ? (
            <div className="bg-white rounded-2xl border border-emerald-200 p-10 text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle size={48} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Thanks! We&apos;ll be in touch within 24 hours.
              </h2>
              <p className="text-slate-500 text-sm">
                A member of our team will reach out to schedule your personalized
                demo.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 space-y-6"
            >
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-slate-700 mb-1.5"
                  >
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-slate-700 mb-1.5"
                  >
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="company"
                    className="block text-sm font-semibold text-slate-700 mb-1.5"
                  >
                    Company Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    required
                    value={form.company}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Your agency or facility"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold text-slate-700 mb-1.5"
                  >
                    Phone <span className="text-slate-400">(optional)</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="workerCount"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Number of Workers <span className="text-red-400">*</span>
                </label>
                <select
                  id="workerCount"
                  name="workerCount"
                  required
                  value={form.workerCount}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
                >
                  <option value="">Select range...</option>
                  {WORKER_RANGES.map((r) => (
                    <option key={r} value={r}>
                      {r} workers
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Message <span className="text-slate-400">(optional)</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                  placeholder="Tell us about your staffing needs..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-cyan-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-cyan-700 transition-all text-sm shadow-lg shadow-cyan-600/25 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Submitting..." : "Request Demo"}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          )}

          {/* Booking Calendar */}
          <div className="mt-12">
            <h2 className="text-xl font-bold text-slate-900 mb-4 text-center">Or Schedule a Call</h2>
            {process.env.NEXT_PUBLIC_CALENDLY_URL ? (
              <iframe
                src={process.env.NEXT_PUBLIC_CALENDLY_URL}
                width="100%"
                height="600"
                frameBorder="0"
                title="Schedule a call"
                className="rounded-2xl border border-slate-200"
              />
            ) : (
              <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                <p className="text-slate-500 text-sm">Calendar booking coming soon.</p>
                <p className="text-slate-400 text-xs mt-2">In the meantime, fill out the form above and we&apos;ll reach out within 24 hours.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
