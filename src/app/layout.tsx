import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/providers/session-provider";
import { PWAInstallPrompt } from "@/components/shared/pwa-install-prompt";
import { HelpWidget } from "@/components/shared/help-widget";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "ShiftCare — Fill Shifts Fast",
  description:
    "Healthcare shift fulfillment platform. Connect with verified, background-checked professionals to fill open shifts in hours, not days.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ShiftCare",
  },
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    title: "ShiftCare — Fill Healthcare Shifts Fast",
    description: "Healthcare shift fulfillment platform. Connect with verified professionals to fill open shifts in hours, not days.",
    url: "https://shiftcare-app-rho.vercel.app",
    siteName: "ShiftCare",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShiftCare — Fill Healthcare Shifts Fast",
    description: "Healthcare shift fulfillment platform. Fill open shifts in hours, not days.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0891B2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

/* Root layout — wraps all pages with session provider, help widget, PWA prompt,
   and service worker registration (production) / unregistration (dev) */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${dmSans.className} antialiased bg-slate-50 text-slate-900`}
      >
        <SessionProvider>{children}</SessionProvider>
        <HelpWidget />
        <PWAInstallPrompt />
        <script
          dangerouslySetInnerHTML={{
            __html: process.env.NODE_ENV === "production"
              ? `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }`
              : `if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (var r of registrations) { r.unregister(); }
                  });
                }`,
          }}
        />
      </body>
    </html>
  );
}
