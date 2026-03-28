"use client";

import { useState, useEffect } from "react";
import { X, Smartphone, Bell, Zap } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show on mobile-width screens
    if (typeof window === "undefined") return;
    if (window.innerWidth > 768) return;

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISS_DURATION_MS) return;
    }

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    setDeferredPrompt(null);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted" || choice.outcome === "dismissed") {
      dismiss();
    }
  }

  if (!visible || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-600/30">
              <Smartphone size={22} />
            </div>
            <div>
              <p className="text-sm font-bold">Add ShiftCare to Home Screen</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Works like a native app — no app store needed
              </p>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="flex-shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors -mt-1 -mr-1"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex items-center gap-4 mb-4 pl-1">
          <div className="flex items-center gap-1.5">
            <Bell size={12} className="text-cyan-400" />
            <span className="text-[11px] text-slate-400">Push notifications for new shifts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-amber-400" />
            <span className="text-[11px] text-slate-400">Instant access</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            Install
          </button>
          <button
            onClick={dismiss}
            className="text-sm font-medium text-slate-500 hover:text-slate-300 px-4 py-2.5 transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
