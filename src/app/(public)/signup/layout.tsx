import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | ShiftCare",
  description:
    "Join ShiftCare — healthcare shift fulfillment for employers, families, and workers. Free to start, no contracts.",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
