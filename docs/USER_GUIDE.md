# ShiftCare User Guide

## What is ShiftCare?

ShiftCare is a healthcare shift fulfillment platform that helps home health agencies fill open shifts fast by connecting them directly with qualified, verified healthcare workers.

---

## For Providers (Healthcare Agencies)

### Getting Started

1. **Sign Up** — Go to the homepage and click **"I Need Staff"**, or visit `/signup?role=PROVIDER`
2. **Complete Onboarding** — Enter your company name, address, and contact info
3. **You're in!** — You land on your Provider Dashboard, ready to post your first shift

### Posting a Shift

1. Click **"Post New Shift"** from your dashboard (or navigate to Post Shift in the nav)
2. Fill in the shift details:
   - **Role** — Select what type of worker you need (RN, LPN, CNA, HHA, etc.)
   - **Title** (optional) — e.g., "Morning Wound Care Visit"
   - **Location** — Address where the shift takes place
   - **Date** — When the shift occurs
   - **Start / End Time** — Shift hours
   - **Pay Rate** — Hourly rate in USD
   - **Notes** (optional) — Special requirements or instructions
3. Click **"Post Shift"**
4. Your shift is immediately visible to qualified workers

### Managing Shifts

- **Dashboard** shows all your shifts with status badges:
  - **Open** (green) — Waiting for a worker to accept
  - **Assigned** (blue) — A worker has accepted
  - **Completed** (gray) — Shift was completed
  - **Cancelled** (red) — Shift was cancelled
- Click any shift to see full details, the assigned worker, and take actions
- **Complete Shift** — Mark an assigned shift as done
- **Cancel Shift** — Cancel an open or assigned shift (worker is notified)

### Viewing Workers

- Navigate to **Workers** to browse available healthcare workers
- See worker name, role, location, and experience
- **Free plan** shows limited info — upgrade to see full profiles and contact details

### Billing & Plans

- Navigate to **Billing** to see your current plan and usage
- **Free** — 3 shifts/month, 2 worker unlocks
- **Starter** ($49/mo) — 25 shifts/month, 15 unlocks, direct contact
- **Professional** ($149/mo) — Unlimited everything + priority listings
- Upgrade anytime directly from the billing page

### Tips for Providers

- Post shifts with competitive pay rates to attract workers faster
- Add clear notes about requirements (certifications, experience needed)
- Complete shifts promptly so workers see you as reliable
- Upgrade to Starter when you need to post more than 3 shifts/month

---

## For Workers (Nurses, Aides, Caregivers)

### Getting Started

1. **Sign Up** — Go to the homepage and click **"I'm Looking for Shifts"**, or visit `/signup?role=WORKER`
2. **Complete Onboarding** — Select your role (RN, LPN, CNA, etc.), enter your city and state
3. **You're in!** — You land on Available Shifts, ready to start accepting work

### Browsing Available Shifts

1. The **Available Shifts** page shows all open shifts near you
2. Each shift card shows:
   - Role needed (e.g., CNA, RN)
   - Provider/agency name
   - Location
   - Date and time
   - Pay rate
   - Any special notes
3. Shifts are sorted by date (soonest first)

### Accepting a Shift

1. Find a shift that matches your skills and schedule
2. Click **"Accept Shift"**
3. If successful, the shift is yours — no one else can take it
4. If another worker just grabbed it, you'll see a clear message

**Important:** Once you accept a shift, you're committed. The system prevents double-booking — you can't accept overlapping shifts.

### Viewing Your Shifts

- Navigate to **My Shifts** to see:
  - **Upcoming** — Shifts you've accepted that haven't happened yet
  - **Past** — Completed shifts for your records

### Your Profile

- Navigate to **Profile** to keep your info up to date
- Fill in: role, license number, certifications, bio, hourly rate, experience, and service area
- A complete profile helps providers trust and choose you
- **Your profile is always free** — ShiftCare never charges workers

### Tips for Workers

- Keep your profile complete — providers see your role, experience, and credentials
- Accept shifts quickly — popular shifts get taken fast
- Check back regularly for new shifts
- Add your certifications to stand out (BLS, CPR, wound care, etc.)

---

## How Shift Assignment Works

ShiftCare uses a **first-come, first-served** model with server-side transaction safety:

1. When you click "Accept Shift," the system starts a database transaction
2. It verifies the shift is still open and unassigned
3. It checks you don't have a conflicting shift at that time
4. It atomically assigns you and creates the assignment record
5. If two workers click at the exact same moment, only one succeeds

**No double-booking is possible.** This is enforced at the database level, not in your browser.

---

## Account Types at a Glance

| Feature | Worker | Provider (Free) | Provider (Starter) | Provider (Pro) |
|---------|--------|-----------------|-------------------|---------------|
| Cost | Free forever | Free | $49/mo | $149/mo |
| Browse shifts | Yes | — | — | — |
| Accept shifts | Yes | — | — | — |
| Post shifts | — | 3/month | 25/month | Unlimited |
| View workers | — | Limited | Full profiles | Full profiles |
| Contact workers | — | No | Yes | Yes |
| Priority listings | — | No | No | Yes |

---

## Troubleshooting

**"This shift is no longer available"** — Another worker accepted it first. Try a different shift.

**"You already have a shift during this time"** — You have an overlapping shift. Check My Shifts.

**"You've reached your shift limit"** — You're on the Free plan. Go to Billing to upgrade.

**Can't sign in?** — Double-check your email and password. Password reset is coming soon.

---

## Support

For questions or issues, contact the ShiftCare team or visit the GitHub repository.
