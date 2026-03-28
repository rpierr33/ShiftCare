"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import {
  ARTICLES,
  CATEGORIES,
  CATEGORY_STYLES,
  CATEGORY_FILTER_STYLES,
} from "@/data/articles";

export function ResourceList() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const query = searchQuery.toLowerCase();

  const filteredArticles = ARTICLES.filter((article) => {
    const matchesCategory =
      activeCategory === "All" || article.category === activeCategory;
    const matchesSearch =
      !query ||
      article.title.toLowerCase().includes(query) ||
      article.excerpt.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      {/* Filters + Search */}
      <section className="px-4 pb-2">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Category Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {CATEGORIES.map((cat) => {
                const isActive = cat === activeCategory;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isActive
                        ? CATEGORY_FILTER_STYLES[cat] || "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-8 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-500 text-sm">
                No articles found matching your filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("All");
                  setSearchQuery("");
                }}
                className="text-cyan-600 text-sm font-medium hover:underline mt-2 inline-block"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid gap-8">
              {filteredArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/resources/${article.slug}`}
                  className="block bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 hover:border-slate-200 hover:shadow-md transition-all"
                >
                  <span
                    className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border mb-3 ${
                      CATEGORY_STYLES[article.category]
                    }`}
                  >
                    {article.category}
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                    {article.title}
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    {article.excerpt}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-cyan-600">
                    Read article
                    <ArrowRight size={14} />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
