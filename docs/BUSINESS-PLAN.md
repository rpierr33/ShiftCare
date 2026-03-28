# ShiftCare Business Plan

**Prepared:** April 2026
**Founders:** Ralph Pierre, Rose Jean Baptiste, Noelle Pierre, Elle Pierre
**Development Partner:** Kalocode (Development Agency)
**Platform:** https://shiftcare-app-rho.vercel.app

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Market Opportunity](#2-market-opportunity)
3. [Product Overview](#3-product-overview)
4. [Revenue Model](#4-revenue-model)
5. [Financial Projections](#5-financial-projections)
6. [Valuation](#6-valuation)
7. [Founding Team](#7-founding-team)
8. [Go-To-Market Strategy](#8-go-to-market-strategy)
9. [Future Revenue Streams](#9-future-revenue-streams)
10. [Cost Analysis & Development Value](#10-cost-analysis--development-value)
11. [Competitive Landscape](#11-competitive-landscape)
12. [Risk Analysis](#12-risk-analysis)
13. [Milestones & Timeline](#13-milestones--timeline)

---

## 1. Executive Summary

ShiftCare is a healthcare shift fulfillment platform that connects verified healthcare professionals (RNs, LPNs, CNAs, HHAs) with home health agencies and families who need care coverage. The platform solves a specific, urgent problem: **filling open healthcare shifts in hours, not days.**

The U.S. healthcare staffing industry is a **$52 billion market** growing at 7% annually, with an estimated **$12 billion lost annually** to unfilled shifts, overtime costs, and agency markups. In Florida alone, the home health aide workforce gap exceeds 30,000 workers, with demand accelerating as the 65+ population grows 3.5% per year.

ShiftCare generates revenue through three channels:
1. **Employer subscriptions** ($49-$149/month)
2. **Worker service fees** (10% per shift)
3. **Employer per-shift surcharges** (15% for non-subscribers)

The platform is launching beta in South Florida (June 2026) with plans to expand to Tampa and Orlando in Q4 2026, then Georgia, Texas, and California in 2027.

---

## 2. Market Opportunity

### Industry Size

| Metric | Value | Source |
|--------|-------|--------|
| U.S. healthcare staffing market | $52.1B (2025) | Staffing Industry Analysts |
| Projected CAGR | 7.2% (2025-2030) | Grand View Research |
| U.S. home health care market | $142.9B (2025) | Fortune Business Insights |
| Florida home health market | ~$8.2B | FL AHCA estimates |
| Unfilled healthcare shifts (annual cost) | ~$12B nationally | NSI Nursing Solutions |
| Average cost of a single unfilled shift | $3,400 (including overtime, agency fees) | Becker's Hospital Review |

### The Problem

1. **For Agencies:** Filling a shift takes 2-5 days on average. During that time, patient care gaps, overtime costs, and agency markup fees accumulate. A single unfilled CNA shift costs an agency $400-800 in lost revenue and overtime.

2. **For Workers:** Healthcare professionals want flexible, well-paying shifts but are locked into rigid agency schedules. Per diem workers often learn about available shifts through phone trees, text chains, or bulletin boards — then discover the shift was filled hours ago.

3. **For Families:** Families seeking home care face a fragmented market with opaque pricing, inconsistent quality, and no way to verify caregiver credentials independently.

### Florida-Specific Opportunity

Florida is the ideal launch market:
- **#1 in U.S. for 65+ population** (22.3%, 5.1M residents)
- **#2 in home health agencies** (3,400+ licensed agencies)
- **Chronic CNA/HHA shortage** — 30,000+ unfilled positions
- **High per-diem demand** — tourism and seasonal residents create variable staffing needs
- **Regulatory tailwinds** — AHCA pushing for technology adoption in care coordination

**Target Cities (Launch):** Fort Lauderdale, Miami, West Palm Beach (South Florida tri-county: Broward, Miami-Dade, Palm Beach)

**Serviceable Addressable Market (SAM):** $240M (Florida home health shift staffing)
**Serviceable Obtainable Market (SOM):** $2.4M in Year 1 (1% capture)

---

## 3. Product Overview

### Core Platform Features

**For Workers (Supply Side):**
- Browse and accept shifts with one tap
- Same-day pay option (paid within hours of completion)
- Multi-metric rating system (Punctuality, Professionalism, Skill/Competence)
- Credential verification with provisional access
- Map-based shift discovery with distance filtering
- Personalized shift recommendations ("Top Picks for You")
- Schedule management with per-day availability windows
- Earnings dashboard with charts and CSV export

**For Employers (Demand Side):**
- Post shifts with role, time, location, pay rate
- Same-day pay toggle per shift (attracts more workers)
- Preferred worker invite system (4-hour exclusive window)
- Bulk shift operations and templates
- Worker search with rating/reliability/role filters
- Real-time shift status tracking with clock-in/out verification
- Subscription plans with usage-based limits

**Platform Safety:**
- 3-strike cancellation/no-show system (affects both workers and employers)
- Geofenced clock-in/out verification
- Automated credential expiry tracking with 60/30/14/7-day alerts
- Transaction-safe shift acceptance (prevents double-booking)
- $15 late cancellation fee for employers

**Technology:**
- Next.js 15 (App Router), TypeScript, PostgreSQL, Prisma ORM
- Stripe Connect for payments, Web Push notifications
- Deployed on Vercel with Neon PostgreSQL
- PWA-capable (installable on mobile devices)

---

## 4. Revenue Model

ShiftCare has three primary revenue streams and multiple planned future streams.

### 4.1 Primary Revenue Streams

#### Stream 1: Employer Subscriptions

| Plan | Monthly | Annual (20% off) | Limits |
|------|---------|-------------------|--------|
| Free | $0 | $0 | 3 shifts/mo, 2 worker unlocks |
| Starter | $49 | $39/mo ($468/yr) | 25 shifts/mo, 15 unlocks |
| Professional | $149 | $119/mo ($1,428/yr) | Unlimited |

**Conversion assumption:** 60% Free → 25% Starter → 15% Professional (at scale)

#### Stream 2: Worker Service Fee

A **10% service fee** is deducted from every worker payout.

**Example:** $30/hr shift × 8 hours = $240 gross → $24 platform fee → $216 to worker

This fee is transparent — workers see the exact deduction before accepting any shift.

#### Stream 3: Employer Per-Shift Surcharge

Employers without a subscription pay a **15% surcharge** on each shift.

**Example:** $240 shift value × 15% = $36 surcharge → employer pays $276 total

This creates a natural upgrade path: at 4+ shifts/month, the Starter plan ($49) is cheaper than per-shift fees.

### 4.2 Revenue Per Shift

| Scenario | Worker Fee (10%) | Employer Fee | Total Platform Revenue |
|----------|-----------------|-------------|----------------------|
| Subscribed employer, $200 shift | $20 | $0 (covered by subscription) | $20 |
| Non-subscribed employer, $200 shift | $20 | $30 (15% surcharge) | $50 |

### 4.3 Unit Economics

| Metric | Value |
|--------|-------|
| Average shift value | $200 (8hr × $25/hr) |
| Revenue per shift (subscribed) | $20 (10% worker fee) |
| Revenue per shift (non-subscribed) | $50 (10% + 15%) |
| Blended revenue per shift | $30 (assuming 60% subscribed) |
| Average shifts per employer per month | 12 |
| Monthly revenue per active employer (sub + fees) | $49 (sub) + $240 (worker fees from 12 shifts) = $289 |
| Customer acquisition cost (estimated) | $150 |
| Lifetime value (24-month avg retention) | $6,936 |
| LTV:CAC ratio | 46:1 |

---

## 5. Financial Projections

### Year 1 (June 2026 – May 2027) — Florida Beta + Growth

| Quarter | Employers | Workers | Shifts/Month | MRR | Revenue |
|---------|-----------|---------|-------------|-----|---------|
| Q1 (Jun-Aug) | 15 | 50 | 120 | $2,850 | $8,550 |
| Q2 (Sep-Nov) | 45 | 150 | 450 | $10,500 | $31,500 |
| Q3 (Dec-Feb) | 100 | 350 | 1,200 | $28,000 | $84,000 |
| Q4 (Mar-May) | 180 | 600 | 2,400 | $52,000 | $156,000 |
| **Year 1 Total** | | | | | **$280,050** |

**MRR Breakdown (Q4):**
- Subscriptions: 30 Starter ($49) + 15 Professional ($149) = $3,705
- Worker fees: 2,400 shifts × $200 × 10% = $48,000
- Employer surcharges: 600 shifts (non-sub) × $200 × 15% = $18,000
- Total: ~$52,000/mo (run rate of $624K ARR)

### Year 2 (June 2027 – May 2028) — Multi-State Expansion

| Quarter | Employers | Workers | Shifts/Month | MRR | Revenue |
|---------|-----------|---------|-------------|-----|---------|
| Q1 | 300 | 1,000 | 4,500 | $95,000 | $285,000 |
| Q2 | 500 | 1,800 | 8,000 | $170,000 | $510,000 |
| Q3 | 750 | 2,800 | 13,000 | $280,000 | $840,000 |
| Q4 | 1,000 | 4,000 | 20,000 | $430,000 | $1,290,000 |
| **Year 2 Total** | | | | | **$2,925,000** |

### Year 3 (June 2028 – May 2029) — National Scale

| Metric | Projection |
|--------|-----------|
| Active employers | 3,000+ |
| Active workers | 12,000+ |
| Shifts per month | 60,000+ |
| Annual revenue | $10M+ |
| Gross margin | 75%+ |

### 5-Year Revenue Summary

| Year | Revenue | ARR (end of year) |
|------|---------|-------------------|
| Year 1 | $280K | $624K |
| Year 2 | $2.9M | $5.2M |
| Year 3 | $10M+ | $14M+ |
| Year 4 | $22M+ | $28M+ |
| Year 5 | $40M+ | $50M+ |

---

## 6. Valuation

### Pre-Revenue Valuation: $1.2 Million

This valuation is justified by:

#### 6.1 Market-Based Valuation

| Comparable | Stage at Valuation | Valuation | Revenue Multiple |
|------------|-------------------|-----------|-----------------|
| Clipboard Health (2017 seed) | Pre-revenue MVP | $3M | Pre-revenue |
| CareRev (2018 seed) | Early revenue | $8M | 20x ARR |
| Nursa (2019 seed) | Early revenue | $5M | 15x ARR |
| ShiftKey (2018 seed) | Pre-revenue | $4M | Pre-revenue |
| IntelyCare (2019 Series A) | $2M ARR | $45M | 22x ARR |

ShiftCare's $1.2M valuation is **conservative** relative to comparable healthcare staffing platforms at similar stages. The average seed valuation in this space was $3-5M.

#### 6.2 Asset-Based Valuation

| Asset | Estimated Value |
|-------|----------------|
| Complete production codebase (174+ files, 25,000+ lines) | $400,000 |
| Database architecture (20+ models, relationships, indexes) | $80,000 |
| Payment infrastructure (Stripe Connect, escrow, subscriptions) | $120,000 |
| Credential verification system | $60,000 |
| Matching algorithm + recommendation engine | $80,000 |
| SEO foundation (5 articles, sitemap, OG images) | $30,000 |
| Brand, domain, design system | $50,000 |
| Florida market intelligence + compliance research | $40,000 |
| **Total IP Value** | **$860,000** |

#### 6.3 Revenue-Based Forward Valuation

Using a 10x forward revenue multiple on projected Year 1 ARR:
- Projected ARR (end of Year 1): $624,000
- 10x multiple: **$6.2M**
- Discounted 80% for execution risk: **$1.24M**

#### 6.4 Market Gap Valuation

The unfilled shift problem represents $12B annually in the U.S. Even capturing 0.01% of this waste reduction creates $1.2M in annual value — validating the valuation floor.

**Conclusion:** $1.2M is a defensible, conservative pre-revenue valuation supported by market comparables, IP asset value, and forward revenue projections.

---

## 7. Founding Team

### Ralph Pierre — CEO & Product Lead
Leads product strategy, market positioning, and business operations. Responsible for ShiftCare's vision as a shift fulfillment platform (not a job board, not a generic marketplace). Drives the focus on healthcare worker experience and employer conversion.

### Rose Jean Baptiste — COO & Operations
Manages day-to-day operations, employer relationships, and market expansion planning. Responsible for the Florida launch strategy and geographic expansion roadmap. Background in healthcare operations and workforce management.

### Noelle Pierre — CFO & Finance
Oversees financial planning, revenue modeling, and fundraising strategy. Manages subscription pricing, fee structures, and break-even analysis. Responsible for investor relations and financial reporting.

### Elle Pierre — CMO & Growth
Leads user acquisition, brand positioning, and content strategy. Manages the worker and employer marketing funnels, SEO strategy, and social proof development. Responsible for the /for-workers and /for-families landing pages and conversion optimization.

### Kalocode — Development Agency (Technology Partner)
Full-stack development partner responsible for building and maintaining the ShiftCare platform. Handles architecture decisions, feature development, security, and deployment. Kalocode brings expertise in Next.js, TypeScript, PostgreSQL, and healthcare technology compliance.

---

## 8. Go-To-Market Strategy

### Phase 1: South Florida Beta (June - September 2026)
- **Target:** 15 home health agencies in Broward, Dade, and Palm Beach counties
- **Approach:** Direct outreach to agency owners, emphasizing "fill shifts in 30 minutes"
- **Worker acquisition:** Facebook/Instagram ads targeting CNA/HHA certification groups
- **Pricing:** Free tier + Starter plan
- **KPI:** 120 shifts filled/month, 50 active workers

### Phase 2: Florida Growth (October 2026 - March 2027)
- **Target:** 100 agencies across all Florida metro areas
- **Approach:** Referral program (agencies refer agencies), content marketing (blog articles targeting "CNA jobs Tampa")
- **Worker acquisition:** Same-day pay as primary differentiator in ads
- **Pricing:** Full tier rollout including Professional
- **KPI:** 1,200 shifts/month, 350 workers, $28K MRR

### Phase 3: Multi-State Expansion (April 2027+)
- **Target:** Georgia, Texas, California
- **Approach:** Replicate Florida playbook per state, hire local market managers
- **KPI:** 4,500 shifts/month, 1,000 workers, $95K MRR

### Customer Acquisition Channels

| Channel | Target | Expected CAC |
|---------|--------|-------------|
| Direct agency outreach | Agencies | $200 |
| Google Ads (employer keywords) | Agencies | $150 |
| Facebook/Instagram (worker keywords) | Workers | $15-25 |
| Content/SEO (blog articles) | Both | $5-10 (organic) |
| Referral program | Both | $50 |
| Partnerships (nursing schools) | Workers | $10 |

---

## 9. Future Revenue Streams

### 9.1 Planned (Year 2-3)

**Premium Shift Placement ($5-15/shift)**
Employers can boost their shift listings to appear first in worker feeds. Similar to Uber Eats restaurant promotions. Estimated adoption: 20% of shifts at $10 average = $2/shift blended revenue lift.

**Background Check Fees ($30-50/check)**
Integrate with Checkr or Sterling for automated background checks. Pass the cost through with a markup. At 500 workers/month: $15,000-25,000/month.

**Training & Certification Marketplace**
Partner with online CEU providers (Relias, NetCE) and take a referral fee for workers who complete certifications through ShiftCare. $10-30 per enrollment.

**Payroll Integration Fee ($99-299/month)**
Offer agencies a payroll export/integration module that syncs completed shifts with their payroll system (ADP, Gusto, Paychex). Subscription add-on.

### 9.2 Future (Year 3-5)

**In-App Advertising**
Healthcare supply companies (scrubs, medical equipment, continuing education) pay to advertise to our verified healthcare worker audience. CPM model targeting 12,000+ workers.

Estimated revenue at scale: $50K-200K/year.

**Data & Analytics Premium**
Sell anonymized workforce analytics to healthcare systems: shift fill rates by region, wage trends, seasonal demand patterns. SaaS pricing for hospital systems.

**Insurance & Benefits Marketplace**
Partner with insurance providers to offer per-diem workers access to health insurance, liability coverage, and retirement plans. Revenue share on premiums.

**White-Label Platform**
License the ShiftCare platform to large healthcare systems as their internal staffing solution. Enterprise pricing: $5,000-25,000/month.

### Revenue Stream Maturity Timeline

| Stream | Year 1 | Year 2 | Year 3 | Year 5 |
|--------|--------|--------|--------|--------|
| Subscriptions | $44K | $450K | $1.8M | $6M |
| Worker fees (10%) | $192K | $2M | $7.2M | $24M |
| Employer surcharges (15%) | $44K | $475K | $1M | $2M |
| Premium placement | — | $100K | $500K | $2M |
| Background checks | — | $150K | $600K | $1.5M |
| Training referrals | — | $50K | $200K | $500K |
| Payroll integration | — | — | $300K | $1M |
| Advertising | — | — | $100K | $500K |
| Data/analytics | — | — | $200K | $1M |
| White-label | — | — | — | $2M |
| **Total** | **$280K** | **$3.2M** | **$11.9M** | **$40.5M** |

---

## 10. Cost Analysis & Development Value

*See companion document: [COST-ANALYSIS.md](./COST-ANALYSIS.md) for detailed breakdown.*

### Summary

| Development Approach | Estimated Cost | Timeline |
|---------------------|---------------|----------|
| Professional agency (U.S.) | $350,000 - $600,000 | 8-14 months |
| Mid-tier agency (international) | $150,000 - $300,000 | 6-10 months |
| Fiverr / Upwork freelancer | $50,000 - $150,000 | 6-18 months (high risk) |
| Solo developer | $80,000 - $200,000 | 10-18 months |
| **ShiftCare (Kalocode)** | **IP valued at $860K** | **Built and deployed** |

The platform as built represents approximately **$400,000-600,000** in equivalent professional development cost, delivered at a fraction of that through Kalocode's efficiency and the founders' product vision.

---

## 11. Competitive Landscape

| Feature | ShiftCare | Clipboard Health | CareRev | IntelyCare | ShiftMed |
|---------|-----------|-----------------|---------|-----------|----------|
| Same-day pay | Yes (per-shift toggle) | Yes | Yes | Yes | No |
| Worker always free | Yes | Yes | Yes | No (W-2) | No (W-2) |
| Family/private care | Yes | No | No | No | No |
| Shift recommendations | Yes (8-signal scoring) | Basic | Advanced | Advanced | Basic |
| Multi-metric ratings | Yes (7 sub-metrics) | Basic | Basic | Basic | Basic |
| Cancellation policy | 3-strike + decay | 2-strike | Varies | Varies | Varies |
| Credential expiry alerts | Automated (60/30/14/7/0 days) | Manual | Automated | Automated | Manual |
| Pricing transparency | Full breakdown before accept | Partial | Full | Partial | Partial |
| Geographic focus | Florida (expanding) | National | National | Northeast | Southeast |

**ShiftCare's Differentiators:**
1. **Three-persona platform** — agencies, families, AND workers (competitors ignore families)
2. **Same-day pay as employer toggle** — not a platform decision, employers control it per shift
3. **Transparent fee structure** — workers see exact take-home before accepting
4. **Credential expiry automation** — proactive alerts, not reactive verification
5. **3-strike system with decay** — fair, graduated consequences that reward good behavior

---

## 12. Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Low initial employer adoption | Medium | High | Direct agency outreach, free tier, same-day pay differentiator |
| Worker supply shortage | Medium | High | Targeted social ads, nursing school partnerships, referral bonuses |
| Regulatory compliance | Low | High | HIPAA-ready architecture, credential verification, licensed in FL |
| Competitor response | Medium | Medium | Speed of iteration, family care niche, Florida market focus |
| Payment processing issues | Low | Medium | Stripe Connect handles compliance, escrow protects both parties |
| Credential fraud | Low | High | Admin review queue, automated expiry, background check integration |

---

## 13. Milestones & Timeline

| Date | Milestone |
|------|-----------|
| June 2026 | Beta launch in Fort Lauderdale, Miami, West Palm Beach |
| July 2026 | 50 active workers, 15 agencies |
| August 2026 | Stripe live, first revenue |
| October 2026 | Expand to Tampa + Orlando |
| November 2026 | 350 workers, 100 agencies, $28K MRR |
| Q1 2027 | All Florida metros, mobile app (React Native) |
| Q2 2027 | Georgia expansion |
| May 2027 | $52K MRR, 600 workers, 180 agencies |
| Q3 2027 | Texas expansion |
| Q4 2027 | California expansion |
| December 2027 | $430K MRR, 4,000 workers, 1,000 agencies |
| 2028 | Series A fundraise ($5-10M) at $50M+ valuation |

---

## Appendix: Key Platform Metrics (Current)

| Metric | Value |
|--------|-------|
| Codebase | 174+ source files, 25,000+ lines TypeScript |
| Database models | 20+ (User, Shift, Assignment, Rating, Strike, etc.) |
| API routes | 17 (auth, clock-in/out, push, cron, admin, webhooks) |
| Cron jobs | 4 (no-shows, strike decay, credential expiry, auto-confirm) |
| Public pages | 13 (homepage, pricing, for-workers, for-families, etc.) |
| SEO articles | 5 (statically generated with per-article metadata) |
| Authentication | Email/password + Google OAuth |
| Payment | Stripe Connect (escrow model) |
| Notification channels | In-app, email (Resend), SMS (Twilio), web push (VAPID) |

---

*This business plan was prepared by the founding team of ShiftCare in collaboration with Kalocode. All financial projections are estimates based on market research and comparable company data. Actual results may vary.*
