"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Mail, Phone, HelpCircle, Send, CheckCircle, Copy } from "lucide-react";
import { usePathname } from "next/navigation";

/* Floating help button (bottom-right) with expandable panel: FAQ link, email/phone
   contact, and a question input form. Closes on outside click. */
export function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [sent, setSent] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleSendQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setSent(true);
    setQuestion("");
    setTimeout(() => setSent(false), 4000);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50" ref={panelRef}>
      {/* Expanded panel */}
      {open && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="bg-cyan-600 px-5 py-4 flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">Need Help?</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick links */}
          <div className="p-4 space-y-2">
            <button
              onClick={() => {
                setOpen(false);
                if (pathname === "/") {
                  document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
                } else {
                  window.location.href = "/#faq";
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group text-left"
            >
              <HelpCircle
                size={18}
                className="text-slate-400 group-hover:text-cyan-600 transition-colors"
              />
              <span className="text-sm text-slate-700 font-medium">FAQ</span>
            </button>

            {/* Email Us */}
            <div>
              <button
                onClick={() => {
                  setShowEmail(!showEmail);
                  setShowPhone(false);
                  setEmailCopied(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group text-left"
              >
                <Mail
                  size={18}
                  className="text-slate-400 group-hover:text-cyan-600 transition-colors"
                />
                <span className="text-sm text-slate-700 font-medium">
                  Email Us
                </span>
              </button>
              {showEmail && (
                <div className="flex items-center gap-2 px-3 py-2 ml-9 bg-slate-50 rounded-lg mt-1">
                  <span className="text-sm text-slate-700 font-mono">support@shiftcare.com</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("support@shiftcare.com");
                      setEmailCopied(true);
                      setTimeout(() => setEmailCopied(false), 2000);
                    }}
                    className="ml-auto text-slate-400 hover:text-cyan-600 transition-colors p-1"
                    title="Copy email"
                  >
                    {emailCopied ? (
                      <CheckCircle size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Call Us */}
            <div>
              <button
                onClick={() => {
                  setShowPhone(!showPhone);
                  setShowEmail(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group text-left"
              >
                <Phone
                  size={18}
                  className="text-slate-400 group-hover:text-cyan-600 transition-colors"
                />
                <span className="text-sm text-slate-700 font-medium">
                  Call Us
                </span>
              </button>
              {showPhone && (
                <div className="flex items-center gap-2 px-3 py-2 ml-9 bg-slate-50 rounded-lg mt-1">
                  <span className="text-sm text-slate-700 font-mono">(800) 555-0199</span>
                  <a
                    href="tel:+18005550199"
                    className="ml-auto text-cyan-600 hover:text-cyan-700 text-xs font-semibold transition-colors"
                  >
                    Call
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Question input */}
          <div className="p-4">
            {sent ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                <p className="text-sm font-semibold text-emerald-700">Thanks for your message!</p>
                <p className="text-xs text-emerald-600 mt-1">We&apos;ll respond within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSendQuestion} className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="bg-cyan-600 text-white p-2 rounded-lg hover:bg-cyan-700 transition-colors shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Get help"
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 ${
          open
            ? "bg-slate-700 hover:bg-slate-800"
            : "bg-cyan-600 hover:bg-cyan-700 shadow-cyan-600/30"
        }`}
      >
        {open ? (
          <X size={22} className="text-white" />
        ) : (
          <MessageCircle size={22} className="text-white" />
        )}
      </button>
    </div>
  );
}
