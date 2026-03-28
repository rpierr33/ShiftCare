export type Category = "Employers" | "Workers" | "Industry";

export interface Article {
  title: string;
  slug: string;
  excerpt: string;
  content: string[];
  category: Category;
}

export const CATEGORIES: ("All" | Category)[] = ["All", "Employers", "Workers", "Industry"];

export const CATEGORY_STYLES: Record<Category, string> = {
  Employers: "text-cyan-600 bg-cyan-50 border-cyan-200",
  Workers: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Industry: "text-violet-600 bg-violet-50 border-violet-200",
};

export const CATEGORY_FILTER_STYLES: Record<string, string> = {
  All: "bg-slate-900 text-white",
  Employers: "bg-cyan-600 text-white",
  Workers: "bg-emerald-600 text-white",
  Industry: "bg-violet-600 text-white",
};

export const ARTICLES: Article[] = [
  {
    title: "How to Fill Nursing Shifts Fast",
    slug: "how-to-fill-nursing-shifts-fast",
    excerpt:
      "Practical strategies for healthcare agencies to reduce time-to-fill and keep shifts covered, even during peak demand periods.",
    content: [
      "Unfilled shifts cost healthcare agencies an average of $300-$500 per vacancy day in lost revenue and overtime costs. In Florida, where the demand for home health aides and skilled nurses continues to outpace supply, this problem is especially acute. The key to filling shifts fast is reducing friction in the hiring process and making your open positions visible to qualified workers the moment they become available.",
      "Start by posting shifts with clear, complete details: exact start and end times, location with cross streets or landmarks, pay rate, and any special requirements such as wound care experience or bilingual fluency. Workers are 3x more likely to accept shifts that include complete information upfront. Platforms like ShiftCare that match shifts to credentialed workers in your area automatically eliminate the back-and-forth phone calls and faxes that slow down traditional staffing.",
      "Consider offering competitive pay rates and same-day pay options. Data from Florida staffing markets shows that shifts offering same-day pay fill 40% faster than those with standard biweekly payroll. Building a roster of preferred workers who consistently accept your shifts also reduces fill times significantly over time, creating a reliable bench of go-to staff.",
      "Finally, think about timing. Posting shifts at least 48 hours in advance gives workers time to plan, but ShiftCare also supports same-day shift posting for urgent needs. Agencies that maintain a consistent posting schedule see higher acceptance rates because workers learn to check the platform regularly for new opportunities.",
    ],
    category: "Employers",
  },
  {
    title: "CNA Shift Jobs in Tampa: What to Expect",
    slug: "cna-shift-jobs-tampa",
    excerpt:
      "A complete guide for CNAs looking for flexible shift work in the Tampa Bay area -- pay rates, facility types, and how to get started.",
    content: [
      "Tampa Bay is one of Florida's fastest-growing healthcare markets, with strong demand for Certified Nursing Assistants across home health agencies, assisted living facilities, and skilled nursing centers. The region's large and growing senior population -- Hillsborough County alone has over 200,000 residents aged 65 and older -- drives consistent need for qualified CNAs year-round. Current CNA shift rates in the Tampa area range from $22 to $28 per hour, depending on the facility type and shift timing.",
      "Night shifts and weekend shifts typically pay a premium of $2-$5 more per hour, making them attractive options for workers who prefer non-traditional schedules. Home health shifts tend to offer more flexibility and one-on-one patient care, while facility-based shifts may offer higher volume and more predictable schedules. Many CNAs on ShiftCare mix both types to maximize their earnings while keeping their weeks balanced.",
      "To get started with shift work in Tampa, ensure your CNA certification is current with the Florida Board of Nursing. You will need to have completed a state-approved training program and passed the Florida CNA competency exam. Additionally, most agencies and platforms require a Level 2 background screening, which includes fingerprinting through AHCA. Having your CPR/BLS certification current is also a standard requirement.",
      "Once your credentials are in order, create a profile on ShiftCare, set your service area to Tampa Bay, and you can start browsing and accepting shifts immediately. Most workers complete their first shift within 48 hours of signing up. The platform verifies your credentials upfront so agencies can trust your qualifications, and you never have to re-submit paperwork for each new facility.",
    ],
    category: "Workers",
  },
  {
    title: "Healthcare Staffing Agency vs. Direct Hire",
    slug: "healthcare-staffing-agency-vs-direct-hire",
    excerpt:
      "Comparing the pros and cons of traditional staffing agencies against direct-hire platforms for healthcare facilities.",
    content: [
      "Traditional staffing agencies have long been the go-to solution for healthcare facilities needing temporary workers. They handle recruiting, credentialing, and payroll -- but at a significant cost, typically charging 40-60% markups on worker pay rates. For a Florida home health agency paying a CNA $25 per hour, that means the agency is actually paying the staffing company $35-$40 per hour. Over hundreds of shifts per month, these markups add up to tens of thousands of dollars in unnecessary overhead.",
      "Direct-hire platforms like ShiftCare represent a new model: facilities post shifts directly and workers accept them, cutting out the middleman. This reduces costs for facilities (typically 10-15% platform fees vs. 40-60% agency markups) and increases worker earnings since more of the pay rate goes directly to them. In Florida's competitive healthcare labor market, higher take-home pay means your shifts get filled faster because workers prioritize platforms where they earn more.",
      "The trade-off is that facilities take on more responsibility for worker management. However, modern platforms handle credentialing verification, payment processing, and shift tracking -- leaving facilities to focus on what they do best: patient care. ShiftCare, for example, verifies all Florida-specific requirements (CNA certification, Level 2 background screening, CPR/BLS) before a worker can accept any shift.",
      "For most small to mid-size home health agencies in Florida, the cost savings make direct platforms the better choice. Larger organizations with complex multi-facility operations may still benefit from a hybrid approach -- using traditional agencies for hard-to-fill specialty roles while using direct platforms like ShiftCare for routine shift coverage that represents the bulk of their staffing needs.",
    ],
    category: "Industry",
  },
  {
    title: "Same-Day Pay for Healthcare Workers: How It Works",
    slug: "same-day-pay-healthcare-workers",
    excerpt:
      "Everything you need to know about instant pay after shifts -- how it works on ShiftCare, fees involved, and why it matters.",
    content: [
      "Same-day pay allows healthcare workers to receive their earnings within hours of completing a shift, rather than waiting for a biweekly payroll cycle. On ShiftCare, workers who opt for same-day pay receive their net earnings deposited directly to their bank account or debit card the same business day. This is made possible through integration with modern payment infrastructure that processes payouts in near real-time.",
      "This matters because financial flexibility is one of the top reasons healthcare workers choose shift-based work. Studies show that 78% of hourly workers prefer employers or platforms that offer faster access to earned wages. For CNAs, HHAs, and LPNs across Florida -- many of whom are working multiple jobs or managing tight household budgets -- waiting two weeks for payment creates unnecessary financial stress and can even force workers to take on predatory payday loans.",
      "There is no additional fee for same-day pay on ShiftCare -- it is included as part of the standard platform experience. This is different from many gig platforms that charge $1-$5 per instant transfer. Employers benefit too: shifts marked with same-day pay fill 40% faster, helping facilities maintain adequate staffing levels during high-demand periods like flu season or holiday weekends when Florida's seasonal population swells.",
      "To use same-day pay, workers simply complete their shift and confirm hours through the app. Once the provider approves the timesheet, payment is initiated automatically. Most workers see funds in their account within 2-4 hours on business days. Setting up direct deposit takes about two minutes during the initial profile setup on ShiftCare.",
    ],
    category: "Workers",
  },
  {
    title: "Starting a Home Health Agency in Florida",
    slug: "starting-home-health-agency-florida",
    excerpt:
      "A step-by-step guide for entrepreneurs looking to start a home health agency in Florida -- licensing, staffing, and technology.",
    content: [
      "Florida is one of the largest home health markets in the United States, driven by a growing senior population of over 4.5 million residents aged 65 and older and favorable regulations for home-based care. The state's warm climate attracts retirees from across the country, creating sustained demand for home health services that shows no sign of slowing. To start a home health agency in Florida, you will need to obtain a Home Health Agency license from the Agency for Health Care Administration (AHCA), which requires a completed application, background screening for all owners and administrators, proof of financial ability to operate, and a successful survey inspection.",
      "Staffing is the biggest operational challenge for new agencies. You will need at minimum a qualified administrator, a director of nursing (RN), and a roster of field workers (CNAs, HHAs, LPNs). Florida requires that your director of nursing hold an active Florida RN license and have at least one year of home health experience. Building a reliable workforce takes time -- platforms like ShiftCare can help new agencies fill shifts immediately while they recruit and build their permanent team, giving you revenue-generating capability from day one rather than waiting months to hire a full staff.",
      "Technology is essential from day one. You will need an electronic health records (EHR) system compliant with Florida and federal regulations, scheduling software, and a reliable way to manage worker credentials and compliance documentation. Florida's AHCA conducts regular surveys and can impose fines for credential lapses -- a single expired CNA certification on your roster can result in a deficiency finding. Automating credential tracking through platforms like ShiftCare reduces this compliance risk significantly.",
      "Plan for your first year carefully. Most new Florida home health agencies take 6-12 months to break even. Your initial costs will include licensing fees ($2,000-$5,000), liability insurance ($3,000-$8,000 annually), office setup, and working capital to cover payroll before receivables start flowing. Medicaid enrollment in Florida can take 90-120 days, so many agencies start with private-pay clients and Medicaid waiver programs while their full Medicaid provider enrollment is processed.",
    ],
    category: "Employers",
  },
];
