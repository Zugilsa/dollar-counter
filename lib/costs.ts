import {
  Decision,
  CostBreakdown,
  RevenueSecondOrder,
  TeamSecondOrder,
  SprintSecondOrder,
  MeetingSecondOrder,
  EngTimeSecondOrder,
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
export function calcSprintCosts(so: SprintSecondOrder, resolved = false): CostBreakdown {
  const direct = so.teamSize * so.avgSalary;      // Layer 1: team salary/mo
  const opp = so.expectedRevenue;                  // Layer 2: GTM revenue delay/mo
  const cascade = 0;

  const totalWeeks = so.delays.reduce((s, d) => s + d.weeksDelayed, 0);
  const totalMonthlyRate = direct + opp;
  const weeklyRate = totalMonthlyRate / 4.33;

  // If delivered or resolved, costs stop accruing
  const delivered = !!so.deliveredDate;

  const totalMonthly = (delivered || resolved) ? 0 : totalMonthlyRate;

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

// ── Meeting Waste Cost Calculation ───────────────────────
export function calcMeetingCosts(so: MeetingSecondOrder, startDate: string, endDate?: string, resolved = false): CostBreakdown {
  const minutesSaved = so.originalMinutes - so.optimizedMinutes;
  const totalHourlyCost = so.attendees.reduce((s, a) => s + a.hourlyCost * a.count, 0);
  const savingsPerMeeting = (minutesSaved / 60) * totalHourlyCost;
  const monthlySavings = savingsPerMeeting * so.frequencyPerWeek * 4.33;

  // Negative = green savings
  const direct = -monthlySavings;
  const monthlyRate = direct;
  const totalMonthly = resolved ? 0 : monthlyRate;

  const end = endDate || new Date().toISOString().split('T')[0];
  const dd = daysApart(startDate, end);
  const accrued = dd * dayRate(monthlyRate);

  return { direct, opp: 0, cascade: 0, totalMonthly, accrued };
}

// ── Eng Time Allocation Cost Calculation ─────────────────
export function calcEngTimeCosts(so: EngTimeSecondOrder, startDate: string, endDate?: string, resolved = false): CostBreakdown {
  const totalTeamCost = so.engineerCount * so.avgMonthlyCost;
  const currentNonCoding = 1 - so.currentCodingPct;
  const targetNonCoding = 1 - so.targetCodingPct;
  const wastedPct = currentNonCoding - targetNonCoding;
  // Savings from moving from current to target coding %
  const monthlySavings = totalTeamCost * wastedPct;

  const direct = -monthlySavings; // negative = green savings
  const monthlyRate = direct;
  const totalMonthly = resolved ? 0 : monthlyRate;

  const end = endDate || new Date().toISOString().split('T')[0];
  const dd = daysApart(startDate, end);
  const accrued = dd * dayRate(monthlyRate);

  return { direct, opp: 0, cascade: 0, totalMonthly, accrued };
}

// ── Resolution-aware end date ────────────────────────────
// If a decision has been resolved, costs freeze at the resolution date
function effectiveEndDate(decision: Decision): string {
  const today = new Date().toISOString().split('T')[0];
  const resolved = decision.reclaim?.resolvedDate;
  if (resolved && resolved < today) return resolved;
  return today;
}

// Is this decision resolved (costs should stop accruing)?
export function isResolved(decision: Decision): boolean {
  return !!decision.reclaim?.resolvedDate;
}

// ── Cost Calculation Engine ──────────────────────────────
export function calcCosts(decision: Decision): CostBreakdown {
  const so = decision.secondOrder;
  const resolved = isResolved(decision);

  // Sprint delay uses its own calculation engine
  if (so?.type === 'sprint_delay') {
    return calcSprintCosts(so, resolved);
  }

  // Meeting waste: savings (negative costs)
  if (so?.type === 'meeting_waste') {
    return calcMeetingCosts(so, decision.startDate, effectiveEndDate(decision), resolved);
  }

  // Eng time allocation: savings (negative costs)
  if (so?.type === 'eng_time') {
    return calcEngTimeCosts(so, decision.startDate, effectiveEndDate(decision), resolved);
  }

  const endDate = effectiveEndDate(decision);
  const dd    = daysApart(decision.startDate, endDate);
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

  // If resolved, monthly rate drops to 0 (no longer accruing)
  const monthlyRate = direct + opp + cascade;
  const totalMonthly = resolved ? 0 : monthlyRate;

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

// ── Reclaim: compute the monthly rate as if the decision were still active ──
// (needed because calcCosts returns totalMonthly=0 for resolved decisions)
export function activeMonthlyRate(decision: Decision): number {
  const so = decision.secondOrder;
  if (so?.type === 'sprint_delay') {
    return so.teamSize * so.avgSalary + so.expectedRevenue;
  }
  if (so?.type === 'meeting_waste') {
    const minutesSaved = so.originalMinutes - so.optimizedMinutes;
    const totalHourlyCost = so.attendees.reduce((s, a) => s + a.hourlyCost * a.count, 0);
    return -((minutesSaved / 60) * totalHourlyCost * so.frequencyPerWeek * 4.33);
  }
  if (so?.type === 'eng_time') {
    const teamCost = so.engineerCount * so.avgMonthlyCost;
    const wastedPct = (1 - so.currentCodingPct) - (1 - so.targetCodingPct);
    return -(teamCost * wastedPct);
  }
  const direct = decision.monthlyCost || 0;
  let opp = 0;
  if (so?.type === 'revenue_role' && so.quota) {
    const endDate = decision.reclaim?.resolvedDate || new Date().toISOString().split('T')[0];
    const dd = daysApart(decision.startDate, endDate);
    const md = dd / 30;
    opp = ((so.quota * so.attainRate) / 12) * rampPct(md, so.rampQ);
  }
  let cascade = 0;
  if (so?.type === 'team_blocker' && so.teamSize) {
    cascade = so.teamSize * so.avgSalary * so.dragPct + (so.attrProb * so.replaceCost) / 12;
  }
  return direct + opp + cascade;
}

// ── Reclaim Status ───────────────────────────────────────
export function getReclaimStatus(decision: Decision): ReclaimStatus {
  const r = decision.reclaim;
  if (!r?.enabled || !r?.targetDate) return null;

  const today = new Date().toISOString().split('T')[0];
  // Use the active monthly rate (not the resolved 0 rate) for delta calculations
  const dr = dayRate(activeMonthlyRate(decision));

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
