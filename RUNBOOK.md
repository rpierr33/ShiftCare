# ShiftCare Operations Runbook

## Table of Contents
1. [Payment Failures](#1-payment-failures)
2. [Dispute Resolution](#2-dispute-resolution)
3. [Credential Management](#3-credential-management)
4. [Shift Issues](#4-shift-issues)
5. [Account Issues](#5-account-issues)
6. [System Monitoring](#6-system-monitoring)

---

## 1. Payment Failures

### Worker accepts shift but payment capture fails
**Symptom:** Shift shows ASSIGNED but paymentStatus stays UNPAID (no HELD).
**Cause:** Agency's card declined, expired, or Stripe is down.
**Steps:**
1. Check Stripe Dashboard → Payments → find the failed PaymentIntent by shift ID in metadata
2. The Stripe webhook `payment_intent.payment_failed` should auto-revert the shift to OPEN
3. If webhook didn't fire: manually update shift in DB: `status: 'OPEN', assignedWorkerId: null, paymentStatus: 'UNPAID'`
4. Notify the agency: "Payment failed when a worker tried to accept your shift. Please update your payment method in Settings."
5. Notify the worker: "The shift you accepted couldn't be confirmed due to a payment issue. It's been reopened for others."

### Agency wants a refund after cancellation
**Symptom:** Agency cancelled an assigned shift and expects money back.
**How it works:** Automatic. `cancelShiftWithRefund` creates a Stripe refund when paymentStatus is HELD. Check:
1. Stripe Dashboard → Payments → find the PaymentIntent → verify refund was created
2. DB: shift should show `paymentStatus: 'REFUNDED'`, `status: 'CANCELLED'`
3. If refund didn't process: create manual refund in Stripe Dashboard, then update DB

### Worker hasn't received payout
**Symptom:** Shift is COMPLETED + RELEASED but worker says no money.
**Steps:**
1. Check shift record: `paymentStatus` should be `RELEASED`, `stripeTransferId` should be set
2. Check Stripe Dashboard → Transfers → find the transfer by ID
3. If transfer succeeded: money is in worker's Connect account. Check their Connect dashboard.
4. Worker may need to complete Stripe Connect onboarding (bank details) before they can withdraw
5. If stripeAccountStatus is PENDING: worker hasn't finished Connect onboarding. Direct them to Earnings → "Set Up Payouts"

---

## 2. Dispute Resolution

### Agency reports an issue with a shift
**Location:** `/admin/disputes`
**Dispute types:** Worker no-show, Worker left early, Wrong credentials, Work quality, Other

**Steps:**
1. Read the dispute reason carefully
2. Check shift details: was the worker clocked in? What was their clock-in status (ON_SITE/OFF_SITE)?
3. Contact both parties if needed (check their email in the DB)

**Resolution options:**
- **Release to Worker** — Use when dispute is unfounded or minor. Releases held payment to worker. Worker gets paid, agency is charged.
- **Refund to Employer** — Use when worker genuinely failed (no-show, left early). Refunds the agency, worker gets nothing.
- **Split** — Not automated yet. To split: refund full amount to agency via Stripe, then create a partial transfer to worker manually.

**After resolution:**
- Both parties receive an in-app + email notification automatically
- Document your decision rationale (screenshot or note for records)

### Timeline
- Aim to resolve disputes within 48 hours
- If investigation needed, notify both parties: "We're reviewing your dispute. Expected resolution within 3 business days."

---

## 3. Credential Management

### Location: `/admin/credentials`

### Approving a credential
1. Verify the license number against the state board website:
   - Florida RN/LPN: https://mqa-internet.doh.state.fl.us/MQASearchServices/HealthCareProviders
   - Florida CNA: https://appsmqa.doh.state.fl.us/IRM00PRAES/PRASLIST.ASP
2. If valid: click Approve, enter the expiry date from the state board
3. Worker receives notification: "Credentials verified! You can now accept shifts."

### Rejecting a credential
1. Enter a clear reason (e.g., "License number not found in FL state records" or "License expired on [date]")
2. Worker receives notification with the reason and is prompted to resubmit
3. Their credentialStatus resets — they cannot accept shifts until resubmitted and re-approved

### Credential expiry
- Workers with credentials expiring within 30 days should receive automated alerts (when Resend/Twilio are configured)
- On expiry date: credentialStatus automatically becomes EXPIRED, shift acceptance is blocked
- Worker must renew with state board, then resubmit on ShiftCare

---

## 4. Shift Issues

### Shift stuck in ASSIGNED after end time
**Symptom:** Shift ended hours ago but still shows ASSIGNED, not COMPLETED.
**Cause:** Agency hasn't confirmed completion yet.
**Steps:**
1. Agency should see a "Confirm Completion" prompt on the shift detail page
2. Send agency a notification: "Your [ROLE] shift ended [X] ago. Please confirm completion so the worker can be paid."
3. If agency is unresponsive after 72 hours: consider auto-completing (manual DB update for now)

### Worker double-booking concern
**How it's prevented:** The `acceptShift` action checks for time overlaps with the worker's existing ASSIGNED shifts. Also uses optimistic locking (version field) to prevent concurrent acceptance.
**If reported:** Check the `assignments` table — there should only be one ACCEPTED assignment per shift. If two exist, the second one's shift update would have failed (updateMany count = 0).

### Shift shows wrong status
**Steps:**
1. Check `shifts` table: `status` and `paymentStatus` fields
2. Check `assignments` table: linked assignment status
3. Valid combinations:
   - OPEN + UNPAID (no worker yet)
   - ASSIGNED + HELD (worker accepted, payment captured)
   - IN_PROGRESS + HELD (worker clocked in)
   - COMPLETED + RELEASED (agency confirmed, worker paid)
   - CANCELLED + REFUNDED (cancelled after payment)
   - CANCELLED + UNPAID (cancelled before any worker accepted)
   - DISPUTED + HELD (under review)

---

## 5. Account Issues

### User can't log in
1. Check if account exists: `SELECT * FROM users WHERE email = '[email]'`
2. Check `isActive` — if false, account was soft-deleted
3. If password forgotten: direct to `/forgot-password`
4. If rate limited: check `rate_limit_entries` table, delete the entry for `login:[email]`

### Provider can't post shifts
1. Check subscription: `SELECT * FROM subscriptions WHERE providerProfileId = '[profileId]'`
2. Check usage: `SELECT * FROM usage_tracking WHERE providerProfileId = '[profileId]'`
3. If at plan limit (FREE = 3/month): they need to upgrade or wait until next month
4. If no payment method: they need to add one in Settings (required for shift posting)

### Worker can't accept shifts
1. Check `credentialStatus` on worker profile — must be VERIFIED
2. Check `stripeAccountStatus` — must be ACTIVE for payment flow
3. Check if they have a time overlap with another assigned shift
4. Check if the shift is still OPEN (may have been taken)

---

## 6. System Monitoring

### Key metrics to watch
- Failed payment rate (Stripe Dashboard → Payments → filter by failed)
- Average shift fill time (time between shift creation and assignment)
- Dispute rate (disputes / completed shifts)
- Worker credential verification backlog (pending credentials count)

### Database health
- Connection pool: Neon free tier allows 5 concurrent connections. If seeing connection errors, check for leaked connections.
- Prisma: run `npx prisma db pull` to verify schema matches

### Stripe webhook health
- Stripe Dashboard → Developers → Webhooks → check for failed deliveries
- If webhooks are failing: check the endpoint URL matches your deployment, verify STRIPE_WEBHOOK_SECRET is correct
- Re-send failed webhooks from Stripe Dashboard if needed

### Common env var issues
- `STRIPE_SECRET_KEY` missing → payments won't process (graceful fallback, but shifts won't get payment status)
- `RESEND_API_KEY` missing → emails won't send (notifications still created in-app)
- `ADMIN_EMAILS` missing → nobody can access admin pages
- `AUTH_SECRET` missing → auth completely broken, app won't start

---

## Emergency Contacts

- **Stripe Support:** https://support.stripe.com
- **Neon Database:** https://console.neon.tech (check status page)
- **Vercel:** https://vercel.com/support
- **ShiftCare Admin:** Add your contact here

---

*Last updated: March 26, 2026*
