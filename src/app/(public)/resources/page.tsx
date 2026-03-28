import Link from "next/link";
import { ArrowRight, BookOpen, Building2, Users, Activity } from "lucide-react";
import { PublicNav } from "@/components/shared/public-nav";
import { PublicFooter } from "@/components/shared/public-footer";

type Category = "Employers" | "Workers" | "Industry";

const CATEGORY_STYLES: Record<Category, string> = {
  Employers: "text-cyan-600 bg-cyan-50 border-cyan-200",
  Workers: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Industry: "text-violet-600 bg-violet-50 border-violet-200",
};

const ARTICLES: {
  title: string;
  excerpt: string;
  category: Category;
}[] = [
  {
    title: "How to Fill Nursing Shifts Fast",
    excerpt:
      "Practical strategies for healthcare agencies to reduce time-to-fill and keep shifts covered, even during peak demand periods.",
    category: "Employers",
  },
  {
    title: "CNA Shift Jobs in Tampa: What to Expect",
    excerpt:
      "A complete guide for CNAs looking for flexible shift work in the Tampa Bay area -- pay rates, facility types, and how to get started.",
    category: "Workers",
  },
  {
    title: "Healthcare Staffing Agency vs. Direct Hire",
    excerpt:
      "Comparing the pros and cons of traditional staffing agencies against direct-hire platforms for healthcare facilities.",
    category: "Industry",
  },
  {
    title: "Same-Day Pay for Healthcare Workers: How It Works",
    excerpt:
      "Everything you need to know about instant pay after shifts -- how it works on ShiftCare, fees involved, and why it matters.",
    category: "Workers",
  },
  {
    title: "Starting a Home Health Agency in Florida",
    excerpt:
      "A step-by-step guide for entrepreneurs looking to start a home health agency in Florida -- licensing, staffing, and technology.",
    category: "Employers",
  },
];

/* Resources hub page — static article previews categorized by Employers/Workers/Industry.
   Full articles are coming soon; currently serves as SEO-friendly content placeholder. */
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

      {/* Articles Grid */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-6">
            {ARTICLES.map((article) => (
              <div
                key={article.title}
                className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 hover:shadow-lg hover:border-slate-200 transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <span
                      className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border mb-3 ${
                        CATEGORY_STYLES[article.category]
                      }`}
                    >
                      {article.category}
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
                      {article.title}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed mt-2">
                      {article.excerpt}
                    </p>
                  </div>
                  <div className="flex-shrink-0 sm:self-center">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-600 group-hover:gap-2.5 transition-all">
                      Read More
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Coming soon note */}
          <div className="mt-10 text-center bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <Activity size={20} className="text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              Full articles coming soon
            </p>
            <p className="text-xs text-slate-400 mt-1">
              We are building out in-depth guides for each topic. Check back
              soon or sign up to get notified.
            </p>
          </div>
        </div>
      </section>

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
