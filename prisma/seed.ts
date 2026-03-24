import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding ShiftCare database...\n");

  // Clean existing data
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
      companyName: "Sunrise Home Health",
      description: "Compassionate home health services across Tampa Bay since 2015.",
      address: "2121 W Oak Ave",
      city: "Tampa",
      state: "FL",
      zipCode: "33607",
      phone: "813-555-0100",
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

  console.log("Created providers");

  // ─── Workers ────────────────────────────────────────────────────

  const workerData = [
    { name: "Maria Garcia", email: "maria@example.com", role: "CNA" as const, bio: "Dedicated CNA with 6 years experience in home health.", years: 6, city: "Tampa", state: "FL", zip: "33612", rate: 22 },
    { name: "James Wilson", email: "james@example.com", role: "RN" as const, bio: "RN specializing in wound care and post-surgical recovery.", years: 12, city: "Tampa", state: "FL", zip: "33609", rate: 38 },
    { name: "Aisha Patel", email: "aisha@example.com", role: "LPN" as const, bio: "LPN focused on pediatric home health. Bilingual English/Hindi.", years: 4, city: "St. Petersburg", state: "FL", zip: "33701", rate: 28 },
    { name: "Robert Davis", email: "robert@example.com", role: "CNA" as const, bio: "Experienced CNA with dementia and hospice care training.", years: 8, city: "Clearwater", state: "FL", zip: "33755", rate: 24 },
    { name: "Lisa Thompson", email: "lisa@example.com", role: "RN" as const, bio: "Critical care RN with IV therapy and ventilator skills.", years: 7, city: "Orlando", state: "FL", zip: "32803", rate: 42 },
    { name: "David Martinez", email: "david@example.com", role: "LPN" as const, bio: "Bilingual LPN (English/Spanish) in chronic disease management.", years: 5, city: "Kissimmee", state: "FL", zip: "34741", rate: 30 },
    { name: "Jennifer Brooks", email: "jennifer@example.com", role: "HHA" as const, bio: "Caring HHA helping seniors maintain independence at home.", years: 3, city: "Brandon", state: "FL", zip: "33511", rate: 18 },
  ];

  const workers: { userId: string; profileId: string }[] = [];

  for (const w of workerData) {
    const user = await db.user.create({
      data: {
        name: w.name,
        email: w.email,
        passwordHash,
        role: "WORKER",
        onboardingCompleted: true,
      },
    });

    const profile = await db.workerProfile.create({
      data: {
        userId: user.id,
        workerRole: w.role,
        bio: w.bio,
        yearsExperience: w.years,
        city: w.city,
        state: w.state,
        zipCode: w.zip,
        hourlyRate: w.rate,
        licenseNumber: `FL-${String(Math.floor(Math.random() * 90000) + 10000)}`,
        licenseState: "FL",
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        certifications: ["BLS", "CPR"],
        isAvailable: true,
        profileComplete: true,
        serviceRadiusMiles: 25,
      },
    });

    // Add verified credential
    await db.credential.create({
      data: {
        workerProfileId: profile.id,
        type: "LICENSE",
        name: `${w.role} License - Florida`,
        licenseNumber: `FL-${Math.floor(Math.random() * 900000) + 100000}`,
        issuingAuthority: "Florida Department of Health",
        issueDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000),
        status: "VERIFIED",
        verifiedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    });

    await db.credential.create({
      data: {
        workerProfileId: profile.id,
        type: "BACKGROUND_CHECK",
        name: "Level 2 Background Check",
        issuingAuthority: "FDLE",
        issueDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(Date.now() + 1825 * 24 * 60 * 60 * 1000),
        status: "VERIFIED",
        verifiedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
    });

    workers.push({ userId: user.id, profileId: profile.id });
  }

  console.log(`Created ${workers.length} workers with credentials`);

  // ─── Shifts ─────────────────────────────────────────────────────

  const now = new Date();
  const roles = ["RN", "LPN", "CNA", "HHA", "CNA", "RN", "LPN", "HHA", "CNA", "RN"] as const;
  const locations = [
    "123 Oak St, Tampa FL",
    "456 Pine Ave, Tampa FL",
    "789 Elm Rd, St. Petersburg FL",
    "500 Main St, Orlando FL",
    "321 Maple Dr, Clearwater FL",
  ];

  const shifts: { id: string; providerId: string }[] = [];

  // Future open shifts (available for workers)
  for (let i = 0; i < 8; i++) {
    const dayOffset = 1 + Math.floor(i / 2);
    const startHour = i % 2 === 0 ? 7 : 14;
    const startTime = new Date(now);
    startTime.setDate(startTime.getDate() + dayOffset);
    startTime.setHours(startHour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + (i % 2 === 0 ? 8 : 6));

    const shift = await db.shift.create({
      data: {
        providerId: i < 5 ? provider1.id : provider2.id,
        role: roles[i],
        title: startHour === 7 ? "Morning Shift" : "Afternoon Shift",
        location: locations[i % locations.length],
        startTime,
        endTime,
        payRate: 20 + Math.floor(Math.random() * 25),
        status: "OPEN",
        notes: i === 0 ? "Must have wound care experience." : null,
      },
    });
    shifts.push({ id: shift.id, providerId: shift.providerId });
  }

  // Some assigned shifts
  for (let i = 0; i < 3; i++) {
    const startTime = new Date(now);
    startTime.setDate(startTime.getDate() + i + 1);
    startTime.setHours(8, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(16, 0, 0, 0);

    const shift = await db.shift.create({
      data: {
        providerId: provider1.id,
        role: roles[i],
        title: "Day Shift",
        location: locations[i],
        startTime,
        endTime,
        payRate: 30 + i * 5,
        status: "ASSIGNED",
        assignedWorkerId: workers[i].userId,
      },
    });

    await db.assignment.create({
      data: {
        shiftId: shift.id,
        workerProfileId: workers[i].profileId,
        status: "ACCEPTED",
      },
    });
  }

  // Some completed shifts
  for (let i = 0; i < 2; i++) {
    const startTime = new Date(now);
    startTime.setDate(startTime.getDate() - (i + 1));
    startTime.setHours(7, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(15, 0, 0, 0);

    const shift = await db.shift.create({
      data: {
        providerId: provider1.id,
        role: roles[i + 3],
        title: "Completed Shift",
        location: locations[i],
        startTime,
        endTime,
        payRate: 28,
        status: "COMPLETED",
        assignedWorkerId: workers[i + 3].userId,
      },
    });

    await db.assignment.create({
      data: {
        shiftId: shift.id,
        workerProfileId: workers[i + 3].profileId,
        status: "CONFIRMED",
      },
    });
  }

  console.log("Created shifts and assignments");

  // ─── Usage Tracking ─────────────────────────────────────────────

  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  await db.usageTracking.create({
    data: {
      providerProfileId: provider1Profile.id,
      periodStart,
      periodEnd,
      shiftsPosted: 13,
      shiftsAssigned: 5,
      workerUnlocks: 3,
    },
  });

  await db.usageTracking.create({
    data: {
      providerProfileId: provider2Profile.id,
      periodStart,
      periodEnd,
      shiftsPosted: 2,
      shiftsAssigned: 0,
      workerUnlocks: 0,
    },
  });

  console.log("Created usage tracking");

  // ─── Notifications ──────────────────────────────────────────────

  await db.notification.createMany({
    data: [
      { userId: provider1.id, title: "Shift Accepted", message: "Maria Garcia accepted your Morning Shift.", type: "shift_update", link: "/provider/dashboard" },
      { userId: workers[0].userId, title: "New Shift Available", message: "A new CNA shift is available in Tampa.", type: "shift_available", link: "/worker/shifts" },
    ],
  });

  console.log("\nSeed complete!\n");
  console.log("Demo accounts (password: password123):");
  console.log("  Provider: sarah@sunrisehealth.com (Starter plan)");
  console.log("  Provider: michael@humanityhealth.com (Free plan)");
  console.log("  Workers:  maria@example.com (CNA), james@example.com (RN)");
  console.log("            aisha@example.com (LPN), robert@example.com (CNA)");
  console.log("            lisa@example.com (RN), david@example.com (LPN)");
  console.log("            jennifer@example.com (HHA)");
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
