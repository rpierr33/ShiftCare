import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password | ShiftCare",
  description: "Reset your ShiftCare account password.",
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
