import {
  Decision,
  CostBreakdown,
  RevenueSecondOrder,
  TeamSecondOrder,
  SprintSecondOrder,
  ReclaimStatus,
} from './types';

// ── Constants ────────────────────────────────────────────
const WORK_DAYS_MONTH = 22;
const WORK_HRS_DAY    = 8;
const WORK_SECS_MONTH = WORK_DAYS_MONTH * WORK_HRS_DAY * 3600;

// ── Ramp Rate ────────────────────────────────────────────
// Ramp rate for month M with Q-quarter ramp schedule
// 3Q ramp: Q1=25%, Q2=50%, Q3=75%, Q4+=100%
export function rampPct(monthsIn: number, rampQ: number): number {
  const q = Math.floor(monthsIn / 3);
  if (q >= rampQ) return 1.0;
  return (q + 1) / (rampQ + 1);
}

// ── Date/Rate Helpers ────────────────────────────────────
export function daysApart(a: string, b: string): number {
  return Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function dayRate(monthly: number): number {
  return monthly / WORK_DAYS_MONTH;
}

export function hourRate(monthly: number): number {
  return monthly / WORK_DAYS_MONTH / WORK_HRS_DAY;
}

// Returns per-millisecond rate for live counter
export function msRate(monthly: number): number {
  return monthly / WORK_SECS_MONTH / 1000;
}

// ── Sprint Delay Cost Calculation ────────────────────────
export function calcSprintCosts(so: SprintSecondOrder): CostBreakdown {
  const direct = so.teamSize * so.avgSalary;      // Layer 1: team salary/mo
  const opp = so.expectedRevenue;                  // Layer 2: GTM revenue delay/mo
  const cascade = 0;

  const totalWeeks = so.delays.reduce((s, d) => s + d.weeksDelayed, 0);
  const totalMonthlyRate = direct + opp;
  const weeklyRate = totalMonthlyRate / 4.33;

  // If delivered, costs stop accruing
  const delivered = !!so.deliveredDate;

  const totalMonthly = delivered ? 0 : totalMonthlyRate;

  // Accrued: totalWeeksDelayed × weeklyRate
  // Early delivery: if deliveredDate < originalTargetDate, accrued goes negative
  let accrued: number;
  if (delivered && so.deliveredDate) {
    const deliveredMs = new Date(so.deliveredDate).getTime();
    const targetMs = new Date(so.originalTargetDate).getTime();
    const diffWeeks = (deliveredMs - targetMs) / (7 * 86400000);
    // diffWeeks < 0 means early delivery → negative accrued (savings)
    // diffWeeks > 0 means late delivery → positive accrued
    accrued = diffWeeks * weeklyRate;
  } else {
    accrued = totalWeeks * weeklyRate;
  }

  return { direct, opp, cascade, totalMonthly, accrued };
}

// ── Cost Calculation Engine ──────────────────────────────
export function calcCosts(decision: Decision): CostBreakdown {
  const so = decision.secondOrder;

  // Sprint delay uses its own calculation engine
  if (so?.type === 'sprint_delay') {
    return calcSprintCosts(so);
  }

  const today = new Date().toISOString().split('T')[0];
  const dd    = daysApart(decision.startDate, today);
  const md    = dd / 30;

  const direct = decision.monthlyCost || 0;

  // Layer 2: Opportunity (Revenue Role)
  let opp = 0;
  if (so?.type === 'revenue_role' && so.quota) {
    const fullMonthly = (so.quota * so.attainRate) / 12;
    opp = fullMonthly * rampPct(md, so.rampQ);
  }

  // Layer 3: Cascade (Team Drag)
  let cascade = 0;
  if (so?.type === 'team_blocker' && so.teamSize) {
    const teamDrag = so.teamSize * so.avgSalary * so.dragPct;
    const attrRisk = (so.attrProb * so.replaceCost) / 12;
    cascade = teamDrag + attrRisk;
  }

  const totalMonthly = direct + opp + cascade;

  // Historical Accrued (ramp-aware for revenue roles)
  let accrued = dd * dayRate(direct + cascade);

  if (so?.type === 'revenue_role' && so.quota) {
    const fullMonthly = (so.quota * so.attainRate) / 12;
    const fullMs = Math.floor(md);
    let oppAccrued = 0;
    for (let m = 0; m < fullMs; m++) {
      oppAccrued += fullMonthly * rampPct(m, so.rampQ);
    }
    oppAccrued += fullMonthly * rampPct(fullMs, so.rampQ) * (md - fullMs);
    accrued += oppAccrued;
  } else {
    accrued += dd * dayRate(opp);
  }

  return { direct, opp, cascade, totalMonthly, accrued };
}

// ── Revenue Role Projection ─────────────────────────────
export function revenueProjection(so: RevenueSecondOrder) {
  const annualExpected = so.quota * so.attainRate;
  const fullMonthly   = annualExpected / 12;
  const year1 = Array.from({ length: 12 }, (_, m) =>
    fullMonthly * rampPct(m, so.rampQ)
  ).reduce((a, b) => a + b, 0);

  return { annualExpected, fullMonthly, year1 };
}

// ── Cascade Breakdown ────────────────────────────────────
export function cascadeBreakdown(so: TeamSecondOrder) {
  const teamDrag = so.teamSize * so.avgSalary * so.dragPct;
  const attrRisk = (so.attrProb * so.replaceCost) / 12;
  return { teamDrag, attrRisk, total: teamDrag + attrRisk };
}

// ── Reclaim Status ───────────────────────────────────────
export function getReclaimStatus(decision: Decision): ReclaimStatus {
  const r = decision.reclaim;
  if (!r?.enabled || !r?.targetDate) return null;

  const today = new Date().toISOString().split('T')[0];
  const costs = calcCosts(decision);
  const dr    = dayRate(costs.totalMonthly);

  if (r.resolvedDate) {
    const early = daysApart(r.resolvedDate, r.targetDate);
    const late  = daysApart(r.targetDate, r.resolvedDate);
    if (early > 0) return { status: 'saved', daysEarly: early, delta: early * dr };
    if (late  > 0) return { status: 'late',  daysLate:  late,  delta: late  * dr };
    return { status: 'on_time' };
  }

  const isOverdue = new Date(r.targetDate) < new Date(today);
  if (isOverdue) {
    const d = daysApart(r.targetDate, today);
    return { status: 'overdue', daysOverdue: d, extra: d * dr };
  }

  const d = daysApart(today, r.targetDate);
  if (d <= 7) return { status: 'at_risk', daysRemaining: d };
  return { status: 'on_track', daysRemaining: d, savings: d * dr };
}

// ── Formatting Helpers ───────────────────────────────────
export function fmt$(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.round(Math.abs(n)).toLocaleString()}`;
}

export function fmtM(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.round(Math.abs(n)).toLocaleString()}/mo`;
}
