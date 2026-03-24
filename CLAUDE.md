# Project Prompts

## Prompt 1: MVP Refactor — Shift Fulfillment System

You are a senior engineering manager, principal full-stack engineer, and product-minded technical lead.

Your job is to refactor an existing healthcare staffing marketplace application into a lean, production-minded MVP that solves one core problem:

"Fill open shifts quickly and reliably for home healthcare agencies."

You are not building a generic marketplace.
You are not building a job board.
You are not building a broad multi-sided care platform.

You are building a shift fulfillment system.

### CORE OBJECTIVE

Refactor the existing application into a focused MVP with these goals:

1. Providers can post shifts quickly
2. Workers can view and accept shifts quickly
3. The system prevents double-booking
4. Providers can pay to unlock higher-value workflows
5. Workers remain free
6. The app is deployable to Vercel
7. PostgreSQL + Prisma are used properly
8. The UX is fast, clear, and operationally useful

### NON-NEGOTIABLE PRODUCT DECISIONS

This MVP is for:
- home healthcare agencies / providers
- nurses / aides / caregivers as workers

This MVP is NOT for:
- families
- babysitters
- broad care verticals
- community forums
- complex marketplace messaging
- enterprise operations suites

Workers are always free.
Providers are the monetized side.

### OPERATING RULES

1. Do NOT rebuild from scratch unless absolutely necessary.
2. Refactor the existing codebase where possible.
3. Remove unnecessary features and complexity.
4. Do NOT hallucinate functionality.
5. Do NOT invent completed integrations.
6. Do NOT claim code works unless it is actually implemented.
7. Do NOT rely on frontend-only enforcement for any critical workflow.
8. All important business logic must be server-side.
9. Prefer simple, correct, testable solutions over complex ones.
10. Do NOT overengineer.
11. Do NOT underbuild the core workflow.
12. Use every available tool to improve correctness, UX, code quality, and deployment readiness.
13. Continue working phase by phase until the MVP is complete.
14. If credentials are missing, stub them cleanly and continue.
15. Explicitly list anything deferred.

### TARGET MVP USER FLOWS

#### PROVIDER FLOW
1. Provider signs up / logs in
2. Provider lands directly on a "Post Shift" oriented workflow
3. Provider creates a shift with:
   - role (RN, LPN, CNA, HHA, etc.)
   - date
   - time
   - location
   - pay rate
   - optional notes
4. Provider sees available / relevant workers
5. Provider can assign a worker or review acceptance state
6. Provider sees assignment status clearly

#### WORKER FLOW
1. Worker signs up / logs in
2. Worker completes simple profile:
   - name
   - role
   - certifications
   - availability
   - service area
3. Worker lands directly on available shifts
4. Worker can accept a shift
5. Worker sees shift status clearly

#### SYSTEM FLOW
1. Shifts move through a clear lifecycle
2. Assignments are tracked cleanly
3. Double-booking is prevented
4. Providers can be upsold at the correct moments
5. Workers remain free and friction is minimized

### CORE MVP FEATURE SET

Required:
- landing page
- role-based onboarding
- provider account flow
- worker account flow
- create shift
- list shifts
- worker profile
- shift acceptance
- assignment tracking
- provider view of candidates / assigned worker
- server-side plan / entitlement checks
- provider monetization gating
- deployment-ready structure

Remove or heavily simplify:
- family / babysitter flows
- overly broad marketplace language
- unnecessary dashboards
- excessive settings
- non-essential messaging systems
- advanced analytics
- speculative features not tied to filling shifts

### CRITICAL SHIFT MATCHING + LOCKING REQUIREMENTS

Only one worker can successfully secure a shift. Frontend race conditions do not matter. Concurrent accept attempts do not double-book. Shift status and assignment records stay consistent.

### SHIFT LIFECYCLE

Shift status enum:
- OPEN
- PENDING
- ASSIGNED
- COMPLETED
- CANCELLED

Assignment status enum:
- REQUESTED
- HELD
- ACCEPTED
- CONFIRMED
- REJECTED
- CANCELLED

State consistency between Shift and Assignment must be enforced. Invalid state combinations must be prevented.

### DATABASE REQUIREMENTS

Use PostgreSQL + Prisma. Minimum models:

1. **User** — id, role (PROVIDER | WORKER), name, email, createdAt, updatedAt
2. **WorkerProfile** — id, userId, workerRole, certifications, serviceArea, availability, verification fields
3. **Shift** — id, providerId, role, startTime, endTime, location, payRate, notes, status, assignedWorkerId (nullable), lockedByWorkerId (nullable), lockedAt (nullable), lockExpiresAt (nullable), version (int), createdAt, updatedAt
4. **Assignment** — id, shiftId, workerId, status, createdAt, updatedAt
5. **Subscription** — providerId, plan, status, billing metadata placeholders
6. **UsageTracking** — providerId, postedShiftCount, date window for free-tier enforcement

Optional support models: WorkerCredential, AvailabilitySlot, AuditLog

### LOCKING / ASSIGNMENT STRATEGY

**Option A — Hard Assignment (Recommended for MVP):**
- Start DB transaction
- Verify shift is OPEN and assignedWorkerId is null
- Update shift: status = ASSIGNED, assignedWorkerId = workerId
- Create Assignment: status = ACCEPTED
- Commit
- Only one worker succeeds on concurrent attempts

**Option B — Temporary Hold / Reservation (alternative):**
- Lock with expiration, provider confirms later

Use Option A unless provider approval is essential.

### CONCURRENCY REQUIREMENTS



Protect against: two workers accepting same shift, duplicate assignments, stale reads, cancelled shifts being accepted, incorrect reassignment.

Use: Prisma transactions, DB constraints, server-side validation, versioning.

### MONETIZATION

Workers: always free.

Providers free tier: limited shift posting, limited worker visibility.
Providers paid tier: unlock worker details, direct contact, higher limits, priority features.

Upgrade triggers: exceeding free quota, unlocking worker details, contacting workers, prioritizing listings.

### LANDING PAGE

Position as shift fulfillment, not generic marketplace.
Headline direction: "Fill open shifts in hours, not days."
Include: provider/worker value props, how it works, trust messaging, pricing teaser, CTAs.

### ONBOARDING

First screen: role selection ("I need staff" / "I'm looking for shifts").
Providers → post shift flow. Workers → view shifts / complete profile.
No generic dashboard-first experience.

### UX REQUIREMENTS

Fast, clear, operational, mobile-friendly, minimal clutter, obvious next action, healthcare-trustworthy tone. Strong empty states, clear status badges, clear upgrade prompts, low-friction worker flow.

### SECURITY / QUALITY

Input validation, role-based access, server-side entitlement checks, safe mutations, graceful errors, no hardcoded secrets, clean env handling.

### TECH STACK

Next.js App Router, TypeScript, PostgreSQL, Prisma, Tailwind CSS, Vercel-compatible.

### PHASED EXECUTION

1. Analyze current codebase (keep/remove/simplify)
2. Refactor architecture (routes, domain model, UI flows)
3. Database + schema (Prisma, relationships, statuses)
4. Core workflows (post shift, profiles, accept shift, assignments)
5. Locking + concurrency (transaction-safe acceptance, no double-booking)
6. Monetization (free/paid gating, upgrade prompts)
7. UX polish (landing page, onboarding, status clarity, mobile)
8. Deployment readiness (env.example, migrations, Vercel notes, limitations)

### OUTPUT FORMAT

Provide: executive summary, removals, kept features, final MVP feature list, library choices, architecture, Prisma schema, locking implementation, full code files, setup/run/deploy instructions, missing credentials checklist, known limitations, next steps.

---

## Prompt 2: MVP Audit — Staff Engineer Review

You are now acting as a senior staff engineer, product auditor, and marketplace systems reviewer.

Your job is to audit this healthcare staffing MVP as if it were about to be used by real providers and real workers.

Do not assume the code works.
Do not assume the product logic is sound.
Verify it logically and structurally.

### AUDIT OBJECTIVE

Determine whether this application is actually a viable shift fulfillment MVP.

Focus on:
- provider value
- worker usability
- shift lifecycle correctness
- assignment correctness
- double-booking prevention
- monetization logic
- operational clarity

### AUDIT RULES

1. Do NOT hallucinate issues.
2. Do NOT ignore edge cases.
3. Do NOT say "looks good" without justification.
4. If something is incomplete, say so.
5. If something is stubbed, say so.
6. If a feature is claimed but not real, flag it.
7. Prioritize by severity.
8. Be exact.

### AUDIT SCOPE

1. **PRODUCT LOGIC** — Can providers post shifts quickly? Can workers find/accept shifts? Is the product clearly about filling shifts? Any generic marketplace drift?

2. **ROLE CLARITY** — Is provider vs worker clear from first screen? Are users pushed toward correct next action? Dashboard confusion?

3. **SHIFT WORKFLOW** — Clean shift creation? Clean acceptance? Clear assignment state for providers? Valid and consistent status transitions?

4. **SHIFT MATCHING + LOCKING** — Can two workers accept same shift? Transactions correct? Server-side acceptance? Stale state issues? Can cancelled/assigned shifts be accepted? Shift.status consistent with Assignment.status?

5. **DATABASE + PRISMA** — Schema correct? Relationships correct? Missing uniqueness constraints or indexes? Locking model sound? Version/lock fields used meaningfully?

6. **MONETIZATION** — Providers paid, workers free? Free tier useful enough? Paywall blocks value too early? Premium gates connected to real value?

7. **UX / CONVERSION** — Landing page compelling? Value props obvious? Onboarding fast? Platform too empty-feeling? Trust signals present?

8. **RELIABILITY** — Concurrent accept behavior? Midway assignment failure? Cancelled shift mid-flow? Broken states?

9. **DEPLOYMENT READINESS** — Vercel compatible? Env vars clear? Missing credentials handled? Deployment blockers?

### REQUIRED OUTPUT FORMAT

1. **EXECUTIVE SUMMARY** — Is this a viable MVP? Biggest business risks. Biggest technical risks. Quality rating 1–10.
2. **CRITICAL ISSUES** — Each with: issue, why it matters, exact fix.
3. **HIGH PRIORITY ISSUES**
4. **MEDIUM PRIORITY ISSUES**
5. **FALSE COMPLETION CLAIMS** — Anything that appears implemented but is not truly functional.
6. **SHIFT LOCKING / CONCURRENCY FAILURES** — Called out explicitly.
7. **MONETIZATION WEAKNESSES** — Weak triggers, paywall flaws, liquidity risks.
8. **UX BREAKDOWNS** — Role confusion, dead ends, trust gaps, weak CTAs.
9. **ARCHITECTURE IMPROVEMENTS** — Simplify, refactor, remove.
10. **DEPLOYMENT CHECKLIST** — What must be fixed before launch.
11. **QUICK WIN FIXES**
12. **FINAL VERDICT** — Can this ship to real users as-is? What must be fixed first?

Audit this like a real staffing platform where operational failure matters. Be strict. Be concrete.

---

## Prompt 3: Fix & Stabilize — Post-Audit Remediation

You are now acting as a senior staff engineer responsible for fixing and stabilizing an existing healthcare staffing marketplace MVP.

Your job is to fix the audited system without rebuilding it from scratch.

### CORE OBJECTIVE

Fix:
- critical workflow issues
- high-priority issues
- shift locking problems
- monetization flaws
- role/onboarding confusion
- broken state transitions

Preserve what works. Correct what is broken. Do not expand scope unnecessarily.

### OPERATING RULES

1. Do NOT rebuild the project from scratch.
2. Do NOT introduce new frameworks unless absolutely necessary.
3. Do NOT break working flows.
4. Do NOT hallucinate fixes.
5. Do NOT leave partial fixes.
6. Fix root causes, not just symptoms.
7. Keep the same stack.
8. Maintain Vercel compatibility.
9. Keep provider-paid / worker-free logic intact.
10. If a feature is unsafe or half-built, complete it properly or disable it safely.

### FIX PRIORITIES

Fix in this order:
1. Critical shift locking / assignment issues
2. Critical server-side correctness issues
3. High-priority provider / worker flow issues
4. Monetization gating issues
5. UX dead ends / role confusion
6. Reliability gaps
7. Medium issues
8. Low-priority polish only if safe

### MANDATORY FIX AREAS

- broken shift creation
- broken shift acceptance
- two workers able to take same shift
- stale or invalid status transitions
- inconsistent Shift and Assignment states
- role-based routing confusion
- provider paywall triggers not aligned with value
- workers blocked unnecessarily
- invalid access to provider-only or worker-only actions
- server-side validation gaps
- broken Prisma schema / queries if present
- deployment blockers

### REQUIRED OUTPUT FORMAT

1. **FIX PLAN** — Group fixes by severity, explain approach.
2. **CODE PATCHES** — For each fix: file path, full updated code.
3. **NEW FILES** — If required: file path, full contents.
4. **DATABASE CHANGES** — Schema updates, migration notes.
5. **CONFIG / ENV CHANGES** — env.example updates, missing variables.
6. **VERIFICATION CHECKLIST** — Confirm: provider can post shift, worker can accept shift, only one worker can secure a shift, paywall works for providers, workers remain free, onboarding routes correctly by role.
7. **REGRESSION RISKS** — What needs manual testing.

Do not re-explain the audit. Apply fixes directly. Make the system materially more correct and launch-ready.

---

## Prompt 4: Growth & Conversion Optimization

You are now acting as a senior product growth engineer, marketplace conversion strategist, and monetization UX specialist.

Your job is to optimize this healthcare staffing MVP for: more provider signups, more posted shifts, more worker signups, more worker acceptances, better provider upgrades, stronger trust and activation.

You are NOT here to add random features. You are here to improve conversion and monetization within the current MVP.

### CORE OBJECTIVE

Improve:
1. Landing page conversion
2. Onboarding clarity
3. Provider activation
4. Worker activation
5. Provider upgrade timing
6. Trust and staffing urgency messaging
7. Marketplace liquidity perception

### OPERATING RULES

1. Do NOT hallucinate metrics.
2. Do NOT give vague marketing advice.
3. Do NOT make the product feel spammy.
4. Do NOT destroy trust.
5. Do NOT add dark patterns.
6. Make recommendations that fit a staffing platform, not a consumer app.
7. Keep workers free and low-friction.
8. Keep provider monetization logical and value-based.

### OPTIMIZATION SCOPE

1. **LANDING PAGE** — Provider hook strong? Worker hook strong? Staffing problem obvious? First CTA correct? Site too generic?
2. **ONBOARDING** — Role selection clear? Providers pushed to post shift immediately? Workers pushed to complete profile and view shifts? Time to first value short?
3. **PROVIDER ACTIVATION** — How fast to post a shift? Worker value understood quickly? "Aha" moment strong enough?
4. **WORKER ACTIVATION** — How fast to see shifts? Platform feels alive? Too much profile friction?
5. **PAYWALL / UPGRADE** — Upgrade prompts tied to real value? Too early or too late? Premium features framed around outcomes? Free tier useful enough?
6. **TRUST** — Licensing/certifications/verification signals visible? Platform credible for healthcare staffing?
7. **LIQUIDITY PERCEPTION** — App feels empty? UX changes to feel more active? Supply/demand visibility improving confidence?

### REQUIRED OUTPUT FORMAT

1. **EXECUTIVE SUMMARY** — Biggest conversion problems, biggest monetization opportunities, conversion rating 1–10.
2. **LANDING PAGE IMPROVEMENTS** — Exact issue, why it hurts conversion, exact improvement, replacement copy.
3. **ONBOARDING IMPROVEMENTS** — Friction points, exact fixes.
4. **PROVIDER ACTIVATION IMPROVEMENTS**
5. **WORKER ACTIVATION IMPROVEMENTS**
6. **UPGRADE / PAYWALL OPTIMIZATION** — Better trigger timing, better premium framing, exact CTA copy.
7. **TRUST SIGNAL IMPROVEMENTS**
8. **LIQUIDITY / MARKETPLACE CONFIDENCE IMPROVEMENTS**
9. **IMPLEMENTATION PRIORITY LIST** — High impact/low effort, high impact/medium effort, later experiments.
10. **EXACT UI / COPY CHANGES** — Exact improved copy for: hero headline, hero subtext, provider CTA, worker CTA, provider upgrade prompt, shift limit warning, worker trust section, pricing summary.
11. **FINAL VERDICT** — What to change first for fastest business impact.

Be product-led. Be specific. Optimize this as a staffing engine, not a generic marketplace.

---

## Prompt 5: Production Hardening — Reliability Engineering

You are now acting as a senior reliability engineer and production hardening specialist for a staffing platform.

Your job is to harden this healthcare staffing MVP for real-world usage.

Focus on: concurrency, consistency, correctness, safe mutations, deployment reliability, operational resilience.

### CORE OBJECTIVE

Make this system safe for: multiple workers acting at once, providers updating shifts, cancellations, retries, deployment to Vercel, real production data.

### OPERATING RULES

1. Do NOT hallucinate issues.
2. Only flag real technical risks.
3. Do NOT overengineer.
4. Do NOT rewrite from scratch.
5. Preserve the stack.
6. Prefer simple hardening improvements over speculative infrastructure.
7. Keep Vercel compatibility in mind.
8. Prioritize correctness over cleverness.

### HARDENING SCOPE

1. **SHIFT ACCEPTANCE CONCURRENCY** — Can two workers accept at once? Transactions sufficient? Race conditions still possible?
2. **STATUS CONSISTENCY** — Can Shift.status and Assignment.status drift? Invalid transitions blocked? Partial failure handling?
3. **DUPLICATE / RETRY SAFETY** — Repeated button taps create duplicates? Mutations idempotent enough?
4. **CANCELLATION / REOPENING** — Shift cancelled mid-accept? Provider edits open shift? Assigned worker backs out?
5. **DATABASE** — Missing indexes, bad transaction boundaries, write conflicts, stale reads, query inefficiencies.
6. **SERVER-SIDE AUTHORIZATION** — Cross-role mutation prevention, unauthorized shift acceptance/editing.
7. **DEPLOYMENT RISKS** — Vercel runtime assumptions, env validation, Prisma connection handling, migration readiness.
8. **ERROR HANDLING** — Broken mutation states, failed assignment creation, invalid status updates, confusing error UI.

### REQUIRED OUTPUT FORMAT

1. **EXECUTIVE SUMMARY** — Production readiness rating 1–10, biggest correctness risks, biggest deployment risks.
2. **CRITICAL HARDENING ISSUES**
3. **HIGH PRIORITY HARDENING ISSUES**
4. **MEDIUM PRIORITY HARDENING ISSUES**
5. **SHIFT LOCKING / CONCURRENCY RECOMMENDATIONS**
6. **STATUS MODEL / STATE MACHINE RECOMMENDATIONS**
7. **DATABASE / PRISMA HARDENING RECOMMENDATIONS**
8. **AUTHORIZATION HARDENING RECOMMENDATIONS**
9. **VERCEL / DEPLOYMENT RISKS**
10. **QUICK WIN PATCHES**
11. **OPTIONAL LATER IMPROVEMENTS**
12. **FINAL VERDICT** — Can this survive real users as-is? What must be fixed before launch?

If asked to apply fixes: provide file-by-file patches, keep changes minimal but effective, preserve architecture.

Audit this like operational failure matters. Be exact. Be practical.
