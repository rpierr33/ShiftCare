import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { PublicNav } from "@/components/shared/public-nav";
import { PublicFooter } from "@/components/shared/public-footer";
import { ResourceList } from "./resource-list";

export const metadata: Metadata = {
  title: "Healthcare Staffing Resources & Guides | ShiftCare",
  description: "Expert guides on healthcare staffing, shift management, and Florida healthcare regulations. Resources for agencies, workers, and families.",
  alternates: { canonical: "/resources" },
};

export default function ResourcesPage() {
  return (
    <>
      <PublicNav currentPage="resources" />

      {/* Hero */}
      <section className="pt-28 pb-12 sm:pt-36 sm:pb-16 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen size={20} className="text-cyan-600" />
            <span className="text-sm font-semibold text-cyan-600 uppercase tracking-wider">
              Learn & Grow
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
            Resources & Guides
          </h1>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Insights for healthcare agencies, workers, and industry
            professionals. Practical advice to help you staff smarter and earn
            more.
          </p>
        </div>
      </section>

      <ResourceList />

      {/* CTA */}
      <section className="py-16 px-4 bg-slate-50 border-t border-slate-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900">
            Ready to Get Started?
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            Whether you need staff or want to pick up shifts, ShiftCare makes it
            easy.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup?role=PROVIDER"
              className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-6 py-3 rounded-xl text-sm shadow-lg shadow-cyan-600/20 transition-all"
            >
              I Need Staff
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/signup?role=WORKER"
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold px-6 py-3 rounded-xl text-sm border border-slate-200 transition-all"
            >
              I Want to Work
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  );
}
