export type DecisionType =
  | "revenue_role"
  | "team_drag"
  | "delayed_hire"
  | "delayed_fire"
  | "tool_waste"
  | "vendor_cost"
  | "sprint_delay";

export const TYPES: Record<DecisionType, { label: string; sub: string; icon: string; color: string; wizard: string | null }> = {
  revenue_role:   { label: "Revenue Role",      sub: "AE / BDR / AM",       icon: "◈", color: "#2BAE66", wizard: "revenue" },
  team_drag:      { label: "Team Drag",         sub: "Blocker or friction",  icon: "⊘", color: "#F0A500", wizard: "team"    },
  delayed_hire:   { label: "Delayed Hire",      sub: "Non-revenue role",     icon: "↑", color: "#1DA1F2", wizard: null      },
  delayed_fire:   { label: "Delayed Fire",      sub: "Slow offboard",        icon: "↓", color: "#E0504A", wizard: null      },
  tool_waste:     { label: "Tool Waste",        sub: "License / SaaS",       icon: "◉", color: "#8B6FD4", wizard: null      },
  vendor_cost:    { label: "Vendor Overcharge",  sub: "Contract / pricing",  icon: "▣", color: "#E06080", wizard: null      },
  sprint_delay:   { label: "Sprint Delay",      sub: "Roadmap initiative",   icon: "⏱", color: "#6366F1", wizard: "sprint"  },
};

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

export type SecondOrder = RevenueSecondOrder | TeamSecondOrder | SprintSecondOrder | null;

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
