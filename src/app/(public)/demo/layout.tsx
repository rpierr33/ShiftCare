import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Demo | ShiftCare",
  description: "See how ShiftCare can transform your healthcare staffing. Book a demo for agencies with 10+ workers.",
  alternates: { canonical: "/demo" },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
