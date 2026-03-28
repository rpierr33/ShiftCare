"use client";

import { useState } from "react";
import { Mail, Clock, Send, CheckCircle } from "lucide-react";
import { PublicNav } from "@/components/shared/public-nav";
import { PublicFooter } from "@/components/shared/public-footer";

const SUBJECTS = ["General", "Support", "Billing", "Partnership"] as const;

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "General" as string,
    message: "",
  });

  // Derive field-level errors from touched state
  const fieldErrors: Record<string, string> = {};
  if (touched.name && !form.name.trim()) fieldErrors.name = "Name is required";
  if (touched.email && !form.email.trim()) fieldErrors.email = "Email is required";
  if (touched.email && form.email.trim() && !form.email.includes("@")) fieldErrors.email = "Valid email is required";
  if (touched.message && !form.message.trim()) fieldErrors.message = "Message is required";

  const isFormValid = form.name.trim() && form.email.includes("@") && form.message.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Mark all fields as touched to show errors on submit attempt
    if (!isFormValid) {
      setTouched({ name: true, email: true, message: true });
      return;
    }

    setLoading(true);

    // Store to localStorage
    const existing = JSON.parse(localStorage.getItem("shiftcare_contacts") || "[]");
    existing.push({ ...form, submittedAt: new Date().toISOString() });
    localStorage.setItem("shiftcare_contacts", JSON.stringify(existing));

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 500);
  }

  const handleBlur = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  return (
    <>
      <PublicNav />

      <section className="pt-28 pb-12 sm:pt-36 sm:pb-16 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
            Get in Touch
          </h1>
          <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            Have a question or need help? We are here for you.
          </p>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 mb-12">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-cyan-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Email Us</p>
                <a
                  href="mailto:support@shiftcare.com"
                  className="text-sm text-cyan-600 hover:underline"
                >
                  support@shiftcare.com
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center flex-shrink-0">
                <Clock size={18} className="text-cyan-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Response Time</p>
                <p className="text-sm text-slate-500">
                  We respond within 24 hours on business days.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center flex-shrink-0">
                <Send size={18} className="text-cyan-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Quick Support</p>
                <p className="text-sm text-slate-500">
                  Use the form below for the fastest response.
                </p>
              </div>
            </div>
          </div>

          {submitted ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Message Sent
              </h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Thank you for reaching out. We will get back to you within 24 hours on business days.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5"
            >
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    onBlur={() => handleBlur("name")}
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-colors ${fieldErrors.name ? "border-red-300" : "border-slate-200"}`}
                    placeholder="Your name"
                  />
                  {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    onBlur={() => handleBlur("email")}
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-colors ${fieldErrors.email ? "border-red-300" : "border-slate-200"}`}
                    placeholder="you@example.com"
                  />
                  {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Subject
                </label>
                <select
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-colors bg-white"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  onBlur={() => handleBlur("message")}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-colors resize-none ${fieldErrors.message ? "border-red-300" : "border-slate-200"}`}
                  placeholder="How can we help?"
                />
                {fieldErrors.message && <p className="text-xs text-red-500 mt-1">{fieldErrors.message}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-8 py-3 rounded-xl text-sm shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </section>

      <PublicFooter />
    </>
  );
}
