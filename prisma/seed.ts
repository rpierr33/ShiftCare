import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding ShiftCare database...\n");

  // Clean existing data (order matters for FK constraints)
  await db.rating.deleteMany();
  await db.payout.deleteMany();
  await db.shiftPayment.deleteMany();
  await db.transaction.deleteMany();
  await db.wallet.deleteMany();
  await db.paymentMethod.deleteMany();
  await db.assignment.deleteMany();
  await db.shift.deleteMany();
  await db.usageTracking.deleteMany();
  await db.subscription.deleteMany();
  await db.credential.deleteMany();
  await db.availabilitySlot.deleteMany();
  await db.notification.deleteMany();
  await db.workerProfile.deleteMany();
  await db.providerProfile.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.rateLimitEntry.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 12);
  const now = new Date();

  // ─── Admin ─────────────────────────────────────────────────────

  await db.user.create({
    data: {
      name: "ShiftCare Admin",
      email: "admin@shiftcare.com",
      passwordHash,
      role: "PROVIDER",
      onboardingCompleted: true,
    },
  });

  console.log("✓ Created admin account (admin@shiftcare.com / password123)");

  // ─── Providers ──────────────────────────────────────────────────

  const provider1 = await db.user.create({
    data: {
      name: "Sarah Johnson",
      email: "sarah@sunrisehealth.com",
      passwordHash,
      role: "PROVIDER",
      phone: "813-555-0100",
      onboardingCompleted: true,
    },
  });

  const provider1Profile = await db.providerProfile.create({
    data: {
      userId: provider1.id,
      providerType: "AGENCY",
      companyName: "Sunrise Home Health",
      description: "Compassionate home health services across Tampa Bay since 2015.",
      address: "2121 W Oak Ave",
      city: "Tampa",
      state: "FL",
      zipCode: "33607",
      phone: "813-555-0100",
      npiNumber: "1234567890",
      einNumber: "59-1234567",
      licenseNumber: "HHA-29384",
      licenseState: "FL",
      contactPerson: "Sarah Johnson",
      contactPersonEmail: "sarah@sunrisehealth.com",
    },
  });

  await db.subscription.create({
    data: {
      providerProfileId: provider1Profile.id,
      plan: "STARTER",
      status: "ACTIVE",
    },
  });

  const provider2 = await db.user.create({
    data: {
      name: "Michael Chen",
      email: "michael@humanityhealth.com",
      passwordHash,
      role: "PROVIDER",
      phone: "407-555-0200",
      onboardingCompleted: true,
    },
  });

  const provider2Profile = await db.providerProfile.create({
    data: {
      userId: provider2.id,
      providerType: "PRIVATE",
      companyName: "Humanity & Blessing Home Health",
      description: "Faith-based private duty nursing in Central Florida.",
      address: "500 Main St",
      city: "Orlando",
      state: "FL",
      zipCode: "32801",
      phone: "407-555-0200",
    },
  });

  await db.subscription.create({
    data: {
      providerProfileId: provider2Profile.id,
      plan: "FREE",
      status: "ACTIVE",
    },
  });

  console.log("✓ Created 2 providers (Sarah=STARTER/AGENCY, Michael=FREE/PRIVATE)");

  // ─── Workers ────────────────────────────────────────────────────

  const workerData = [
    // --- FULLY VERIFIED workers ---
    {
      name: "Maria Garcia", email: "maria@example.com", role: "CNA" as const,
      bio: "Dedicated CNA with 6 years experience in home health and memory care.",
      years: 6, city: "Tampa", state: "FL", zip: "33612",
      workAreas: ["Tampa", "Brandon", "Riverview"],
      credentialScenario: "full", profileComplete: true,
    },
    {
      name: "James Wilson", email: "james@example.com", role: "RN" as const,
      bio: "RN specializing in wound care and post-surgical recovery. IV certified.",
      years: 12, city: "Miami", state: "FL", zip: "33130",
      workAreas: ["Miami", "Miami Beach", "Coral Gables", "Hialeah"],
      credentialScenario: "full", profileComplete: true,
    },
    {
      name: "Aisha Patel", email: "aisha@example.com", role: "LPN" as const,
      bio: "LPN focused on pediatric home health. Bilingual English/Hindi.",
      years: 4, city: "St. Petersburg", state: "FL", zip: "33701",
      workAreas: ["St. Petersburg", "Clearwater", "Tampa"],
      credentialScenario: "full", profileComplete: true,
    },
    {
      name: "Robert Davis", email: "robert@example.com", role: "CNA" as const,
      bio: "Experienced CNA with dementia and hospice care training.",
      years: 8, city: "Chicago", state: "IL", zip: "60614",
      workAreas: ["Chicago", "Evanston", "Oak Park"],
      credentialScenario: "full", profileComplete: true,
    },
    {
      name: "Lisa Thompson", email: "lisa@example.com", role: "RN" as const,
      bio: "Critical care RN with IV therapy and ventilator management skills.",
      years: 7, city: "Houston", state: "TX", zip: "77030",
      workAreas: ["Houston", "Sugar Land", "Katy", "The Woodlands"],
      credentialScenario: "full", profileComplete: true,
    },

    // --- EXPIRED CREDENTIALS workers ---
    {
      name: "David Martinez", email: "david@example.com", role: "LPN" as const,
      bio: "Bilingual LPN (English/Spanish) in chronic disease management.",
      years: 5, city: "Los Angeles", state: "CA", zip: "90012",
      workAreas: ["Los Angeles", "Pasadena", "Burbank"],
      credentialScenario: "expired", profileComplete: true,
    },
    {
      name: "Karen Mitchell", email: "karen@example.com", role: "RN" as const,
      bio: "Experienced RN returning to home health after hospital career.",
      years: 15, city: "Atlanta", state: "GA", zip: "30308",
      workAreas: ["Atlanta", "Decatur", "Marietta"],
      credentialScenario: "expired", profileComplete: true,
    },

    // --- MISSING CREDENTIALS (pending upload) workers ---
    {
      name: "Jennifer Brooks", email: "jennifer@example.com", role: "HHA" as const,
      bio: "Caring HHA helping seniors maintain independence at home.",
      years: 3, city: "Phoenix", state: "AZ", zip: "85004",
      workAreas: ["Phoenix", "Scottsdale", "Tempe"],
      credentialScenario: "missing", profileComplete: true,
    },
    {
      name: "Marcus Johnson", email: "marcus@example.com", role: "CNA" as const,
      bio: "CNA with experience in rehabilitation and post-acute care.",
      years: 2, city: "New York", state: "NY", zip: "10001",
      workAreas: ["Manhattan", "Brooklyn", "Queens"],
      credentialScenario: "missing", profileComplete: true,
    },
    {
      name: "Priya Sharma", email: "priya@example.com", role: "RN" as const,
      bio: "BSN-prepared RN with ICU background. Relocating from India, credentials in review.",
      years: 9, city: "Seattle", state: "WA", zip: "98101",
      workAreas: ["Seattle", "Bellevue", "Redmond"],
      credentialScenario: "missing", profileComplete: true,
    },

    // --- INCOMPLETE PROFILE workers (didn't finish onboarding) ---
    {
      name: "Tony Russo", email: "tony@example.com", role: "LPN" as const,
      bio: null,
      years: null, city: "Denver", state: "CO", zip: "80202",
      workAreas: [],
      credentialScenario: "none", profileComplete: false,
    },
    {
      name: "Fatima Al-Hassan", email: "fatima@example.com", role: "CNA" as const,
      bio: null,
      years: null, city: "Dallas", state: "TX", zip: "75201",
      workAreas: [],
      credentialScenario: "none", profileComplete: false,
    },

    // --- PARTIALLY COMPLETE workers (some creds, not all) ---
    {
      name: "Chris Nguyen", email: "chris@example.com", role: "MEDICAL_ASSISTANT" as const,
      bio: "Certified MA with phlebotomy and EKG skills.",
      years: 3, city: "San Francisco", state: "CA", zip: "94102",
      workAreas: ["San Francisco", "Oakland", "Daly City"],
      credentialScenario: "partial", profileComplete: true,
    },
    {
      name: "Samantha Lee", email: "samantha@example.com", role: "COMPANION" as const,
      bio: "Compassionate companion caregiver. CPR certified, background check pending.",
      years: 1, city: "Boston", state: "MA", zip: "02108",
      workAreas: ["Boston", "Cambridge", "Somerville"],
      credentialScenario: "partial", profileComplete: true,
    },
    {
      name: "Derek Williams", email: "derek@example.com", role: "HHA" as const,
      bio: "Former EMT transitioning to home health aide. Strong clinical foundation.",
      years: 2, city: "Orlando", state: "FL", zip: "32806",
      workAreas: ["Orlando", "Kissimmee", "Winter Park"],
      credentialScenario: "partial", profileComplete: true,
    },
  ];

  const workers: { userId: string; profileId: string; role: string; city: string; state: string }[] = [];

  for (const w of workerData) {
    const isOnboarded = w.profileComplete;

    const user = await db.user.create({
      data: {
        name: w.name,
        email: w.email,
        passwordHash,
        role: "WORKER",
        onboardingCompleted: isOnboarded,
      },
    });

    const verificationDeadline = new Date(now);
    verificationDeadline.setDate(verificationDeadline.getDate() + 30);

    const profile = await db.workerProfile.create({
      data: {
        userId: user.id,
        workerRole: w.role,
        bio: w.bio,
        yearsExperience: w.years,
        city: w.city,
        state: w.state,
        zipCode: w.zip,
        workAreas: w.workAreas,
        licenseNumber: w.credentialScenario !== "none" && w.credentialScenario !== "missing"
          ? `${w.state}-${String(Math.floor(Math.random() * 90000) + 10000)}`
          : null,
        licenseState: w.credentialScenario !== "none" && w.credentialScenario !== "missing" ? w.state : null,
        licenseExpiry: w.credentialScenario === "expired"
          ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // expired 30 days ago
          : w.credentialScenario === "full" || w.credentialScenario === "partial"
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            : null,
        certifications: w.credentialScenario === "full" ? ["BLS", "CPR", "First Aid"] :
          w.credentialScenario === "partial" ? ["CPR"] :
          w.credentialScenario === "expired" ? ["BLS", "CPR"] : [],
        isAvailable: w.credentialScenario !== "none",
        profileComplete: w.profileComplete,
        serviceRadiusMiles: w.profileComplete ? 25 : null,
        verificationDeadline,
        verificationStatus: w.credentialScenario === "full" ? "verified" :
          w.credentialScenario === "expired" ? "suspended" : "pending",
      },
    });

    // --- Credentials based on scenario ---
    if (w.credentialScenario === "full") {
      await db.credential.createMany({
        data: [
          {
            workerProfileId: profile.id,
            type: "LICENSE",
            name: `${w.role} License - ${w.state}`,
            licenseNumber: `${w.state}-${Math.floor(Math.random() * 900000) + 100000}`,
            issuingAuthority: `${w.state} Department of Health`,
            issueDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
            expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000),
            status: "VERIFIED",
            verifiedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          {
            workerProfileId: profile.id,
            type: "BACKGROUND_CHECK",
            name: "Level 2 Background Check",
            issuingAuthority: `${w.state} Bureau of Investigation`,
            issueDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            expiryDate: new Date(Date.now() + 1825 * 24 * 60 * 60 * 1000),
            status: "VERIFIED",
            verifiedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          },
          {
            workerProfileId: profile.id,
            type: "CPR",
            name: "BLS/CPR Certification",
            issuingAuthority: "American Heart Association",
            issueDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
            expiryDate: new Date(Date.now() + 600 * 24 * 60 * 60 * 1000),
            status: "VERIFIED",
            verifiedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          },
          {
            workerProfileId: profile.id,
            type: "TB_TEST",
            name: "TB Skin Test",
            issuingAuthority: `${w.city} Health Department`,
            issueDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            expiryDate: new Date(Date.now() + 305 * 24 * 60 * 60 * 1000),
            status: "VERIFIED",
            verifiedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          },
        ],
      });
    } else if (w.credentialScenario === "expired") {
      await db.credential.createMany({
        data: [
          {
            workerProfileId: profile.id,
            type: "LICENSE",
            name: `${w.role} License - ${w.state} (EXPIRED)`,
            licenseNumber: `${w.state}-${Math.floor(Math.random() * 900000) + 100000}`,
            issuingAuthority: `${w.state} Department of Health`,
            issueDate: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000),
            expiryDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Expired!
            status: "EXPIRED",
          },
          {
            workerProfileId: profile.id,
            type: "BACKGROUND_CHECK",
            name: "Background Check",
            issuingAuthority: `${w.state} Bureau of Investigation`,
            issueDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
            expiryDate: new Date(Date.now() + 1400 * 24 * 60 * 60 * 1000),
            status: "VERIFIED",
            verifiedAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
          },
          {
            workerProfileId: profile.id,
            type: "CPR",
            name: "CPR Certification (EXPIRED)",
            issuingAuthority: "American Red Cross",
            issueDate: new Date(Date.now() - 800 * 24 * 60 * 60 * 1000),
            expiryDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Expired!
            status: "EXPIRED",
          },
        ],
      });
    } else if (w.credentialScenario === "missing") {
      // No credentials uploaded yet — worker needs to submit
      await db.credential.create({
        data: {
          workerProfileId: profile.id,
          type: "LICENSE",
          name: `${w.role} License - Pending Upload`,
          status: "PENDING",
          notes: "Worker has not uploaded license documentation yet.",
        },
      });
    } else if (w.credentialScenario === "partial") {
      await db.credential.createMany({
        data: [
          {
            workerProfileId: profile.id,
            type: "CPR",
            name: "CPR Certification",
            issuingAuthority: "American Heart Association",
            issueDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            expiryDate: new Date(Date.now() + 670 * 24 * 60 * 60 * 1000),
            status: "VERIFIED",
            verifiedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          {
            workerProfileId: profile.id,
            type: "LICENSE",
            name: `${w.role} License - ${w.state} (Under Review)`,
            licenseNumber: `${w.state}-${Math.floor(Math.random() * 900000) + 100000}`,
            issuingAuthority: `${w.state} Department of Health`,
            issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            expiryDate: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000),
            status: "PENDING",
            notes: "License submitted, awaiting verification.",
          },
          {
            workerProfileId: profile.id,
            type: "BACKGROUND_CHECK",
            name: "Background Check - Not Yet Submitted",
            status: "PENDING",
            notes: "Worker needs to initiate background check.",
          },
        ],
      });
    }
    // "none" scenario: no credentials at all

    workers.push({ userId: user.id, profileId: profile.id, role: w.role, city: w.city, state: w.state });
  }

  console.log(`✓ Created ${workers.length} workers across the nation`);
  console.log("  - 5 fully verified (FL, IL, TX)");
  console.log("  - 2 expired credentials (CA, GA)");
  console.log("  - 3 missing credentials (AZ, NY, WA)");
  console.log("  - 2 incomplete profiles (CO, TX)");
  console.log("  - 3 partial credentials (CA, MA, FL)");

  // ─── Shifts for Provider 1 (Sarah / Sunrise Home Health — Tampa) ──

  const p1Shifts = [
    // OPEN shifts — future, available for workers
    {
      role: "RN" as const, title: "Wound Care Visit", location: "4502 N Armenia Ave, Tampa, FL 33603",
      lat: 27.9730, lng: -82.4743,
      dayOffset: 1, startHour: 7, hours: 8, rate: 42, notes: "Patient requires wound vac changes. Must have wound care cert.",
      status: "OPEN" as const, minExp: 3,
    },
    {
      role: "CNA" as const, title: "Morning Personal Care", location: "1221 E Fowler Ave, Tampa, FL 33612",
      lat: 28.0587, lng: -82.4137,
      dayOffset: 1, startHour: 6, hours: 6, rate: 22, notes: "Assist with bathing, dressing, meal prep. Hoyer lift experience preferred.",
      status: "OPEN" as const,
    },
    {
      role: "LPN" as const, title: "Medication Management", location: "3614 W Gandy Blvd, Tampa, FL 33611",
      lat: 27.8892, lng: -82.5100,
      dayOffset: 2, startHour: 8, hours: 10, rate: 30, notes: "Insulin administration and blood sugar monitoring.",
      status: "OPEN" as const,
    },
    {
      role: "HHA" as const, title: "Companion & Light Housekeeping", location: "8901 N Dale Mabry Hwy, Tampa, FL 33614",
      lat: 28.0255, lng: -82.5065,
      dayOffset: 2, startHour: 9, hours: 4, rate: 18, notes: "Elderly patient. Light cooking, companionship, medication reminders.",
      status: "OPEN" as const,
    },
    {
      role: "RN" as const, title: "IV Infusion — Home Visit", location: "5210 W Spruce St, Tampa, FL 33607",
      lat: 27.9478, lng: -82.4939,
      dayOffset: 3, startHour: 10, hours: 3, rate: 50, notes: "Antibiotic IV infusion. PICC line access required. Must have IV cert.",
      status: "OPEN" as const, minExp: 5,
    },
    {
      role: "CNA" as const, title: "Overnight Care", location: "2103 S Manhattan Ave, Tampa, FL 33629",
      lat: 27.9275, lng: -82.4910,
      dayOffset: 3, startHour: 22, hours: 8, rate: 26, notes: "Fall risk patient. Nighttime monitoring and repositioning q2h.",
      status: "OPEN" as const,
    },
    // ASSIGNED shifts
    {
      role: "CNA" as const, title: "Daily Living Assistance", location: "901 W Platt St, Tampa, FL 33606",
      lat: 27.9398, lng: -82.4677,
      dayOffset: 1, startHour: 8, hours: 8, rate: 24, notes: null,
      status: "ASSIGNED" as const, assignWorkerIndex: 0, // Maria Garcia
    },
    {
      role: "LPN" as const, title: "Post-Surgical Monitoring", location: "3112 W Azeele St, Tampa, FL 33609",
      lat: 27.9363, lng: -82.4901,
      dayOffset: 2, startHour: 7, hours: 12, rate: 32, notes: "Hip replacement recovery. Vitals q4h, PT exercises.",
      status: "ASSIGNED" as const, assignWorkerIndex: 2, // Aisha Patel
    },
    // COMPLETED shifts (past)
    {
      role: "RN" as const, title: "Discharge Assessment", location: "6801 N Florida Ave, Tampa, FL 33604",
      lat: 27.9915, lng: -82.4590,
      dayOffset: -2, startHour: 9, hours: 4, rate: 45, notes: "Post-hospital discharge assessment complete.",
      status: "COMPLETED" as const, assignWorkerIndex: 1, // James Wilson
    },
    {
      role: "HHA" as const, title: "Weekend Companion Care", location: "4401 W Boy Scout Blvd, Tampa, FL 33607",
      lat: 27.9509, lng: -82.5230,
      dayOffset: -4, startHour: 8, hours: 6, rate: 19, notes: null,
      status: "COMPLETED" as const, assignWorkerIndex: 14, // Derek Williams
    },
  ];

  for (const s of p1Shifts) {
    const startTime = new Date(now);
    startTime.setDate(startTime.getDate() + s.dayOffset);
    startTime.setHours(s.startHour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + s.hours);

    const assignedWorker = 'assignWorkerIndex' in s && s.assignWorkerIndex !== undefined
      ? workers[s.assignWorkerIndex] : null;

    const shift = await db.shift.create({
      data: {
        providerId: provider1.id,
        role: s.role,
        title: s.title,
        location: s.location,
        latitude: s.lat,
        longitude: s.lng,
        startTime,
        endTime,
        payRate: s.rate,
        notes: s.notes,
        status: s.status,
        minExperience: 'minExp' in s ? (s.minExp as number) : null,
        assignedWorkerId: assignedWorker?.userId ?? null,
      },
    });

    if (assignedWorker && (s.status === "ASSIGNED" || s.status === "COMPLETED")) {
      await db.assignment.create({
        data: {
          shiftId: shift.id,
          workerProfileId: assignedWorker.profileId,
          status: s.status === "COMPLETED" ? "CONFIRMED" : "ACCEPTED",
        },
      });

      // Create ShiftPayment for completed shifts
      if (s.status === "COMPLETED") {
        const shiftAmount = Math.round(s.hours * s.rate * 100) / 100;
        const platformFee = Math.round(Math.max(shiftAmount * 0.10, 2.00) * 100) / 100;
        const workerPayout = Math.round((shiftAmount - platformFee) * 100) / 100;
        await db.shiftPayment.create({
          data: {
            shiftId: shift.id,
            providerId: provider1.id,
            workerId: assignedWorker.userId,
            shiftAmount,
            platformFee,
            workerPayout,
            fundingStatus: "COMPLETED",
            payoutStatus: "AVAILABLE",
            fundedAt: startTime,
            completedAt: endTime,
          },
        });
        await db.transaction.create({
          data: {
            type: "SHIFT_FUNDING",
            status: "COMPLETED",
            amount: shiftAmount,
            platformFee,
            netAmount: workerPayout,
            shiftId: shift.id,
            providerId: provider1.id,
            workerId: assignedWorker.userId,
            description: `Shift completed: ${s.title}`,
            processedAt: endTime,
          },
        });
      }
    }
  }

  console.log("✓ Created 10 shifts for Sarah (Sunrise Home Health)");

  // ─── Shifts for Provider 2 (Michael / Humanity & Blessing — Orlando) ──

  const p2Shifts = [
    // OPEN shifts
    {
      role: "CNA" as const, title: "Morning ADL Assistance", location: "221 E Colonial Dr, Orlando, FL 32801",
      lat: 28.5480, lng: -81.3772,
      dayOffset: 1, startHour: 7, hours: 6, rate: 20, notes: "Two-person assist for transfers. Patient is 280 lbs.",
      status: "OPEN" as const,
    },
    {
      role: "RN" as const, title: "Pediatric Home Nursing", location: "4100 S Orange Ave, Orlando, FL 32806",
      lat: 28.5153, lng: -81.3790,
      dayOffset: 1, startHour: 15, hours: 8, rate: 44, notes: "Trach/vent pediatric patient. Must have peds experience.",
      status: "OPEN" as const, minExp: 3,
    },
    {
      role: "LPN" as const, title: "Insulin & Wound Check", location: "1505 W Church St, Orlando, FL 32805",
      lat: 28.5393, lng: -81.3951,
      dayOffset: 2, startHour: 8, hours: 4, rate: 28, notes: "Diabetic wound on left foot. Check and redress.",
      status: "OPEN" as const,
    },
    {
      role: "HHA" as const, title: "Respite Care — Saturday", location: "9201 International Dr, Orlando, FL 32819",
      lat: 28.4358, lng: -81.4703,
      dayOffset: 4, startHour: 9, hours: 8, rate: 19, notes: "Family respite. Patient has early-stage Alzheimer's.",
      status: "OPEN" as const,
    },
    {
      role: "CNA" as const, title: "Evening Routine Care", location: "3001 Corrine Dr, Orlando, FL 32803",
      lat: 28.5608, lng: -81.3537,
      dayOffset: 3, startHour: 17, hours: 5, rate: 23, notes: null,
      status: "OPEN" as const,
    },
    // ASSIGNED
    {
      role: "RN" as const, title: "Weekly Vitals & Assessment", location: "800 N Mills Ave, Orlando, FL 32803",
      lat: 28.5563, lng: -81.3599,
      dayOffset: 1, startHour: 10, hours: 3, rate: 40, notes: "CHF patient — weekly weight, BP, lung sounds.",
      status: "ASSIGNED" as const, assignWorkerIndex: 4, // Lisa Thompson (Houston — traveling nurse scenario)
    },
    // COMPLETED
    {
      role: "CNA" as const, title: "Discharge Follow-Up", location: "1414 Kuhl Ave, Orlando, FL 32806",
      lat: 28.5224, lng: -81.3778,
      dayOffset: -1, startHour: 9, hours: 6, rate: 22, notes: null,
      status: "COMPLETED" as const, assignWorkerIndex: 14, // Derek Williams (Orlando local)
    },
    // CANCELLED
    {
      role: "LPN" as const, title: "Cancelled — Patient Hospitalized", location: "505 W Central Blvd, Orlando, FL 32801",
      lat: 28.5407, lng: -81.3875,
      dayOffset: -3, startHour: 7, hours: 8, rate: 29, notes: "Patient admitted to ER. Shift cancelled.",
      status: "CANCELLED" as const,
    },
  ];

  for (const s of p2Shifts) {
    const startTime = new Date(now);
    startTime.setDate(startTime.getDate() + s.dayOffset);
    startTime.setHours(s.startHour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + s.hours);

    const assignedWorker = 'assignWorkerIndex' in s && s.assignWorkerIndex !== undefined
      ? workers[s.assignWorkerIndex] : null;

    const shift = await db.shift.create({
      data: {
        providerId: provider2.id,
        role: s.role,
        title: s.title,
        location: s.location,
        latitude: s.lat,
        longitude: s.lng,
        startTime,
        endTime,
        payRate: s.rate,
        notes: s.notes,
        status: s.status,
        minExperience: 'minExp' in s ? (s.minExp as number) : null,
        assignedWorkerId: assignedWorker?.userId ?? null,
      },
    });

    if (assignedWorker && (s.status === "ASSIGNED" || s.status === "COMPLETED")) {
      await db.assignment.create({
        data: {
          shiftId: shift.id,
          workerProfileId: assignedWorker.profileId,
          status: s.status === "COMPLETED" ? "CONFIRMED" : "ACCEPTED",
        },
      });

      if (s.status === "COMPLETED") {
        const shiftAmount = Math.round(s.hours * s.rate * 100) / 100;
        const platformFee = Math.round(Math.max(shiftAmount * 0.10, 2.00) * 100) / 100;
        const workerPayout = Math.round((shiftAmount - platformFee) * 100) / 100;
        await db.shiftPayment.create({
          data: {
            shiftId: shift.id,
            providerId: provider2.id,
            workerId: assignedWorker.userId,
            shiftAmount,
            platformFee,
            workerPayout,
            fundingStatus: "COMPLETED",
            payoutStatus: "AVAILABLE",
            fundedAt: startTime,
            completedAt: endTime,
          },
        });
        await db.transaction.create({
          data: {
            type: "SHIFT_FUNDING",
            status: "COMPLETED",
            amount: shiftAmount,
            platformFee,
            netAmount: workerPayout,
            shiftId: shift.id,
            providerId: provider2.id,
            workerId: assignedWorker.userId,
            description: `Shift completed: ${s.title}`,
            processedAt: endTime,
          },
        });
      }
    }
  }

  console.log("✓ Created 8 shifts for Michael (Humanity & Blessing)");

  // ─── Usage Tracking ─────────────────────────────────────────────

  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  await db.usageTracking.create({
    data: {
      providerProfileId: provider1Profile.id,
      periodStart,
      periodEnd,
      shiftsPosted: 10,
      shiftsAssigned: 4,
      workerUnlocks: 6,
    },
  });

  await db.usageTracking.create({
    data: {
      providerProfileId: provider2Profile.id,
      periodStart,
      periodEnd,
      shiftsPosted: 8,
      shiftsAssigned: 2,
      workerUnlocks: 1,
    },
  });

  // ─── Notifications ──────────────────────────────────────────────

  await db.notification.createMany({
    data: [
      { userId: provider1.id, title: "Shift Accepted", body: "Maria Garcia accepted your Daily Living Assistance shift.", type: "shift_update" },
      { userId: provider1.id, title: "Shift Completed", body: "James Wilson completed the Discharge Assessment shift.", type: "shift_update" },
      { userId: provider2.id, title: "Shift Accepted", body: "Lisa Thompson accepted your Weekly Vitals & Assessment shift.", type: "shift_update" },
      { userId: workers[0].userId, title: "New Shift Available", body: "6 new CNA shifts are available near Tampa, FL.", type: "shift_available" },
      { userId: workers[5].userId, title: "Credential Expired", body: "Your LPN License has expired. Please renew to continue accepting shifts.", type: "credential_alert" },
      { userId: workers[6].userId, title: "Credential Expired", body: "Your RN License and CPR certification have expired.", type: "credential_alert" },
      { userId: workers[7].userId, title: "Upload Credentials", body: "Please upload your license to start accepting shifts.", type: "credential_alert" },
    ],
  });

  console.log("✓ Created usage tracking & notifications");

  // ─── Platform Config ──────────────────────────────────────────

  await db.platformConfig.upsert({
    where: { id: "default" },
    create: { id: "default", platformFeeRate: 0.10, minPlatformFee: 2.00, payoutDelayHours: 48 },
    update: { platformFeeRate: 0.10, minPlatformFee: 2.00, payoutDelayHours: 48 },
  });

  console.log("✓ Created platform config (10% fee, $2 min)");

  // ─── Ratings for Completed Shifts ─────────────────────────────

  const completedShifts = await db.shift.findMany({
    where: { status: "COMPLETED", assignedWorkerId: { not: null } },
    select: { id: true, providerId: true, assignedWorkerId: true },
  });

  const workerComments = [
    "Great facility, will work here again.",
    "Professional and organized.",
    "Friendly staff, good experience.",
    "Clear instructions, smooth shift.",
    null,
  ];
  const employerComments = [
    "Reliable and skilled.",
    "Excellent patient care.",
    "On time and professional.",
    "Would hire again.",
    null,
  ];
  const ratingScores = [4, 4, 5, 5, 5];

  for (const cs of completedShifts) {
    // Worker rates employer
    await db.rating.create({
      data: {
        shiftId: cs.id,
        raterId: cs.assignedWorkerId!,
        rateeId: cs.providerId,
        score: ratingScores[Math.floor(Math.random() * ratingScores.length)],
        comment: workerComments[Math.floor(Math.random() * workerComments.length)],
      },
    });
    // Employer rates worker
    await db.rating.create({
      data: {
        shiftId: cs.id,
        raterId: cs.providerId,
        rateeId: cs.assignedWorkerId!,
        score: ratingScores[Math.floor(Math.random() * ratingScores.length)],
        comment: employerComments[Math.floor(Math.random() * employerComments.length)],
      },
    });
  }

  console.log(`✓ Created ratings for ${completedShifts.length} completed shifts\n`);

  // ─── Summary ────────────────────────────────────────────────────

  console.log("═══════════════════════════════════════════════════════");
  console.log(" SEED COMPLETE — All accounts use password: password123");
  console.log("═══════════════════════════════════════════════════════\n");

  console.log("PROVIDERS:");
  console.log("  sarah@sunrisehealth.com    — STARTER plan, AGENCY, Tampa FL (10 shifts)");
  console.log("  michael@humanityhealth.com — FREE plan, PRIVATE, Orlando FL (8 shifts)\n");

  console.log("WORKERS — Fully Verified:");
  console.log("  maria@example.com     — CNA, Tampa FL       (assigned to shift)");
  console.log("  james@example.com     — RN,  Miami FL       (completed a shift)");
  console.log("  aisha@example.com     — LPN, St. Petersburg FL (assigned to shift)");
  console.log("  robert@example.com    — CNA, Chicago IL");
  console.log("  lisa@example.com      — RN,  Houston TX     (assigned in Orlando)\n");

  console.log("WORKERS — Expired Credentials:");
  console.log("  david@example.com     — LPN, Los Angeles CA (license + CPR expired)");
  console.log("  karen@example.com     — RN,  Atlanta GA     (license + CPR expired)\n");

  console.log("WORKERS — Missing Credentials:");
  console.log("  jennifer@example.com  — HHA, Phoenix AZ     (nothing uploaded)");
  console.log("  marcus@example.com    — CNA, New York NY    (nothing uploaded)");
  console.log("  priya@example.com     — RN,  Seattle WA     (nothing uploaded)\n");

  console.log("WORKERS — Incomplete Profile (didn't finish onboarding):");
  console.log("  tony@example.com      — LPN, Denver CO");
  console.log("  fatima@example.com    — CNA, Dallas TX\n");

  console.log("WORKERS — Partial Credentials:");
  console.log("  chris@example.com     — MA,  San Francisco CA (CPR verified, license pending)");
  console.log("  samantha@example.com  — COMPANION, Boston MA  (CPR verified, rest pending)");
  console.log("  derek@example.com     — HHA, Orlando FL       (CPR verified, rest pending)\n");
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
