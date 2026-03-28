import type { Metadata } from "next";
import { PublicNav } from "@/components/shared/public-nav";
import { PublicFooter } from "@/components/shared/public-footer";
import { FAQSection } from "@/components/shared/faq-section";
import { PricingContent } from "./pricing-content";

export const metadata: Metadata = {
  title: "Pricing | ShiftCare",
  description: "Simple pricing for healthcare shift fulfillment. Workers always free.",
  alternates: { canonical: "/pricing" },
};

/* Server-rendered pricing page wrapper with nav, interactive pricing content, FAQ, and footer */
export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicNav currentPage="pricing" />
      <PricingContent />
      <FAQSection />
      <PublicFooter />
    </div>
  );
}
