"use client";

import { useEffect } from "react";
import { Shield, AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ShiftCare] Auth route error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          {/* Branding */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">ShiftCare</span>
          </div>

          {/* Error Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>

          {/* Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            We encountered an error loading this page. You can try again or
            head back to your dashboard.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Button>
            </Link>
          </div>

          {/* Error digest for support */}
          {error.digest && (
            <p className="mt-6 text-xs text-gray-400">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
