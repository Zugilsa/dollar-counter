# Dollar Counter — Claude Code Implementation Spec
## Full-Stack Production App · Decision Cost Intelligence

---

## CLAUDE CODE PROMPT (paste this)

```
Build a full-stack web application called "Dollar Counter" — a real-time decision cost intelligence tool for executive teams.

The app quantifies the financial cost of delayed or unmade decisions: hiring delays, firing delays, underperforming team members, tool waste, vendor overcharges, and blocked decisions.

What makes it unique: it models THREE cost layers per decision:
- Layer 1 (Direct): Observable monthly cost — salary, contract, tool fee
- Layer 2 (Opportunity): Foregone revenue — quota attainment × ramp curve
- Layer 3 (Cascade): Team drag — productivity loss × team size + attrition risk

The header shows a live Solari-style split-flap flip counter (CSS rotateX animation) showing the running session total across ALL THREE layers.

Each decision card shows a cost stack breakdown, a live per-card flip counter, and a RECLAIM tracking panel that monitors whether a resolution target is on track, overdue, or completed — calculating savings or extra cost in real-time.

Full spec below. Implement everything.
```

---

## Tech Stack

```
Next.js 14 (App Router)
TypeScript
Tailwind CSS v3
Framer Motion (flip digit animations)
Recharts (ramp curve chart)
Zustand (client state)
date-fns (date math)
Prisma + PostgreSQL (persistence)
Vercel deployment
```

---

## Design System

```
Primary:    #1DA1F2   (Twitter blue)
Background: #EEF4FA   (light sky)
Surface:    #FFFFFF
Dark panel: #0D1F30   (flip board background)

Typography: Inter (Google Fonts)
  - Headings:  700
  - Labels:    600
  - Body:      500
  - Numbers:   700 (Inter tabular)

Flip digit cell:
  background: #0D1E2E
  border:     #1C3448
  digit color:#DDEEF8
  glow:       rgba(29,161,242,0.35)
  seam:       1.5px solid #060E18

Border radius: cards 14px, inputs 8px, buttons 9px
Card border:   1px solid #E1EAF2
Card shadow:   0 1px 4px rgba(15,40,70,0.05)
Card hover:    0 6px 24px rgba(29,161,242,0.10)
```

---

## Data Models

```typescript
// types/index.ts

export type DecisionType =
  | "revenue_role"       // AE/BDR/AM — uses Revenue Wizard
  | "team_drag"          // Blocker — uses Cascade Wizard
  | "delayed_hire"       // Non-revenue hiring delay
  | "delayed_fire"       // Slow offboard
  | "tool_waste"         // Unused licenses/SaaS
  | "vendor_cost";       // Contract overcharge

export interface RevenueSecondOrder {
  type: "revenue_role";
  quota: number;          // Annual quota target ($)
  attainRate: number;     // Expected attainment (0–1, e.g. 0.70)
  rampQ: number;          // Quarters to full productivity (1–6)
}

export interface TeamSecondOrder {
  type: "team_blocker";
  teamSize: number;       // Number of people impacted
  avgSalary: number;      // Fully-loaded monthly salary per person ($)
  dragPct: number;        // Productivity drag (0–1, e.g. 0.25)
  attrProb: number;       // Attrition probability 12mo (0–1)
  replaceCost: number;    // Cost to replace one person ($)
}

export type SecondOrder = RevenueSecondOrder | TeamSecondOrder | null;

export interface ReclaimConfig {
  enabled: boolean;
  targetDate: string;         // ISO date
  resolvedDate: string | null; // ISO date or null
}

export interface Decision {
  id: string;
  type: DecisionType;
  title: string;
  note?: string;
  monthlyCost: number;        // Layer 1: direct monthly cost
  startDate: string;          // ISO date — when delay began
  secondOrder: SecondOrder;   // Layer 2/3 config
  reclaim: ReclaimConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostBreakdown {
  direct: number;       // Layer 1
  opp: number;          // Layer 2 — opportunity
  cascade: number;      // Layer 3 — cascade
  totalMonthly: number; // Sum of all layers
  accrued: number;      // Historical total since startDate
}

export type ReclaimStatus =
  | { status: "on_track"; daysRemaining: number; savings: number }
  | { status: "at_risk";  daysRemaining: number }
  | { status: "overdue";  daysOverdue: number; extra: number }
  | { status: "saved";    daysEarly: number; delta: number }
  | { status: "late";     daysLate: number;  delta: number }
  | { status: "on_time" }
  | null;
```

---

## Cost Calculation Engine

```typescript
// lib/costs.ts

const WORK_DAYS_MONTH = 22;
const WORK_HRS_DAY    = 8;
const WORK_SECS_MONTH = WORK_DAYS_MONTH * WORK_HRS_DAY * 3600;

// Ramp rate for month M with Q-quarter ramp schedule
// 3Q ramp: Q1=25%, Q2=50%, Q3=75%, Q4+=100%
export function rampPct(monthsIn: number, rampQ: number): number {
  const q = Math.floor(monthsIn / 3);
  if (q >= rampQ) return 1.0;
  return (q + 1) / (rampQ + 1);
}

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

export function calcCosts(decision: Decision): CostBreakdown {
  const today = new Date().toISOString().split("T")[0];
  const dd    = daysApart(decision.startDate, today);
  const md    = dd / 30;
  const so    = decision.secondOrder;

  const direct = decision.monthlyCost || 0;

  // ── Layer 2: Opportunity (Revenue Role) ──────────────────
  let opp = 0;
  if (so?.type === "revenue_role" && so.quota) {
    const fullMonthly = (so.quota * so.attainRate) / 12;
    opp = fullMonthly * rampPct(md, so.rampQ);
  }

  // ── Layer 3: Cascade (Team Drag) ─────────────────────────
  let cascade = 0;
  if (so?.type === "team_blocker" && so.teamSize) {
    const teamDrag   = so.teamSize * so.avgSalary * so.dragPct;
    const attrRisk   = (so.attrProb * so.replaceCost) / 12;
    cascade = teamDrag + attrRisk;
  }

  const totalMonthly = direct + opp + cascade;

  // ── Historical Accrued (ramp-aware for revenue roles) ────
  let accrued = dd * dayRate(direct + cascade);

  if (so?.type === "revenue_role" && so.quota) {
    const fullMonthly = (so.quota * so.attainRate) / 12;
    const fullMs  = Math.floor(md);
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

// ── Revenue Role Projection ───────────────────────────────
export function revenueProjection(so: RevenueSecondOrder) {
  const annualExpected  = so.quota * so.attainRate;
  const fullMonthly     = annualExpected / 12;
  const year1           = Array.from({ length: 12 }, (_, m) =>
    fullMonthly * rampPct(m, so.rampQ)
  ).reduce((a, b) => a + b, 0);

  return { annualExpected, fullMonthly, year1 };
}

// ── Cascade Breakdown ────────────────────────────────────
export function cascadeBreakdown(so: TeamSecondOrder) {
  const teamDrag  = so.teamSize * so.avgSalary * so.dragPct;
  const attrRisk  = (so.attrProb * so.replaceCost) / 12;
  return { teamDrag, attrRisk, total: teamDrag + attrRisk };
}

// ── Reclaim Status ────────────────────────────────────────
export function getReclaimStatus(decision: Decision): ReclaimStatus {
  const r = decision.reclaim;
  if (!r?.enabled || !r?.targetDate) return null;

  const today   = new Date().toISOString().split("T")[0];
  const costs   = calcCosts(decision);
  const dr      = dayRate(costs.totalMonthly);

  if (r.resolvedDate) {
    const early = daysApart(r.resolvedDate, r.targetDate);
    const late  = daysApart(r.targetDate,   r.resolvedDate);
    if (early > 0) return { status: "saved", daysEarly: early, delta: early * dr };
    if (late  > 0) return { status: "late",  daysLate:  late,  delta: late  * dr };
    return { status: "on_time" };
  }

  const isOverdue = new Date(r.targetDate) < new Date(today);
  if (isOverdue) {
    const d = daysApart(r.targetDate, today);
    return { status: "overdue", daysOverdue: d, extra: d * dr };
  }

  const d = daysApart(today, r.targetDate);
  if (d <= 7) return { status: "at_risk", daysRemaining: d };
  return { status: "on_track", daysRemaining: d, savings: d * dr };
}
```

---

## Component Architecture

```
app/
├── page.tsx                    # Main page — layout + data fetch
├── layout.tsx                  # Root layout, fonts, global styles

components/
├── flip/
│   ├── FlipDigit.tsx           # Single digit with CSS rotateX animation
│   └── FlipDisplay.tsx         # Row of FlipDigits for a dollar value
│
├── cards/
│   ├── DecisionCard.tsx        # Full card with all 3 layers
│   ├── CostLayers.tsx          # Layer 1/2/3 breakdown panel
│   ├── RampChart.tsx           # SVG bar chart — ramp curve
│   ├── RevenueBreakdown.tsx    # Revenue model detail table
│   ├── TeamBreakdown.tsx       # Cascade cost detail table
│   └── ReclaimPanel.tsx        # Reclaim status + resolve action
│
├── header/
│   ├── DashboardHeader.tsx     # Dark board with stats
│   └── TotalCounter.tsx        # Live FlipDisplay for session total
│
├── modal/
│   ├── AddModal.tsx            # 4-step modal shell
│   ├── steps/
│   │   ├── Step1Type.tsx       # Decision type selection grid
│   │   ├── Step2Basic.tsx      # Title, cost, dates
│   │   ├── Step3Revenue.tsx    # Revenue wizard
│   │   ├── Step3Team.tsx       # Team drag wizard
│   │   └── Step4Reclaim.tsx    # Reclaim target setter
│   └── CostPreview.tsx         # Live cost preview in wizard steps
│
├── ui/
│   ├── Field.tsx               # Label + input wrapper
│   ├── SliderField.tsx         # Labeled range slider
│   ├── Toggle.tsx              # On/off toggle
│   └── TabBar.tsx              # Filter tabs

lib/
├── costs.ts                    # All cost calculation functions
├── types.ts                    # TypeScript types
└── store.ts                    # Zustand store

hooks/
├── useLiveCounter.ts           # RAF-based live tick counter
└── useReclaimStatus.ts         # Reclaim status derived hook

prisma/
└── schema.prisma               # Decision + ReclaimConfig models

app/api/
├── decisions/
│   ├── route.ts                # GET all, POST new
│   └── [id]/
│       └── route.ts            # PATCH, DELETE
└── decisions/[id]/resolve/
    └── route.ts                # POST to set resolvedDate
```

---

## FlipDigit Animation

```typescript
// components/flip/FlipDigit.tsx
// The key animation — CSS perspective transform on character change

const FLIP_KEYFRAMES = `
  @keyframes flipIn {
    0%   { transform: perspective(280px) rotateX(-80deg); opacity: 0.1; }
    100% { transform: perspective(280px) rotateX(0deg);   opacity: 1;   }
  }
`;

// Trigger: when char prop changes, add animation class for 110ms
// The seam line (1.5px horizontal rule at 50%) sells the split-flap illusion
// Top half gradient (rgba(0,0,0,0.2) → transparent) adds depth
```

---

## Live Counter Hook

```typescript
// hooks/useLiveCounter.ts

export function useLiveCounter(monthlyCost: number): number {
  const [value, setValue] = useState(0);
  const startRef  = useRef(performance.now());
  const rafRef    = useRef<number>(0);
  const rateRef   = useRef(msRate(monthlyCost));  // $ per millisecond

  useEffect(() => {
    rateRef.current = msRate(monthlyCost);         // 8h work-day basis
  }, [monthlyCost]);

  useEffect(() => {
    const tick = (now: number) => {
      setValue((now - startRef.current) * rateRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return value;
}

// IMPORTANT: rate = monthlyCost / (22 days × 8 hours × 3600s × 1000ms)
// NOT 24/7 — 8-hour working day only
// Counter resets on page refresh — this is intentional (session cost)
```

---

## Ramp Chart Spec

```
SVG bar chart, 12 bars (months 1–12)
Width: 220px, Height: 44px + 16px labels

Bar colors:
  Past months (< current): #E0504A (foregone, 55% opacity)
  Current month:            #F0A500 (you are here)
  Future months:            #C8E8F8 (potential, 85% opacity)

Vertical dashed line at current month position: stroke #F0A500

Legend row below:
  ● Foregone  ● Current  ● Remaining

Axis labels at M1, M3, M6, M9, M12
```

---

## Add Decision Modal — Step Flow

```
Step 1: Type Selection
  ┌──────────┬──────────┐
  │ ◈ Revenue│ ⊘ Team   │  ← These two show "+ 2ND ORDER WIZARD" badge
  │   Role   │   Drag   │
  ├──────────┼──────────┤
  │ ↑ Delayed│ ↓ Delayed│
  │   Hire   │   Fire   │
  ├──────────┼──────────┤
  │ ◉ Tool   │ ▣ Vendor │
  │   Waste  │   Cost   │
  └──────────┴──────────┘

Step 2: Basic Info
  - Title (role name or description)
  - Direct Monthly Cost (toggle: monthly/annual/daily input)
    → Live breakdown: $/day, $/hour, $/minute
  - Identified On (date picker)
  - Note (optional)

Step 3A (revenue_role only): Revenue Model
  - Annual Quota ($)
  - Attainment Rate (slider 40–100%)
  - Ramp Duration (slider 1–6 quarters)
  → Live Preview panel:
    Full attainment/yr · Monthly at full ramp · Year-1 projected
    + RampChart showing current position

Step 3B (team_drag only): Cascade Model
  - Team Size Affected (slider 1–20)
  - Avg Monthly Salary — fully loaded ($)
  - Productivity Drag % (slider 5–60%)
  - Attrition Probability 12mo (slider 5–80%)
  - Replacement Cost per person ($)
  → Live Preview: team drag + attrition risk + total cascade

Step 4: Reclaim Target
  - Toggle: Enable RECLAIM tracking
  - Target Resolution Date (date picker)
  → Preview: days left · savings if resolved today · total potential savings
  → "Already burned" panel showing current total monthly cost

  [For non-wizard types: Steps are 1 → 2 → 4 (skip step 3)]
```

---

## Decision Card Layout

```
┌─────────────────────────────────────────────┐
│ ◈ REVENUE ROLE [badge]               [×]    │
│ AE — Enterprise West                        │
│ Territory uncovered, Q1 pipeline stalling   │
├─────────────────────────────────────────────┤
│ COST LAYERS                                 │
│ Layer 1 · Direct   Layer 2 · Opp   Total   │
│ —                  $70K/mo         $70K/mo  │
│                    ramp 75%                 │
├─────────────────────────────────────────────┤
│ REVENUE IMPACT MODEL (green panel)          │
│ Quota × attainment (70%)  $840,000/yr       │
│ Current ramp (75% output) $52,500/mo        │
│ Year-1 projection (3Q)    $525,000          │
│                                             │
│ [Ramp Chart SVG]                            │
├─────────────────────────────────────────────┤
│ 47d delayed  $8,750/hr   $4,375/day         │
├─────────────────────────────────────────────┤
│ ┌ LIVE THIS SESSION ──────────────────────┐ │
│ │ [Solari flip counter - dark board]      │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Total Accrued (all layers)       $187,500   │
├─────────────────────────────────────────────┤
│ RECLAIM · On Track                          │
│ 57d to target · act today = $249K saved     │
│ [Mark Resolved →]                           │
└─────────────────────────────────────────────┘
```

---

## Reclaim Status Logic

```
Status        Condition                     Display
──────────────────────────────────────────────────
on_track      > 7 days to target            Green — savings if act now
at_risk       ≤ 7 days to target            Amber — "act now"
overdue       target date passed            Red pulsing — extra cost accruing
saved         resolved BEFORE target        Green — X days early, $Y reclaimed
late          resolved AFTER target         Red — X days late, $Y extra
on_time       resolved ON target date       Green — exactly on target

Savings = days_early × (totalMonthly / 22)
Extra   = days_late  × (totalMonthly / 22)
```

---

## Dashboard Header Stats

```
Row 1: App name + Live indicator + Overdue badge (if any)
Row 2: Solari flip board (dark, full-width on mobile)
         → Total session cost across all decisions, all layers
Row 3: Stat row
  Total Accrued (blue)  ·  Monthly Burn  ·  Layer 1 Direct
  Layer 2 Opportunity (green)  ·  Layer 3 Cascade (amber)
```

---

## Prisma Schema

```prisma
model Decision {
  id           String    @id @default(cuid())
  type         String    // DecisionType enum value
  title        String
  note         String?
  monthlyCost  Float     @default(0)
  startDate    DateTime
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  secondOrder  Json?     // RevenueSecondOrder | TeamSecondOrder | null
  reclaim      Json      // ReclaimConfig

  @@index([type])
  @@index([startDate])
}
```

---

## API Endpoints

```
GET    /api/decisions              List all (optional ?type= filter)
POST   /api/decisions              Create new decision
PATCH  /api/decisions/:id          Update any field
DELETE /api/decisions/:id          Delete decision
POST   /api/decisions/:id/resolve  Set resolvedDate { resolvedDate: "2026-03-15" }
```

---

## Zustand Store

```typescript
// lib/store.ts

interface DecisionStore {
  decisions:   Decision[];
  tab:         string;                     // "all" | DecisionType
  showAdd:     boolean;

  setDecisions: (d: Decision[]) => void;
  addDecision:  (d: Decision) => void;
  removeDecision: (id: string) => void;
  resolveDecision: (id: string, date: string) => void;
  setTab:  (t: string) => void;
  toggleAdd: () => void;
}
```

---

## Seed Data (for development)

```typescript
// 5 decisions covering all the key types:
// 1. Revenue Role: AE Enterprise West, $1.2M quota, 70% attain, 3Q ramp
// 2. Team Drag: Senior Engineer blocking 4 people, 25% drag, 30% attrition
// 3. Delayed Hire: VP of Engineering, $25K/mo direct
// 4. Tool Waste: Salesforce ×12 unused seats, $3,600/mo
// 5. Vendor Overcharge: Legacy data warehouse, $8,500/mo at 2022 rates
```

---

## Key Implementation Notes

1. **All costs on 8h work-day basis** — 22 days/month × 8 hours. Not 24/7. This is intentional and shown in the UI.

2. **Ramp curve is ramp-aware for accrued calculation** — don't just multiply days × rate. For revenue roles, iterate month by month applying the correct ramp percentage. See `calcCosts()` implementation.

3. **Live counter uses `requestAnimationFrame`** — not `setInterval`. Store `performance.now()` at mount, compute elapsed × rate on each frame. The counter rate (`rateRef`) updates via `useEffect` when `monthlyCost` changes without resetting the session start time.

4. **Header counter sums `calcCosts(item).totalMonthly`** across all decisions — this includes all three layers, so opportunity and cascade costs are included in the live session ticking total.

5. **FlipDigit animation** — only animate when `char` changes. Use `key` prop or animation CSS class with timeout to trigger re-animation. The seam line at 50% height is the key visual detail.

6. **RECLAIM savings calculation uses total monthly cost** (all layers), not just direct cost. So for a revenue role, resolving early saves you the full $70K/mo opportunity cost per day resolved early.

7. **Wizard steps skip logic** — types without a wizard (delayed_hire, delayed_fire, tool_waste, vendor_cost) go directly from Step 2 to Step 4. The progress bar should show 3 dots instead of 4 for these types.
```

---

## Environment Variables

```
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."        # if auth added later
NEXT_PUBLIC_APP_NAME="Dollar Counter"
```

---

## Deployment

```bash
# Install
pnpm install

# Database
pnpx prisma generate
pnpx prisma db push
pnpx prisma db seed

# Dev
pnpm dev

# Deploy
vercel --prod
```
