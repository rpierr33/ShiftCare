import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | ShiftCare",
  description:
    "Sign in to your ShiftCare account to manage shifts, view earnings, and connect with healthcare professionals.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
