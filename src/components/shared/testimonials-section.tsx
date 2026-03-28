const TESTIMONIALS = [
  {
    name: "Sarah M.",
    role: "Director of Nursing",
    company: "Sunrise Health Agency",
    initials: "SM",
    color: "bg-rose-400",
    rating: 5,
    quote:
      "ShiftCare cut our shift vacancy time from 3 days to under 30 minutes. The credential verification gives us peace of mind, and the same-day pay option means we always have workers available.",
  },
  {
    name: "Marcus T.",
    role: "CNA",
    company: "4 years experience",
    initials: "MT",
    color: "bg-blue-400",
    rating: 5,
    quote:
      "I love seeing exactly what I\u2019ll earn before accepting a shift. The same-day pay is a game-changer \u2014 no more waiting two weeks. I\u2019ve picked up 15 extra shifts this month.",
  },
  {
    name: "Dr. Jennifer K.",
    role: "Home Health Agency Owner",
    company: "",
    initials: "JK",
    color: "bg-emerald-400",
    rating: 5,
    quote:
      "The preferred worker system lets me build a reliable team. When I post a shift, my top workers get first access. Fill rate went from 60% to 95% in the first month.",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          className="w-4 h-4 text-amber-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="py-20 sm:py-28 px-4 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block text-sm font-semibold text-cyan-600 uppercase tracking-wider mb-3">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            What Our Customers Say
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm hover:shadow-lg transition-shadow"
            >
              <Stars count={t.rating} />
              <p className="mt-4 text-slate-600 text-sm leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-xs font-bold text-white`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {t.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t.role}
                    {t.company ? `, ${t.company}` : ""}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
