import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Search } from "lucide-react";
import { PublicNav } from "@/components/shared/public-nav";
import { PublicFooter } from "@/components/shared/public-footer";

export const metadata: Metadata = {
  title: "Healthcare Staffing Resources & Guides | ShiftCare",
  description: "Expert guides on healthcare staffing, shift management, and Florida healthcare regulations. Resources for agencies, workers, and families.",
  alternates: { canonical: "/resources" },
};

type Category = "Employers" | "Workers" | "Industry";

const CATEGORIES: ("All" | Category)[] = ["All", "Employers", "Workers", "Industry"];

const CATEGORY_STYLES: Record<Category, string> = {
  Employers: "text-cyan-600 bg-cyan-50 border-cyan-200",
  Workers: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Industry: "text-violet-600 bg-violet-50 border-violet-200",
};

const CATEGORY_FILTER_STYLES: Record<string, string> = {
  All: "bg-slate-900 text-white",
  Employers: "bg-cyan-600 text-white",
  Workers: "bg-emerald-600 text-white",
  Industry: "bg-violet-600 text-white",
};

const ARTICLES: {
  title: string;
  excerpt: string;
  content: string[];
  category: Category;
}[] = [
  {
    title: "How to Fill Nursing Shifts Fast",
    excerpt:
      "Practical strategies for healthcare agencies to reduce time-to-fill and keep shifts covered, even during peak demand periods.",
    content: [
      "Unfilled shifts cost healthcare agencies an average of $300-$500 per vacancy day in lost revenue and overtime costs. The key to filling shifts fast is reducing friction in the hiring process and making your open positions visible to qualified workers immediately.",
      "Start by posting shifts with clear details: exact times, location, pay rate, and any special requirements. Workers are 3x more likely to accept shifts that include complete information upfront. Use platforms like ShiftCare that match shifts to credentialed workers in your area automatically.",
      "Consider offering competitive pay rates and same-day pay options. Our data shows that shifts offering same-day pay fill 40% faster than those with standard biweekly payroll. Building a roster of preferred workers who consistently accept your shifts also reduces fill times significantly over time.",
    ],
    category: "Employers",
  },
  {
    title: "CNA Shift Jobs in Tampa: What to Expect",
    excerpt:
      "A complete guide for CNAs looking for flexible shift work in the Tampa Bay area -- pay rates, facility types, and how to get started.",
    content: [
      "Tampa Bay is one of Florida's fastest-growing healthcare markets, with strong demand for Certified Nursing Assistants across home health agencies, assisted living facilities, and skilled nursing centers. Current CNA shift rates in the Tampa area range from $22 to $28 per hour, depending on the facility type and shift timing.",
      "Night shifts and weekend shifts typically pay a premium of $2-$5 more per hour. Home health shifts tend to offer more flexibility and one-on-one patient care, while facility-based shifts may offer higher volume and more predictable schedules.",
      "To get started with shift work in Tampa, ensure your CNA certification is current with the Florida Board of Nursing. Create a profile on ShiftCare, set your service area to Tampa Bay, and you can start browsing and accepting shifts immediately. Most workers complete their first shift within 48 hours of signing up.",
    ],
    category: "Workers",
  },
  {
    title: "Healthcare Staffing Agency vs. Direct Hire",
    excerpt:
      "Comparing the pros and cons of traditional staffing agencies against direct-hire platforms for healthcare facilities.",
    content: [
      "Traditional staffing agencies have long been the go-to solution for healthcare facilities needing temporary workers. They handle recruiting, credentialing, and payroll -- but at a significant cost, typically charging 40-60% markups on worker pay rates. This makes them expensive for facilities and limits what workers actually take home.",
      "Direct-hire platforms like ShiftCare represent a new model: facilities post shifts directly and workers accept them, cutting out the middleman. This reduces costs for facilities (typically 10-15% platform fees vs. 40-60% agency markups) and increases worker earnings since more of the pay rate goes directly to them.",
      "The trade-off is that facilities take on more responsibility for worker management. However, modern platforms handle credentialing verification, payment processing, and shift tracking -- leaving facilities to focus on what they do best: patient care. For most small to mid-size agencies, the cost savings make direct platforms the better choice.",
    ],
    category: "Industry",
  },
  {
    title: "Same-Day Pay for Healthcare Workers: How It Works",
    excerpt:
      "Everything you need to know about instant pay after shifts -- how it works on ShiftCare, fees involved, and why it matters.",
    content: [
      "Same-day pay allows healthcare workers to receive their earnings within hours of completing a shift, rather than waiting for a biweekly payroll cycle. On ShiftCare, workers who opt for same-day pay receive their net earnings (after the 10% service fee) deposited directly to their bank account or debit card the same business day.",
      "This matters because financial flexibility is one of the top reasons healthcare workers choose shift-based work. Studies show that 78% of hourly workers prefer employers or platforms that offer faster access to earned wages. For workers managing tight budgets or unexpected expenses, waiting two weeks for payment creates unnecessary financial stress.",
      "There is no additional fee for same-day pay on ShiftCare -- it is included as part of the standard platform experience. Employers can also benefit: shifts marked as same-day pay fill 40% faster, helping facilities maintain adequate staffing levels during high-demand periods.",
    ],
    category: "Workers",
  },
  {
    title: "Starting a Home Health Agency in Florida",
    excerpt:
      "A step-by-step guide for entrepreneurs looking to start a home health agency in Florida -- licensing, staffing, and technology.",
    content: [
      "Florida is one of the largest home health markets in the United States, driven by a growing senior population and favorable regulations for home-based care. To start a home health agency in Florida, you will need to obtain a Home Health Agency license from the Agency for Health Care Administration (AHCA), which requires a completed application, background screening, and a survey inspection.",
      "Staffing is the biggest operational challenge for new agencies. You will need at minimum a qualified administrator, a director of nursing (RN), and a roster of field workers (CNAs, HHAs, LPNs). Building a reliable workforce takes time -- platforms like ShiftCare can help new agencies fill shifts while they build their permanent team.",
      "Technology is essential from day one. You will need an electronic health records (EHR) system, scheduling software, and a reliable way to manage worker credentials and compliance documentation. Many new agencies underestimate the administrative burden of credential tracking -- automating this process early saves significant time and reduces compliance risk as you scale.",
    ],
    category: "Employers",
  },
];

/* Resources hub page — article previews with category filtering and search.
   Uses URL params for server-side filtering: /resources?category=employers&q=search */
export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = params.category
    ? (params.category.charAt(0).toUpperCase() + params.category.slice(1).toLowerCase())
    : "All";
  const searchQuery = params.q?.toLowerCase() || "";

  const filteredArticles = ARTICLES.filter((article) => {
    const matchesCategory = activeCategory === "All" || article.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      article.title.toLowerCase().includes(searchQuery) ||
      article.excerpt.toLowerCase().includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

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

      {/* Filters + Search */}
      <section className="px-4 pb-2">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Category Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {CATEGORIES.map((cat) => {
                const isActive = cat === activeCategory;
                const slug = cat === "All" ? "" : cat.toLowerCase();
                const href = slug
                  ? `/resources?category=${slug}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`
                  : `/resources${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}`;

                return (
                  <Link
                    key={cat}
                    href={href}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isActive
                        ? CATEGORY_FILTER_STYLES[cat] || "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </Link>
                );
              })}
            </div>

            {/* Search */}
            <form action="/resources" method="GET" className="flex-1 w-full sm:w-auto">
              {activeCategory !== "All" && (
                <input type="hidden" name="category" value={activeCategory.toLowerCase()} />
              )}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search articles..."
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-colors"
                />
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-8 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-500 text-sm">No articles found matching your filters.</p>
              <Link href="/resources" className="text-cyan-600 text-sm font-medium hover:underline mt-2 inline-block">
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid gap-8">
              {filteredArticles.map((article) => (
                <article
                  key={article.title}
                  className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8"
                >
                  <span
                    className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border mb-3 ${
                      CATEGORY_STYLES[article.category]
                    }`}
                  >
                    {article.category}
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
                    {article.title}
                  </h2>
                  <div className="space-y-4">
                    {article.content.map((paragraph, i) => (
                      <p key={i} className="text-sm text-slate-600 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
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
