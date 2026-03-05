export type DecisionType =
  | "revenue_role"
  | "team_drag"
  | "delayed_hire"
  | "delayed_fire"
  | "tool_waste"
  | "vendor_cost"
  | "sprint_delay"
  | "meeting_waste"
  | "eng_time";

export const TYPES: Record<DecisionType, { label: string; sub: string; icon: string; color: string; wizard: string | null }> = {
  revenue_role:   { label: "Revenue Role",      sub: "AE / BDR / AM",       icon: "◈", color: "#2BAE66", wizard: "revenue"  },
  team_drag:      { label: "Team Drag",         sub: "Blocker or friction",  icon: "⊘", color: "#F0A500", wizard: "team"     },
  delayed_hire:   { label: "Delayed Hire",      sub: "Non-revenue role",     icon: "↑", color: "#1DA1F2", wizard: null       },
  delayed_fire:   { label: "Delayed Fire",      sub: "Slow offboard",        icon: "↓", color: "#E0504A", wizard: null       },
  tool_waste:     { label: "Tool Waste",        sub: "License / SaaS",       icon: "◉", color: "#8B6FD4", wizard: null       },
  vendor_cost:    { label: "Vendor Overcharge",  sub: "Contract / pricing",  icon: "▣", color: "#E06080", wizard: null       },
  sprint_delay:   { label: "Sprint Delay",      sub: "Roadmap initiative",   icon: "⏱", color: "#6366F1", wizard: "sprint"   },
  meeting_waste:  { label: "Meeting Waste",     sub: "Reduce or eliminate",   icon: "⊙", color: "#10B981", wizard: "meeting"  },
  eng_time:       { label: "Eng Time",          sub: "Code vs. PM work",      icon: "⚡", color: "#06B6D4", wizard: "eng_time" },
};

// ── Meeting Role Presets ─────────────────────────────────
export const ROLE_PRESETS = [
  { role: "CEO",             hourlyCost: 350 },
  { role: "CRO",             hourlyCost: 300 },
  { role: "CTO",             hourlyCost: 325 },
  { role: "CFO",             hourlyCost: 310 },
  { role: "COO",             hourlyCost: 290 },
  { role: "VP",              hourlyCost: 250 },
  { role: "Director",        hourlyCost: 200 },
  { role: "Senior Manager",  hourlyCost: 170 },
  { role: "Manager",         hourlyCost: 150 },
  { role: "Senior Engineer", hourlyCost: 140 },
  { role: "Engineer",        hourlyCost: 125 },
  { role: "Designer",        hourlyCost: 120 },
  { role: "Analyst",         hourlyCost: 110 },
  { role: "Other",           hourlyCost: 100 },
] as const;

export interface MeetingAttendee {
  role: string;
  hourlyCost: number;
  count: number;
}

export interface RevenueSecondOrder {
  type: "revenue_role";
  quota: number;
  attainRate: number;
  rampQ: number;
}

export interface TeamSecondOrder {
  type: "team_blocker";
  teamSize: number;
  avgSalary: number;
  dragPct: number;
  attrProb: number;
  replaceCost: number;
}

export interface DelayEvent {
  date: string;
  weeksDelayed: number;
  reason: string;
}

export interface SprintSecondOrder {
  type: "sprint_delay";
  teamSize: number;
  avgSalary: number;
  expectedRevenue: number;
  originalTargetDate: string;
  delays: DelayEvent[];
  deliveredDate: string | null;
}

export interface MeetingSecondOrder {
  type: "meeting_waste";
  originalMinutes: number;
  optimizedMinutes: number;
  frequencyPerWeek: number;
  attendees: MeetingAttendee[];
}

export interface EngTimeSecondOrder {
  type: "eng_time";
  engineerCount: number;
  avgMonthlyCost: number;
  currentCodingPct: number;
  targetCodingPct: number;
}

export type SecondOrder = RevenueSecondOrder | TeamSecondOrder | SprintSecondOrder | MeetingSecondOrder | EngTimeSecondOrder | null;

export interface ReclaimConfig {
  enabled: boolean;
  targetDate: string;
  resolvedDate: string | null;
}

export interface Decision {
  id: string;
  type: DecisionType;
  title: string;
  note?: string;
  monthlyCost: number;
  startDate: string;
  secondOrder: SecondOrder;
  reclaim: ReclaimConfig;
  createdAt: string;
  updatedAt: string;
}

export interface CostBreakdown {
  direct: number;
  opp: number;
  cascade: number;
  totalMonthly: number;
  accrued: number;
}

export type ReclaimStatus =
  | { status: "on_track"; daysRemaining: number; savings: number }
  | { status: "at_risk";  daysRemaining: number }
  | { status: "overdue";  daysOverdue: number; extra: number }
  | { status: "saved";    daysEarly: number; delta: number }
  | { status: "late";     daysLate: number;  delta: number }
  | { status: "on_time" }
  | null;
