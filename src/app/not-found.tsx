import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          {/* Branding */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">ShiftCare</span>
          </div>

          {/* 404 Badge */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
            <span className="text-3xl font-bold text-gray-400">404</span>
          </div>

          {/* Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Page not found
          </h1>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            The page you are looking for does not exist or has been moved.
            Check the URL or head back to the dashboard.
          </p>

          {/* Action */}
          <Link href="/" className="w-full">
            <Button className="w-full">
              <ArrowLeft className="h-4 w-4" />
              Go back home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
