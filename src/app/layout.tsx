import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/providers/session-provider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "ShiftCare — Fill Shifts Fast",
  description:
    "Healthcare shift fulfillment platform. Connect with verified, background-checked professionals to fill open shifts in hours, not days.",
};

export const viewport: Viewport = {
  themeColor: "#0891B2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.className} antialiased bg-slate-50 text-slate-900`}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
