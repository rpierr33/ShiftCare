# ShiftCare — Fill Healthcare Shifts Fast

A healthcare shift fulfillment MVP that connects home health agencies with qualified nurses, aides, and caregivers. Post shifts, accept work, prevent double-booking — all in one platform.

## Architecture

- **Next.js 15** (App Router) + TypeScript
- **PostgreSQL** + Prisma ORM
- **Tailwind CSS** for styling
- **NextAuth (Auth.js v5)** for authentication
- **Vercel-compatible** deployment

## Core Workflow

### Providers
1. Sign up → complete onboarding → post shifts
2. Workers accept shifts (transaction-safe, no double-booking)
3. View assignment status, manage shifts, upgrade for more capacity

### Workers
1. Sign up → complete profile → browse available shifts
2. Accept shifts with one tap (server-side enforced)
3. View accepted shifts and history

## Shift Locking Strategy

**Option A — Hard Assignment (implemented)**

When a worker accepts a shift:
1. Start Prisma interactive transaction
2. Verify shift is `OPEN` and `assignedWorkerId` is null
3. Check for time overlap with worker's existing shifts
4. Atomically update shift via `updateMany` with optimistic lock (`version` field)
5. Create Assignment record with `ACCEPTED` status
6. Commit — only one worker succeeds on concurrent attempts

## Monetization

- **Workers**: Always free
- **Providers**:
  - Free: 3 shifts/month, 2 worker unlocks
  - Starter ($49/mo): 25 shifts/month, 15 unlocks, direct contact
  - Professional ($149/mo): Unlimited everything + priority listings

## Getting Started

```bash
# 1. Clone and install
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL and AUTH_SECRET

# 3. Set up database
npx prisma migrate dev    # or: npx prisma db push
npm run seed              # Seed demo data

# 4. Run
npm run dev
```

### Demo Accounts (password: `password123`)

| Role | Email | Plan |
|------|-------|------|
| Provider | sarah@sunrisehealth.com | Starter |
| Provider | michael@humanityhealth.com | Free |
| Worker | maria@example.com | CNA |
| Worker | james@example.com | RN |
| Worker | aisha@example.com | LPN |

## Deployment to Vercel

1. Push to GitHub
2. Import in Vercel
3. Set environment variables:
   - `DATABASE_URL` — PostgreSQL connection string (Neon/Supabase recommended)
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `AUTH_URL` — Your production URL
4. Prisma generates automatically via build command

## Missing Credentials (Deferred)

| Service | Status | Impact |
|---------|--------|--------|
| Stripe | Stubbed | Plans update directly in DB, no real payment |
| SendGrid/Resend | Stubbed | No emails sent (verification, notifications) |
| Password Reset | Removed | No forgot-password flow |

## Known Limitations

1. **No real payment processing** — Stripe integration deferred
2. **No email delivery** — Verification and notifications stubbed
3. **No password reset** — Forgot password flow removed for MVP
4. **No real-time updates** — Workers must refresh for new shifts
5. **No admin panel** — Platform administration deferred
6. **No messaging** — Direct communication deferred
7. **ShiftStatus.PENDING** — In schema but unused (reserved for future hold workflow)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL + Prisma 5 |
| Auth | NextAuth v5 (JWT) |
| Styling | Tailwind CSS |
| Hosting | Vercel |
| Icons | Lucide React |
