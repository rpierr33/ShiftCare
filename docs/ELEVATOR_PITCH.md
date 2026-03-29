# ShiftCare — Elevator Pitch

**Updated: April 2026**

---

## One-Liner

**ShiftCare fills open healthcare shifts in hours, not days — with same-day pay for workers and zero agency markups for employers.**

---

## The Problem (30 seconds)

A nurse calls out sick at 6 AM. A CNA no-shows. A home health patient needs coverage by noon.

The agency scrambles — calling down a phone list, texting personal contacts, posting on job boards that take days. Traditional staffing agencies charge 30-50% markups.³ Per diem workers hear about shifts through group texts and discover they were filled hours ago.

**$12 billion is lost annually to unfilled healthcare shifts in the U.S.**¹ In Florida alone, 30,000+ healthcare positions sit unfilled² while qualified workers can't find flexible shifts that pay on time.

---

## The Solution (30 seconds)

ShiftCare is a shift fulfillment platform — not a job board, not a staffing agency — purpose-built for home healthcare.

**For employers:** Post a shift in 30 seconds. Our matching algorithm notifies qualified, verified workers in your area instantly. Average fill time: hours, not days. One worker per shift, guaranteed — no double-booking, no confusion.

**For workers:** Browse shifts with transparent pay breakdowns, accept with one tap, get paid the same day. See exactly what you'll earn before you commit. No applications, no recruiter calls, no two-week pay cycles.

**For families:** Find verified, background-checked caregivers for your loved ones. No contracts, pay by the hour, see ratings and credentials upfront.

---

## What We've Built

ShiftCare is not a prototype. It's a **production application** deployed and operational:

- **Intelligent shift matching** — 8-signal recommendation engine (role, location, pay history, availability, urgency, familiar providers, freshness, same-day pay preference)
- **Same-day pay** — employers toggle it per shift; workers get paid within hours of completion
- **Credential verification** — automated expiry tracking with 60/30/14/7-day alerts; provisional access while verification completes
- **3-strike reliability system** — no-shows and late cancellations reduce visibility; 90-day decay rewards good behavior; applies to both workers AND employers
- **Geofenced clock-in/out** — location-verified time tracking with actual vs. scheduled hour comparison
- **Multi-metric ratings** — workers rated on Punctuality, Professionalism, Skill; employers rated on Communication, Environment, Payment, Fairness
- **Preferred worker invites** — employers build trusted teams and give them first access to new shifts
- **Complete payment infrastructure** — Stripe Connect escrow (hold on accept, release on complete, refund on cancel), subscription billing, break-even calculator
- **4 notification channels** — in-app, email, SMS, web push
- **Full employer suite** — dashboard analytics, bulk operations, shift templates, recurring shifts, worker search with filters
- **Full worker suite** — earnings dashboard with charts, documents/receipts with CSV export, schedule management, credential status dashboard
- **SEO foundation** — 5 indexed articles, per-page OG images, sitemap, robots.txt
- **13 public marketing pages** — homepage, pricing (interactive toggle + comparison table), /for-workers, /for-families, /about, /contact, /resources, /demo

---

## How It Works

1. **Employer posts a shift** — role, time, location, pay rate, same-day pay toggle
2. **Workers get matched** — our algorithm scores and surfaces the most relevant shifts per worker
3. **Worker accepts with one tap** — atomic transaction locks the assignment (no double-booking)
4. **Worker clocks in** — geolocation verified, shift status goes to In Progress
5. **Shift completes** — worker clocks out, employer confirms, payment releases
6. **Both parties rate each other** — multi-metric ratings build trust for future shifts

---

## Why It's Different

| ShiftCare | Traditional Staffing |
|-----------|---------------------|
| Shift filled in hours | 2-5 days |
| 10% worker fee, transparent | 30-50% agency markup, opaque |
| Same-day pay option | Biweekly pay cycles |
| Workers choose their shifts | Shifts assigned by dispatcher |
| Automated credential tracking | Manual phone verification |
| Both parties rated | No accountability |
| $49-149/mo flat subscription | Per-placement fees ($500-2,000)⁹ |

---

## Business Model

**Three revenue streams:**

1. **Employer subscriptions** — Free (3 shifts/mo), Starter $49/mo (25 shifts), Professional $149/mo (unlimited). Annual billing saves 20%.

2. **Worker service fee** — 10% deducted from every payout (transparent, shown before acceptance). At $200 average shift: $20 per shift.

3. **Employer per-shift surcharge** — Non-subscribers pay 15% per shift. Creates natural upgrade path: 4+ shifts/month and the Starter plan saves money.

**Unit economics:** $30 blended revenue per shift. At 2,400 shifts/month: $72K MRR.

**Future streams:** Premium shift placement, background check fees, training marketplace, payroll integration, in-app advertising, workforce analytics, white-label licensing.

---

## Market Opportunity

| Metric | Value |
|--------|-------|
| U.S. healthcare staffing market | $52 billion⁴ |
| Annual cost of unfilled shifts | $12 billion¹ |
| Florida home health market | $8.2 billion⁵ |
| Florida home health agencies | 3,400+ licensed⁶ |
| Florida 65+ population | 5.1 million (22.3%, #1 in U.S.)⁷ |
| Unfilled CNA/HHA positions (FL) | 30,000+² |

**Target:** $240M serviceable market in Florida. 1% capture in Year 1 = $2.4M.

---

## Financial Projections

| Year | Revenue | Key Milestone |
|------|---------|---------------|
| Year 1 | $280K | Florida launch, 180 employers, 600 workers |
| Year 2 | $2.9M | Multi-state (GA, TX, CA), 1,000 employers |
| Year 3 | $10M+ | National presence, 3,000 employers |
| Year 5 | $40M+ | Market leader in per-diem home health |

---

## Valuation

**$1.2 million pre-revenue** — deliberately conservative for the current funding environment.

Post-2022 seed valuations contracted 30-50%. Current pre-revenue healthcare tech seeds: $2-4M (Carta, 2024). Historical comps adjusted for correction:
- Clipboard Health seed: $3M (2017) → ~$1.5-2M equivalent today⁸
- CareRev seed: $4.5M (2018) → ~$2.5-3M equivalent today⁸
- Nursa seed: $3.5M (2020) → ~$2-2.5M equivalent today⁸

$1.2M is **below the adjusted floor.** Supported by:
- IP replacement cost: $485K-705K
- Forward revenue (10x Year 1 ARR, 80% execution discount): $1.24M
- With pilot agency LOIs, valuation moves to $2-4M

---

## The Team

- **Ralph Pierre** — CEO & Product Lead
- **Rose Jean Baptiste** — COO & Operations
- **Noelle Pierre** — CFO & Finance
- **Elle Pierre** — CMO & Growth
- **Kalocode** — Development Agency (Technology Partner)

---

## Traction

- Production platform deployed at shiftcare-app-rho.vercel.app
- 174+ source files, 25,000+ lines of production TypeScript
- 20+ database models, 17 API endpoints, 4 automated cron jobs
- Full codebase audit: 24 bugs found and fixed, 32/32 regression tests passing
- Beta launch: June 2026 in South Florida (Fort Lauderdale, Miami, West Palm Beach)

---

## The Ask

ShiftCare is launching its South Florida beta in June 2026. We're looking for:

- **Home health agencies** in Fort Lauderdale, Miami, and West Palm Beach to pilot the platform
- **Healthcare professionals** (CNAs, HHAs, RNs, LPNs) to join the worker marketplace
- **Families** seeking home care in Florida
- **Strategic investors** aligned with healthcare workforce innovation

---

**Fill open shifts in hours, not days. Pay workers the same day. No agency markups.**

**That's ShiftCare.**

---

## Sources

1. NSI Nursing Solutions, Inc., "2024 NSI National Health Care Retention & RN Staffing Report." Industry estimate based on aggregated unfilled shift costs, overtime, and agency markup expenditures across U.S. healthcare facilities.
2. U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics (OEWS), 2024; Florida Department of Economic Opportunity, "Florida's Statewide Demand Occupations List," 2024-2025.
3. Staffing Industry Analysts, "Healthcare Staffing Buyer Survey," 2024. Agency markup rates vary by specialty; 30-50% represents the typical range for per-diem nursing and aide placements.
4. Staffing Industry Analysts, "US Staffing Industry Forecast: September 2024 Update." Total U.S. healthcare staffing market size.
5. IBISWorld, "Home Health Care Services in Florida — Market Size," 2024. State-level market estimate derived from national market data and Florida's proportional share.
6. Florida Agency for Health Care Administration (AHCA), "Licensed Home Health Agency Directory," 2024.
7. U.S. Census Bureau, American Community Survey (ACS) 1-Year Estimates, 2023. Florida 65+ population share and count.
8. Crunchbase, company profiles for Clipboard Health, CareRev, and Nursa. Seed round amounts and dates are publicly reported on Crunchbase.
9. American Staffing Association, "Staffing Industry Revenue and Pricing Models," 2024. Per-placement fees vary by role and specialty; $500-$2,000 represents the typical range for healthcare per-diem placements.
