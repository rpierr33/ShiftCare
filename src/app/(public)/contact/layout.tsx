import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | ShiftCare",
  description: "Get in touch with the ShiftCare team. We respond within 24 hours on business days.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
