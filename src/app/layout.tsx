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
  metadataBase: new URL("https://shiftcare-app-rho.vercel.app"),
  alternates: {
    canonical: "/",
  },
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
        {/* Google Analytics 4 */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`} />
            <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');` }} />
          </>
        )}
        {/* Microsoft Clarity */}
        {process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID && (
          <script dangerouslySetInnerHTML={{ __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID}");` }} />
        )}
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
