import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

async function main() {
  console.log('Seeding database...');
  await prisma.decision.deleteMany();

  await prisma.decision.create({
    data: {
      type: 'revenue_role',
      title: 'AE \u2014 Enterprise West',
      note: 'Territory has been uncovered since Q4. Pipeline is decaying.',
      monthlyCost: 0,
      startDate: daysAgo(47),
      secondOrder: JSON.stringify({ type: 'revenue_role', quota: 1200000, attainRate: 0.70, rampQ: 3 }),
      reclaim: JSON.stringify({ enabled: true, targetDate: daysFromNow(60), resolvedDate: null }),
    },
  });

  await prisma.decision.create({
    data: {
      type: 'team_drag',
      title: 'Senior Engineer \u2014 Platform Team',
      note: 'Blocking 3 other engineers on critical path. PR reviews stacking up.',
      monthlyCost: 22000,
      startDate: daysAgo(30),
      secondOrder: JSON.stringify({ type: 'team_blocker', teamSize: 4, avgSalary: 15000, dragPct: 0.25, attrProb: 0.30, replaceCost: 150000 }),
      reclaim: JSON.stringify({ enabled: true, targetDate: daysFromNow(45), resolvedDate: null }),
    },
  });

  await prisma.decision.create({
    data: {
      type: 'delayed_hire',
      title: 'VP of Engineering',
      note: 'Role approved in budget but stuck in final interview stage for 2 months.',
      monthlyCost: 25000,
      startDate: daysAgo(60),
      secondOrder: null,
      reclaim: JSON.stringify({ enabled: true, targetDate: daysFromNow(30), resolvedDate: null }),
    },
  });

  await prisma.decision.create({
    data: {
      type: 'tool_waste',
      title: 'Salesforce \u2014 12 Unused Seats',
      note: 'Identified during license audit. No active logins in 90+ days.',
      monthlyCost: 3600,
      startDate: daysAgo(90),
      secondOrder: null,
      reclaim: JSON.stringify({ enabled: false, targetDate: '', resolvedDate: null }),
    },
  });

  await prisma.decision.create({
    data: {
      type: 'vendor_cost',
      title: 'Legacy Data Warehouse',
      note: 'Contract auto-renewed at 15% above market rate. Migration plan drafted.',
      monthlyCost: 8500,
      startDate: daysAgo(120),
      secondOrder: null,
      reclaim: JSON.stringify({ enabled: true, targetDate: daysFromNow(15), resolvedDate: null }),
    },
  });

  console.log('Seeded 5 decisions successfully.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
