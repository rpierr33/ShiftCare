import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PublicNav } from "@/components/shared/public-nav";
import { PublicFooter } from "@/components/shared/public-footer";
import { ARTICLES, CATEGORY_STYLES } from "@/data/articles";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

function getArticleBySlug(slug: string) {
  return ARTICLES.find((a) => a.slug === slug) ?? null;
}

export async function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return { title: "Article Not Found | ShiftCare" };
  }

  return {
    title: `${article.title} | ShiftCare Resources`,
    description: article.excerpt,
    alternates: { canonical: `/resources/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <>
      <PublicNav currentPage="resources" />

      <article className="pt-28 pb-12 sm:pt-36 sm:pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link
            href="/resources"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-cyan-600 transition-colors mb-8"
          >
            <ArrowLeft size={14} />
            Back to Resources
          </Link>

          {/* Category badge */}
          <span
            className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border mb-4 ${
              CATEGORY_STYLES[article.category]
            }`}
          >
            {article.category}
          </span>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-8 leading-tight">
            {article.title}
          </h1>

          {/* Article body */}
          <div className="prose prose-slate max-w-none">
            {article.content.map((paragraph, i) => (
              <p
                key={i}
                className="text-base text-slate-600 leading-relaxed mb-6"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </article>

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
