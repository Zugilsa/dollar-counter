import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════

const WORK_SECS_MONTH = 22 * 8 * 3600; // 8h × 22 working days

const TYPES = {
  revenue_role:   { label: "Revenue Role",       sub: "AE / BDR / AM",       icon: "◈", color: "#2BAE66", wizard: "revenue" },
  team_drag:      { label: "Team Drag",           sub: "Blocker or friction",  icon: "⊘", color: "#F0A500", wizard: "team"    },
  delayed_hire:   { label: "Delayed Hire",        sub: "Non-revenue role",     icon: "↑", color: "#1DA1F2", wizard: null      },
  delayed_fire:   { label: "Delayed Fire",        sub: "Slow offboard",        icon: "↓", color: "#E0504A", wizard: null      },
  tool_waste:     { label: "Tool Waste",          sub: "License / SaaS",       icon: "◉", color: "#8B6FD4", wizard: null      },
  vendor_cost:    { label: "Vendor Overcharge",   sub: "Contract / pricing",   icon: "▣", color: "#E06080", wizard: null      },
};

// ═══════════════════════════════════════════════════════
//  COST ENGINE
// ═══════════════════════════════════════════════════════

const today     = () => new Date().toISOString().split("T")[0];
const daysApart = (a, b) => Math.max(0, (new Date(b) - new Date(a)) / 86400000);
const dayRate   = (m) => m / 22;
const hrRate    = (m) => m / 22 / 8;
const fmtM      = (n) => `$${Math.round(n).toLocaleString()}/mo`;
const fmt$      = (n) => `$${Math.round(n).toLocaleString()}`;

// Ramp rate: 3Q ramp → Q1=25%, Q2=50%, Q3=75%, Q4+=100%
const rampPct = (monthsIn, rampQ) =>
  Math.floor(monthsIn / 3) >= rampQ ? 1.0
    : (Math.floor(monthsIn / 3) + 1) / (rampQ + 1);

function calcCosts(item) {
  const dd = daysApart(item.startDate, today());
  const md = dd / 30;
  const so = item.secondOrder || {};

  const direct = item.monthlyCost || 0;

  // Layer 2: Opportunity (Revenue Role)
  let opp = 0;
  if (item.type === "revenue_role" && so.quota) {
    const fullMo = (so.quota * (so.attainRate ?? 0.7)) / 12;
    opp = fullMo * rampPct(md, so.rampQ ?? 3);
  }

  // Layer 3: Cascade (Team Drag)
  let cascade = 0;
  if (item.type === "team_drag" && so.teamSize) {
    const drag = so.teamSize * (so.avgSalary ?? 15000) * (so.dragPct ?? 0.2);
    const attr = ((so.attrProb ?? 0.2) * (so.replaceCost ?? 150000)) / 12;
    cascade = drag + attr;
  }

  const totalMonthly = direct + opp + cascade;

  // Historical accrued — ramp-aware for revenue roles
  let accrued = dd * dayRate(direct + cascade);
  if (item.type === "revenue_role" && so.quota) {
    const fullMo = (so.quota * (so.attainRate ?? 0.7)) / 12;
    const fullMs = Math.floor(md);
    let oppAcc = 0;
    for (let m = 0; m < fullMs; m++) oppAcc += fullMo * rampPct(m, so.rampQ ?? 3);
    oppAcc += fullMo * rampPct(fullMs, so.rampQ ?? 3) * (md - fullMs);
    accrued += oppAcc;
  } else {
    accrued += dd * dayRate(opp);
  }

  return { direct, opp, cascade, totalMonthly, accrued };
}

// ═══════════════════════════════════════════════════════
//  FLIP DISPLAY
// ═══════════════════════════════════════════════════════

function FlipDigit({ char, size = "md" }) {
  const [shown, setShown] = useState(char);
  const [anim,  setAnim]  = useState(0);
  const prev = useRef(char);

  useEffect(() => {
    if (char === prev.current) return;
    prev.current = char;
    setAnim(k => k + 1);
    const t = setTimeout(() => setShown(char), 85);
    return () => clearTimeout(t);
  }, [char]);

  const D = {
    xl: { w: 46, h: 68, fs: 44, r: 6 },
    lg: { w: 34, h: 50, fs: 32, r: 5 },
    md: { w: 24, h: 36, fs: 22, r: 4 },
    sm: { w: 17, h: 26, fs: 15, r: 3 },
  }[size];

  const isNum  = /[0-9]/.test(char);
  const isPunct = char === "." || char === ",";
  const cw = isPunct ? D.w * 0.52 : char === "$" ? D.w * 0.62 : D.w;

  if (char === " ") return <div style={{ width: D.w * 0.28 }} />;

  return (
    <div style={{
      position: "relative", width: cw, height: D.h,
      background: isNum ? "#0D1E2E" : "transparent",
      borderRadius: isNum ? D.r : 0,
      border: isNum ? "1px solid #1C3448" : "none",
      margin: "0 2px", display: "flex", alignItems: "center",
      justifyContent: "center", overflow: "hidden", flexShrink: 0,
      boxShadow: isNum ? "inset 0 2px 4px rgba(0,0,0,0.5)" : "none",
    }}>
      {isNum && <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1.5, background: "#060E18", zIndex: 5 }} />}
      {isNum && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "44%", background: "linear-gradient(180deg,rgba(0,0,0,0.2) 0%,transparent 100%)", zIndex: 4, pointerEvents: "none" }} />}
      <span key={`a${anim}`} style={{
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSize: D.fs, fontWeight: 600,
        color: isNum ? "#DDEEF8" : isPunct ? "#5A8AAA" : "#4A7090",
        lineHeight: 1,
        textShadow: isNum ? "0 0 12px rgba(29,161,242,0.35)" : "none",
        animation: anim > 0 ? "flipIn 100ms ease-out" : "none",
        userSelect: "none",
      }}>
        {shown}
      </span>
    </div>
  );
}

function FlipRow({ value, size = "md" }) {
  const s = "$" + Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {s.split("").map((c, i) => <FlipDigit key={i} char={c} size={size} />)}
    </div>
  );
}

function useLive(monthlyCost) {
  const [v, setV] = useState(0);
  const t0  = useRef(performance.now());
  const raf = useRef(null);
  const rr  = useRef(monthlyCost / WORK_SECS_MONTH / 1000);
  useEffect(() => { rr.current = monthlyCost / WORK_SECS_MONTH / 1000; }, [monthlyCost]);
  useEffect(() => {
    const tick = n => { setV((n - t0.current) * rr.current); raf.current = requestAnimationFrame(tick); };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);
  return v;
}

// ═══════════════════════════════════════════════════════
//  VISUALISATIONS
// ═══════════════════════════════════════════════════════

function RampChart({ rampQ, daysDelay }) {
  const W = 220, H = 44;
  const curM = daysDelay / 30;
  const bw   = W / 12 - 3;

  return (
    <div>
      <div style={{ fontSize: 8, color: "#9AB8CC", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 6 }}>
        Ramp curve — {rampQ}Q &nbsp;·&nbsp; you are at month {Math.ceil(curM)}
      </div>
      <svg width={W} height={H + 16} style={{ display: "block" }}>
        {Array.from({ length: 12 }, (_, i) => {
          const r  = rampPct(i, rampQ);
          const bh = r * H;
          const x  = i * (W / 12) + 1.5;
          const y  = H - bh;
          const past = i < curM;
          const curr = Math.floor(curM) === i;
          return (
            <g key={i}>
              <rect x={x} y={y} width={bw} height={bh}
                fill={past ? "#E0504A" : curr ? "#F0A500" : "#C8E8F8"}
                rx={2} opacity={past ? 0.55 : 0.85} />
              {[0, 2, 5, 8, 11].includes(i) && (
                <text x={x + bw / 2} y={H + 13} textAnchor="middle"
                  fontSize={7} fill="#9AB8CC" fontFamily="Inter">
                  M{i + 1}
                </text>
              )}
            </g>
          );
        })}
        <line x1={curM * (W / 12)} y1={0} x2={curM * (W / 12)} y2={H}
          stroke="#F0A500" strokeWidth={1.5} strokeDasharray="3,2" />
      </svg>
      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        {[["#E0504A", "Foregone"], ["#F0A500", "Current"], ["#C8E8F8", "Remaining"]].map(([c, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
            <span style={{ fontSize: 8, color: "#9AB8CC" }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RevenueBreakdown({ so, daysDelay }) {
  const md = daysDelay / 30;
  const annualExpected = so.quota * (so.attainRate ?? 0.7);
  const fullMo = annualExpected / 12;
  const curR   = rampPct(md, so.rampQ ?? 3);
  const yr1    = Array.from({ length: 12 }, (_, m) => fullMo * rampPct(m, so.rampQ ?? 3)).reduce((a, b) => a + b, 0);

  const rows = [
    { label: `Quota × attainment (${Math.round((so.attainRate ?? 0.7) * 100)}%)`, value: fmt$(annualExpected) + "/yr", color: "#2BAE66" },
    { label: `Current ramp stage (${Math.round(curR * 100)}% of full output)`,     value: fmtM(fullMo * curR),          color: "#2BAE66" },
    { label: `Year-1 projection (${so.rampQ ?? 3}Q ramp included)`,                value: fmt$(yr1),                    color: "#1DA1F2" },
  ];

  return (
    <div>
      <div style={{ fontSize: 8, color: "#1A6B4A", textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 700, marginBottom: 8 }}>
        Revenue Impact Model
      </div>
      {rows.map(r => (
        <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 11, color: "#4A6A88", lineHeight: 2 }}>
          <span>{r.label}</span>
          <span style={{ fontFamily: '"Inter", sans-serif', fontWeight: 700, color: r.color, flexShrink: 0, marginLeft: 8 }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function TeamBreakdown({ so }) {
  const drag = so.teamSize * (so.avgSalary ?? 15000) * (so.dragPct ?? 0.2);
  const attr = ((so.attrProb ?? 0.2) * (so.replaceCost ?? 150000)) / 12;

  const rows = [
    { label: `Team drag — ${so.teamSize} people × ${fmt$(so.avgSalary ?? 15000)}/mo × ${Math.round((so.dragPct ?? 0.2) * 100)}%`, value: fmtM(drag), color: "#F0A500" },
    { label: `Attrition risk — ${Math.round((so.attrProb ?? 0.2) * 100)}% chance × ${fmt$(so.replaceCost ?? 150000)} ÷ 12`, value: fmtM(attr), color: "#E0504A" },
  ];

  return (
    <div>
      <div style={{ fontSize: 8, color: "#8B5E00", textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 700, marginBottom: 8 }}>
        Cascade Cost Breakdown
      </div>
      {rows.map(r => (
        <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 11, color: "#4A6A88", lineHeight: 2 }}>
          <span style={{ flex: 1 }}>{r.label}</span>
          <span style={{ fontFamily: '"Inter", sans-serif', fontWeight: 700, color: r.color, flexShrink: 0, marginLeft: 8 }}>{r.value}</span>
        </div>
      ))}
      <div style={{ borderTop: "1px solid #F5D98A", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#8B5E00" }}>Total cascade</span>
        <span style={{ fontFamily: '"Inter", sans-serif', fontSize: 13, fontWeight: 700, color: "#F0A500" }}>{fmtM(drag + attr)}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  RECLAIM PANEL
// ═══════════════════════════════════════════════════════

function getReclaimStatus(item) {
  const r = item.reclaim;
  if (!r?.enabled || !r?.targetDate) return null;
  const td = today();
  if (r.resolvedDate) {
    const early = daysApart(r.resolvedDate, r.targetDate);
    const late  = daysApart(r.targetDate, r.resolvedDate);
    const costs = calcCosts(item);
    if (early > 0) return { status: "saved",   daysEarly: early, delta: early * dayRate(costs.totalMonthly) };
    if (late  > 0) return { status: "late",    daysLate:  late,  delta: late  * dayRate(costs.totalMonthly) };
    return { status: "on_time" };
  }
  const overdue = new Date(r.targetDate) < new Date(td);
  const costs = calcCosts(item);
  if (overdue) {
    const d = daysApart(r.targetDate, td);
    return { status: "overdue", daysOverdue: d, delta: d * dayRate(costs.totalMonthly) };
  }
  const d = daysApart(td, r.targetDate);
  return d <= 7 ? { status: "at_risk", daysRemaining: d } : { status: "on_track", daysRemaining: d, savings: d * dayRate(costs.totalMonthly) };
}

const SM = {
  on_track: { label: "On Track",      c: "#2BAE66", bg: "#F0FAF4", br: "#B8E8CC" },
  at_risk:  { label: "At Risk",       c: "#D48A00", bg: "#FFF8EC", br: "#F5D98A" },
  overdue:  { label: "Overdue",       c: "#E0504A", bg: "#FEF3F2", br: "#F8C0BC" },
  saved:    { label: "Reclaimed ✓",   c: "#2BAE66", bg: "#F0FAF4", br: "#B8E8CC" },
  late:     { label: "Resolved Late", c: "#E0504A", bg: "#FEF3F2", br: "#F8C0BC" },
  on_time:  { label: "On Time ✓",     c: "#2BAE66", bg: "#F0FAF4", br: "#B8E8CC" },
};

function ReclaimPanel({ item, onResolve }) {
  const [showR, setShowR] = useState(false);
  const [rDate, setRDate] = useState(today());
  const rs = getReclaimStatus(item);
  if (!rs) return null;
  const m = SM[rs.status];

  return (
    <div style={{ background: m.bg, border: `1px solid ${m.br}`, borderRadius: 8, padding: "11px 13px", marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: m.c }}>
          Reclaim · {m.label}
        </span>
        <span style={{ fontSize: 9, color: "#9AB8CC" }}>
          {item.reclaim.resolvedDate ? `resolved ${item.reclaim.resolvedDate}` : `target ${item.reclaim.targetDate}`}
        </span>
      </div>
      <div style={{ fontSize: 11, color: m.c, lineHeight: 1.5, marginBottom: item.reclaim.resolvedDate ? 0 : 8 }}>
        {rs.status === "overdue"  && `${Math.round(rs.daysOverdue)}d overdue — +${fmt$(rs.delta)} added`}
        {rs.status === "at_risk"  && `${Math.round(rs.daysRemaining)}d remaining — act now`}
        {rs.status === "on_track" && `${Math.round(rs.daysRemaining)}d to target · act today = ${fmt$(rs.savings)} saved`}
        {rs.status === "saved"    && `${Math.round(rs.daysEarly)}d early · ${fmt$(rs.delta)} reclaimed`}
        {rs.status === "late"     && `${Math.round(rs.daysLate)}d late · ${fmt$(rs.delta)} extra`}
        {rs.status === "on_time"  && "Resolved exactly on target."}
      </div>
      {!item.reclaim.resolvedDate && !showR && (
        <button onClick={() => setShowR(true)}
          style={{ ...tagBtn, background: m.c, color: "#fff", borderColor: "transparent" }}>
          Mark Resolved →
        </button>
      )}
      {!item.reclaim.resolvedDate && showR && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <input type="date" value={rDate} onChange={e => setRDate(e.target.value)}
            style={{ ...iSt, fontSize: 11, padding: "5px 10px", width: "auto" }} />
          <button onClick={() => { onResolve(item.id, rDate); setShowR(false); }}
            style={{ ...tagBtn, background: m.c, color: "#fff", borderColor: "transparent" }}>Confirm</button>
          <button onClick={() => setShowR(false)} style={tagBtn}>✕</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  DECISION CARD
// ═══════════════════════════════════════════════════════

function DecisionCard({ item, onRemove, onResolve }) {
  const costs = calcCosts(item);
  const live  = useLive(costs.totalMonthly);
  const ti    = TYPES[item.type];
  const dd    = daysApart(item.startDate, today());
  const isMulti = costs.opp > 0 || costs.cascade > 0;

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E1EAF2", overflow: "hidden", transition: "box-shadow 0.2s", boxShadow: "0 1px 4px rgba(15,40,70,0.05)" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 24px rgba(29,161,242,0.10)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(15,40,70,0.05)"}>

      <div style={{ height: 2.5, background: ti.color, opacity: 0.7 }} />

      <div style={{ padding: "18px 20px 20px" }}>
        {/* Title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${ti.color}12`, border: `1px solid ${ti.color}28`, borderRadius: 4, padding: "3px 9px", fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: ti.color, marginBottom: 8 }}>
              {ti.icon} {ti.label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#0F2846", lineHeight: 1.3 }}>{item.title}</div>
            {item.note && <div style={{ fontSize: 11, color: "#7A9BB8", marginTop: 3 }}>{item.note}</div>}
          </div>
          <button onClick={() => onRemove(item.id)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#C5D8E8", fontSize: 18, lineHeight: 1, padding: "0 4px", flexShrink: 0 }}
            onMouseEnter={e => e.target.style.color = "#E0504A"}
            onMouseLeave={e => e.target.style.color = "#C5D8E8"}>×</button>
        </div>

        {/* Cost Layers */}
        <div style={{ background: "#F4F8FC", borderRadius: 9, padding: "12px 14px", marginBottom: 12, border: "1px solid #E1EAF2" }}>
          <div style={{ fontSize: 8, color: "#7A9BB8", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 10 }}>
            Cost Layers
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMulti ? "1fr 1fr 1fr" : "1fr", gap: 8 }}>
            <div>
              <div style={microLabel}>Layer 1 · Direct</div>
              <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 14, fontWeight: 700, color: costs.direct > 0 ? "#0F2846" : "#C5D8E8" }}>
                {costs.direct > 0 ? fmtM(costs.direct) : "—"}
              </div>
              {costs.direct > 0 && <div style={{ fontSize: 9, color: "#9AB8CC", marginTop: 1 }}>salary / contract</div>}
            </div>
            {costs.opp > 0 && (
              <div>
                <div style={microLabel}>Layer 2 · Opportunity</div>
                <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 14, fontWeight: 700, color: "#2BAE66" }}>{fmtM(costs.opp)}</div>
                <div style={{ fontSize: 9, color: "#9AB8CC", marginTop: 1 }}>
                  ramp {Math.round(rampPct(dd / 30, item.secondOrder?.rampQ ?? 3) * 100)}% · foregone ARR
                </div>
              </div>
            )}
            {costs.cascade > 0 && (
              <div>
                <div style={microLabel}>Layer 3 · Cascade</div>
                <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 14, fontWeight: 700, color: "#F0A500" }}>{fmtM(costs.cascade)}</div>
                <div style={{ fontSize: 9, color: "#9AB8CC", marginTop: 1 }}>team drag + attrition</div>
              </div>
            )}
            {isMulti && (
              <div style={{ gridColumn: "1/-1", borderTop: "1px solid #E1EAF2", paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 9, color: "#7A9BB8", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Total Monthly Burn</span>
                <span style={{ fontFamily: '"Inter", sans-serif', fontSize: 17, fontWeight: 700, color: "#0F2846" }}>{fmtM(costs.totalMonthly)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Revenue model detail */}
        {item.type === "revenue_role" && item.secondOrder?.quota > 0 && (
          <div style={{ background: "#F0FAF4", borderRadius: 8, padding: "12px 14px", marginBottom: 12, border: "1px solid #B8E8CC" }}>
            <RevenueBreakdown so={item.secondOrder} daysDelay={dd} />
            <div style={{ marginTop: 12 }}>
              <RampChart rampQ={item.secondOrder.rampQ ?? 3} daysDelay={dd} />
            </div>
          </div>
        )}

        {/* Team drag detail */}
        {item.type === "team_drag" && item.secondOrder?.teamSize > 0 && (
          <div style={{ background: "#FFF8EC", borderRadius: 8, padding: "12px 14px", marginBottom: 12, border: "1px solid #F5D98A" }}>
            <TeamBreakdown so={item.secondOrder} />
          </div>
        )}

        {/* Quick stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
          {[
            { v: `${Math.round(dd)}d`,                          l: "Days Delayed" },
            { v: `$${Math.round(hrRate(costs.totalMonthly))}`,  l: "/ Work Hour"  },
            { v: `$${Math.round(dayRate(costs.totalMonthly))}`,  l: "/ Work Day"   },
          ].map(({ v, l }) => (
            <div key={l} style={{ background: "#F4F8FC", borderRadius: 7, padding: "8px 10px", border: "1px solid #E1EAF2" }}>
              <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 12, fontWeight: 600, color: "#1A3A5C" }}>{v}</div>
              <div style={{ fontSize: 8, color: "#9AB8CC", textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 600, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Live flip board */}
        <div style={{ background: "#0D1F30", borderRadius: 8, padding: "12px 14px", marginBottom: 10, border: "1px solid #1A3050", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.4)" }}>
          <div style={{ fontSize: 8, color: "#2A5070", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#1DA1F2", display: "inline-block", animation: "pulse 1.4s ease-in-out infinite", boxShadow: "0 0 5px #1DA1F2" }} />
            Live this session
          </div>
          <FlipRow value={live} size="sm" />
        </div>

        {/* Accrued */}
        <div style={{ background: "#F4F8FC", borderRadius: 8, padding: "11px 14px", border: "1px solid #E1EAF2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 9, color: "#7A9BB8", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Total Accrued</div>
            {isMulti && <div style={{ fontSize: 9, color: "#9AB8CC", marginTop: 2 }}>all layers combined</div>}
          </div>
          <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 17, fontWeight: 700, color: ti.color }}>
            {fmt$(costs.accrued)}
          </div>
        </div>

        <ReclaimPanel item={item} onResolve={onResolve} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  SHARED MICRO-STYLES
// ═══════════════════════════════════════════════════════

const iSt = {
  background: "#F4F8FC", border: "1px solid #D0E2F0",
  borderRadius: 8, padding: "10px 13px", color: "#0F2846",
  fontFamily: '"Inter", sans-serif', fontSize: 13, fontWeight: 500,
  outline: "none", width: "100%",
};
const lSt = {
  fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
  textTransform: "uppercase", color: "#7A9BB8",
  marginBottom: 6, display: "block",
};
const microLabel = {
  fontSize: 8, color: "#9AB8CC", textTransform: "uppercase",
  letterSpacing: "0.09em", fontWeight: 600, marginBottom: 3,
};
const tagBtn = {
  display: "inline-flex", alignItems: "center",
  padding: "5px 12px", borderRadius: 5, border: "1px solid #D0E2F0",
  background: "#F4F8FC", color: "#4A7898",
  fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
  textTransform: "uppercase", cursor: "pointer",
};
const btnP = {
  flex: 2, padding: "12px 20px", background: "#1DA1F2", color: "#fff",
  border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const btnS = {
  flex: 1, padding: "12px 16px", background: "transparent", color: "#7A9BB8",
  border: "1px solid #D0E2F0", borderRadius: 9, fontSize: 12, fontWeight: 500, cursor: "pointer",
};

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={lSt}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 10, color: "#9AB8CC", marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

function SliderField({ label, value, onChange, min, max, step = 1, fmt, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <label style={{ ...lSt, marginBottom: 0 }}>{label}</label>
        <span style={{ fontFamily: '"Inter", sans-serif', fontSize: 13, fontWeight: 700, color: "#0F2846" }}>{fmt ? fmt(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "#1DA1F2" }} />
      {hint && <div style={{ fontSize: 10, color: "#9AB8CC", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  ADD MODAL
// ═══════════════════════════════════════════════════════

const DEFAULT_FORM = {
  type: "revenue_role", title: "", monthlyCost: "0",
  costMode: "monthly", startDate: today(), note: "",
  // revenue
  quota: "1200000", attainRate: 70, rampQ: 3,
  // team
  teamSize: 4, avgSalary: 15000, dragPct: 25, attrProb: 25, replaceCost: 150000,
  // reclaim
  reclaimEnabled: true, reclaimDate: "",
};

function AddModal({ onAdd, onClose }) {
  const [step, setStep] = useState(1);
  const [f, setF]       = useState(DEFAULT_FORM);
  const upd = (k, v) => setF(p => ({ ...p, [k]: v }));

  const hasWizard = !!TYPES[f.type]?.wizard;

  // Step sequence: 1 → 2 → (3 if wizard) → 4
  const advance = () => step === 2 && !hasWizard ? setStep(4) : setStep(s => s + 1);
  const retreat = () => step === 4 && !hasWizard ? setStep(2) : setStep(s => s - 1);

  const progressDots = hasWizard ? 4 : 3;
  const progressIdx  = hasWizard ? step - 1 : (step <= 2 ? step - 1 : step - 2);

  const monthly = (() => {
    const n = parseFloat(f.monthlyCost) || 0;
    if (f.costMode === "annual") return n / 12;
    if (f.costMode === "daily")  return n * 22;
    return n;
  })();

  // Live preview costs
  const previewItem = {
    type: f.type, monthlyCost: monthly, startDate: f.startDate,
    secondOrder: f.type === "revenue_role" ? {
      type: "revenue_role", quota: parseFloat(f.quota) || 0,
      attainRate: f.attainRate / 100, rampQ: f.rampQ,
    } : f.type === "team_drag" ? {
      type: "team_blocker", teamSize: f.teamSize, avgSalary: f.avgSalary,
      dragPct: f.dragPct / 100, attrProb: f.attrProb / 100, replaceCost: f.replaceCost,
    } : null,
  };
  const pc = calcCosts(previewItem);

  const canNext = step === 1 ? !!f.type : step === 2 ? !!f.title : true;

  const submit = () => {
    const so = f.type === "revenue_role"
      ? { type: "revenue_role", quota: parseFloat(f.quota) || 0, attainRate: f.attainRate / 100, rampQ: f.rampQ }
      : f.type === "team_drag"
      ? { type: "team_blocker", teamSize: f.teamSize, avgSalary: f.avgSalary, dragPct: f.dragPct / 100, attrProb: f.attrProb / 100, replaceCost: f.replaceCost }
      : null;

    onAdd({
      id: Date.now(), type: f.type, title: f.title, monthlyCost: monthly,
      startDate: f.startDate, note: f.note, secondOrder: so,
      reclaim: { enabled: f.reclaimEnabled, targetDate: f.reclaimDate, resolvedDate: null },
    });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,30,55,0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", border: "1px solid #E1EAF2", borderRadius: 16, padding: 36, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(10,30,55,0.15)" }}>

        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {Array.from({ length: progressDots }, (_, i) => (
            <div key={i} style={{ flex: 1, height: 2, borderRadius: 2, background: i <= progressIdx ? "#1DA1F2" : "#E1EAF2", transition: "background 0.3s" }} />
          ))}
        </div>

        {/* ── STEP 1: TYPE ── */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 21, fontWeight: 700, color: "#0F2846", marginBottom: 5 }}>What decision is stalling?</div>
            <div style={{ fontSize: 12, color: "#7A9BB8", marginBottom: 22 }}>
              Every unmade call has a running price. Choose the category — the first two unlock a second-order cost wizard.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {Object.entries(TYPES).map(([k, v]) => (
                <button key={k} onClick={() => upd("type", k)} style={{
                  padding: "13px 14px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                  border: `2px solid ${f.type === k ? v.color : "#E1EAF2"}`,
                  background: f.type === k ? `${v.color}08` : "#FAFCFE",
                  transition: "all 0.15s",
                }}>
                  <div style={{ fontSize: 17, marginBottom: 5, color: v.color }}>{v.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: f.type === k ? v.color : "#4A7098", lineHeight: 1.3 }}>{v.label}</div>
                  <div style={{ fontSize: 9, color: "#9AB8CC", marginTop: 2 }}>{v.sub}</div>
                  {v.wizard && (
                    <div style={{ marginTop: 6, fontSize: 8, color: v.color, background: `${v.color}12`, borderRadius: 3, padding: "2px 6px", display: "inline-block", fontWeight: 700, letterSpacing: "0.06em" }}>
                      + 2nd ORDER WIZARD
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: BASIC INFO ── */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 21, fontWeight: 700, color: "#0F2846", marginBottom: 5 }}>
              {TYPES[f.type].icon} {TYPES[f.type].label}
            </div>
            <div style={{ fontSize: 12, color: "#7A9BB8", marginBottom: 22 }}>
              {f.type === "revenue_role" ? "The direct salary cost is optional — the quota model in the next step is the main engine." :
               f.type === "team_drag"    ? "Direct cost = the blocker's salary. The cascade wizard quantifies second-order impact." :
               "Estimated is fine — direction matters more than precision."}
            </div>

            <Field label="Title">
              <input value={f.title} onChange={e => upd("title", e.target.value)}
                placeholder={f.type === "revenue_role" ? "e.g. AE — Enterprise West" : f.type === "team_drag" ? "e.g. Senior Engineer (underperforming)" : "Role or contract name"}
                style={iSt} />
            </Field>

            <div style={{ marginBottom: 16 }}>
              <label style={lSt}>Direct Monthly Cost {f.type === "revenue_role" ? "(optional — salary if hired)" : ""}</label>
              <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
                {[["monthly", "Monthly"], ["annual", "Annual"], ["daily", "Daily Rate"]].map(([k, l]) => (
                  <button key={k} onClick={() => upd("costMode", k)} style={{ ...tagBtn, background: f.costMode === k ? "#1DA1F2" : "#F4F8FC", color: f.costMode === k ? "#fff" : "#4A7898", borderColor: f.costMode === k ? "#1DA1F2" : "#D0E2F0" }}>{l}</button>
                ))}
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9AB8CC", fontSize: 14 }}>$</span>
                <input type="number" value={f.monthlyCost} onChange={e => upd("monthlyCost", e.target.value)}
                  placeholder={f.costMode === "annual" ? "240000" : f.costMode === "daily" ? "1100" : "20000"}
                  style={{ ...iSt, paddingLeft: 26 }} />
              </div>
              {monthly > 0 && (
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  {[["Day", `$${Math.round(dayRate(monthly)).toLocaleString()}`], ["Hour", `$${Math.round(hrRate(monthly)).toLocaleString()}`], ["Min", `$${(hrRate(monthly) / 60).toFixed(2)}`]].map(([l, v]) => (
                    <div key={l} style={{ flex: 1, background: "#0D1F30", borderRadius: 6, padding: "7px 8px", textAlign: "center" }}>
                      <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 11, fontWeight: 600, color: "#1DA1F2" }}>{v}</div>
                      <div style={{ fontSize: 7, color: "#2A4A60", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginTop: 2 }}>/ {l}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Identified On">
                <input type="date" value={f.startDate} onChange={e => upd("startDate", e.target.value)} style={iSt} />
              </Field>
              <Field label="Note (optional)">
                <input value={f.note} onChange={e => upd("note", e.target.value)} placeholder="Context or impact" style={iSt} />
              </Field>
            </div>
          </div>
        )}

        {/* ── STEP 3A: REVENUE WIZARD ── */}
        {step === 3 && f.type === "revenue_role" && (
          <div>
            <div style={{ fontSize: 21, fontWeight: 700, color: "#0F2846", marginBottom: 5 }}>Revenue Model</div>
            <div style={{ fontSize: 12, color: "#7A9BB8", marginBottom: 22 }}>
              Define the quota, ramp, and attainment — this becomes Layer 2 of the cost stack.
            </div>

            <Field label="Annual Quota (OTE target)" hint="Total bookings target for this role per year">
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9AB8CC", fontSize: 14 }}>$</span>
                <input type="number" value={f.quota} onChange={e => upd("quota", e.target.value)} placeholder="1200000" style={{ ...iSt, paddingLeft: 26 }} />
              </div>
            </Field>

            <SliderField label="Expected Attainment Rate" value={f.attainRate} onChange={v => upd("attainRate", v)} min={40} max={100} step={5}
              fmt={v => `${v}%`} hint="Industry avg for enterprise AE: 60–75%" />

            <SliderField label="Ramp Duration" value={f.rampQ} onChange={v => upd("rampQ", v)} min={1} max={6} step={1}
              fmt={v => `${v} quarters`} hint="Time to full productivity. Enterprise AE: 3–4Q typical." />

            {/* Live preview */}
            {parseFloat(f.quota) > 0 && (
              <div style={{ background: "#F0FAF4", border: "1px solid #B8E8CC", borderRadius: 10, padding: "14px 16px", marginTop: 4 }}>
                <div style={{ fontSize: 9, color: "#1A6B4A", textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 700, marginBottom: 10 }}>
                  Live Preview
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { l: "Full Attainment /yr", v: fmt$(parseFloat(f.quota) * f.attainRate / 100), c: "#2BAE66" },
                    { l: "Monthly at full ramp", v: fmtM(parseFloat(f.quota) * f.attainRate / 100 / 12), c: "#2BAE66" },
                    { l: "Year-1 (with ramp)", v: fmt$(Array.from({ length: 12 }, (_, m) => (parseFloat(f.quota) * f.attainRate / 100 / 12) * rampPct(m, f.rampQ)).reduce((a, b) => a + b, 0)), c: "#1DA1F2" },
                  ].map(x => (
                    <div key={x.l} style={{ background: "#fff", borderRadius: 7, padding: "9px 10px", border: "1px solid #B8E8CC" }}>
                      <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 13, fontWeight: 700, color: x.c }}>{x.v}</div>
                      <div style={{ fontSize: 8, color: "#7AC8A0", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, marginTop: 2 }}>{x.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <RampChart rampQ={f.rampQ} daysDelay={daysApart(f.startDate, today())} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3B: TEAM WIZARD ── */}
        {step === 3 && f.type === "team_drag" && (
          <div>
            <div style={{ fontSize: 21, fontWeight: 700, color: "#0F2846", marginBottom: 5 }}>Cascade Model</div>
            <div style={{ fontSize: 12, color: "#7A9BB8", marginBottom: 22 }}>
              Quantify the second-order drag: team productivity lost + attrition risk.
            </div>

            <SliderField label="Team Size Affected" value={f.teamSize} onChange={v => upd("teamSize", v)} min={1} max={20} step={1}
              fmt={v => `${v} people`} hint="Number of engineers / PMs directly impacted" />

            <Field label="Average Monthly Salary (fully loaded)" hint="Include benefits, overhead. Typical senior eng: $15–25K/mo">
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9AB8CC", fontSize: 14 }}>$</span>
                <input type="number" value={f.avgSalary} onChange={e => upd("avgSalary", parseFloat(e.target.value))} style={{ ...iSt, paddingLeft: 26 }} />
              </div>
            </Field>

            <SliderField label="Productivity Drag %" value={f.dragPct} onChange={v => upd("dragPct", v)} min={5} max={60} step={5}
              fmt={v => `${v}%`} hint="How much slower is the team? Conservative: 15–25%" />

            <SliderField label="Attrition Probability (next 12mo)" value={f.attrProb} onChange={v => upd("attrProb", v)} min={5} max={80} step={5}
              fmt={v => `${v}%`} hint="Chance a good engineer leaves due to this person" />

            <Field label="Replacement Cost (per departure)" hint="Recruiting + onboarding + 6–9mo ramp = $150–250K typical">
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9AB8CC", fontSize: 14 }}>$</span>
                <input type="number" value={f.replaceCost} onChange={e => upd("replaceCost", parseFloat(e.target.value))} style={{ ...iSt, paddingLeft: 26 }} />
              </div>
            </Field>

            {/* Live preview */}
            {f.teamSize > 0 && (
              <div style={{ background: "#FFF8EC", border: "1px solid #F5D98A", borderRadius: 10, padding: "14px 16px", marginTop: 4 }}>
                <div style={{ fontSize: 9, color: "#8B5E00", textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 700, marginBottom: 10 }}>Live Preview</div>
                {(() => {
                  const drag = f.teamSize * f.avgSalary * f.dragPct / 100;
                  const attr = f.attrProb / 100 * f.replaceCost / 12;
                  return (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                        {[
                          { l: "Team Drag /mo",    v: fmtM(drag),        c: "#F0A500" },
                          { l: "Attrition Risk/mo", v: fmtM(attr),       c: "#E0504A" },
                          { l: "Total Cascade /mo", v: fmtM(drag + attr), c: "#0F2846" },
                        ].map(x => (
                          <div key={x.l} style={{ background: "#fff", borderRadius: 7, padding: "9px 10px", border: "1px solid #F5D98A" }}>
                            <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 13, fontWeight: 700, color: x.c }}>{x.v}</div>
                            <div style={{ fontSize: 8, color: "#B89050", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, marginTop: 2 }}>{x.l}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 12, color: "#8B5E00", lineHeight: 1.6, padding: "10px 0 0", borderTop: "1px solid #F5D98A" }}>
                        Direct (salary) <span style={{ fontWeight: 700 }}>{fmtM(monthly)}</span> + Cascade <span style={{ fontWeight: 700 }}>{fmtM(drag + attr)}</span>
                        {" = "}
                        <span style={{ fontWeight: 700, color: "#0F2846" }}>{fmtM(monthly + drag + attr)} total monthly cost</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4: RECLAIM ── */}
        {step === 4 && (
          <div>
            <div style={{ fontSize: 21, fontWeight: 700, color: "#0F2846", marginBottom: 5 }}>Set a RECLAIM target</div>
            <div style={{ fontSize: 12, color: "#7A9BB8", marginBottom: 22, lineHeight: 1.6 }}>
              Beat the date — money saved. Miss it — the counter climbs. Total monthly burn below.
            </div>

            <div style={{ background: "#FEF3F2", border: "1px solid #F8C0BC", borderRadius: 9, padding: "14px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: "#C08080", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 6 }}>Already burning</div>
              <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 26, color: "#E0504A", fontWeight: 700 }}>{fmtM(pc.totalMonthly)}</div>
              {(pc.opp > 0 || pc.cascade > 0) && (
                <div style={{ fontSize: 11, color: "#C08080", marginTop: 6, lineHeight: 1.7 }}>
                  {pc.direct > 0 && <span>Direct {fmtM(pc.direct)} </span>}
                  {pc.opp > 0 && <span>+ Opportunity {fmtM(pc.opp)} </span>}
                  {pc.cascade > 0 && <span>+ Cascade {fmtM(pc.cascade)}</span>}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#4A6A88" }}>Enable RECLAIM tracking</span>
              <div onClick={() => upd("reclaimEnabled", !f.reclaimEnabled)} style={{ width: 44, height: 24, borderRadius: 12, cursor: "pointer", background: f.reclaimEnabled ? "#1DA1F2" : "#E1EAF2", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: f.reclaimEnabled ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
              </div>
            </div>

            {f.reclaimEnabled && (
              <>
                <Field label="Target Resolution Date">
                  <input type="date" value={f.reclaimDate} onChange={e => upd("reclaimDate", e.target.value)} style={iSt} />
                </Field>
                {f.reclaimDate && pc.totalMonthly > 0 && (() => {
                  const dLeft = daysApart(today(), f.reclaimDate);
                  const savings = dLeft * dayRate(pc.totalMonthly);
                  return (
                    <div style={{ background: "#F0FAF4", border: "1px solid #B8E8CC", borderRadius: 9, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#2BAE66", marginBottom: 4 }}>
                        If resolved by {f.reclaimDate}:
                      </div>
                      <div style={{ fontSize: 12, color: "#3A9A60", lineHeight: 1.6 }}>
                        {Math.round(dLeft)} days left · every day earlier saves{" "}
                        <span style={{ fontWeight: 700 }}>{fmt$(dayRate(pc.totalMonthly))}</span>
                        {savings > 0 && <> · total savings from today: <span style={{ fontWeight: 700 }}>{fmt$(savings)}</span></>}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
          {step > 1 && <button onClick={retreat} style={btnS}>← Back</button>}
          {step < 4
            ? <button onClick={() => canNext && advance()} style={{ ...btnP, opacity: canNext ? 1 : 0.35, cursor: canNext ? "pointer" : "not-allowed" }}>Continue →</button>
            : <button onClick={submit} style={btnP}>Add to Counter ✓</button>
          }
          <button onClick={onClose} style={{ ...btnS, flex: "none" }}>✕</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  HEADER COUNTER
// ═══════════════════════════════════════════════════════

function HeaderCounter({ items }) {
  const total = items.reduce((s, i) => s + calcCosts(i).totalMonthly, 0);
  const val   = useLive(total);
  return <FlipRow value={val} size="xl" />;
}

// ═══════════════════════════════════════════════════════
//  SEED DATA
// ═══════════════════════════════════════════════════════

const SEED = [
  {
    id: 1, type: "revenue_role", title: "AE — Enterprise West",
    monthlyCost: 0, startDate: "2026-01-15", note: "Territory uncovered, Q1 pipeline stalling",
    secondOrder: { type: "revenue_role", quota: 1200000, attainRate: 0.70, rampQ: 3 },
    reclaim: { enabled: true, targetDate: "2026-04-30", resolvedDate: null },
  },
  {
    id: 2, type: "team_drag", title: "Senior Engineer (underperforming)",
    monthlyCost: 18000, startDate: "2025-11-01", note: "Blocking 4-person squad — morale + velocity drag",
    secondOrder: { type: "team_blocker", teamSize: 4, avgSalary: 15000, dragPct: 0.25, attrProb: 0.30, replaceCost: 175000 },
    reclaim: { enabled: true, targetDate: "2026-03-31", resolvedDate: null },
  },
  {
    id: 3, type: "delayed_hire", title: "VP of Engineering",
    monthlyCost: 25000, startDate: "2026-01-15", note: "Team bandwidth at risk",
    secondOrder: null,
    reclaim: { enabled: true, targetDate: "2026-04-30", resolvedDate: null },
  },
  {
    id: 4, type: "tool_waste", title: "Unused Salesforce Seats ×12",
    monthlyCost: 3600, startDate: "2026-01-01", note: "$300/seat · zero login activity",
    secondOrder: null,
    reclaim: { enabled: true, targetDate: "2026-03-15", resolvedDate: null },
  },
  {
    id: 5, type: "vendor_cost", title: "Legacy Data Warehouse",
    monthlyCost: 8500, startDate: "2025-10-01", note: "2022 rates — market 40% cheaper",
    secondOrder: null,
    reclaim: { enabled: true, targetDate: "2026-06-30", resolvedDate: null },
  },
];

// ═══════════════════════════════════════════════════════
//  APP
// ═══════════════════════════════════════════════════════

export default function DollarCounter() {
  const [items,   setItems]   = useState(SEED);
  const [tab,     setTab]     = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const filtered     = tab === "all" ? items : items.filter(i => i.type === tab);
  const totalMonthly = items.reduce((s, i) => s + calcCosts(i).totalMonthly, 0);
  const totalAccrued = items.reduce((s, i) => s + calcCosts(i).accrued, 0);
  const overdueCount = items.filter(i => getReclaimStatus(i)?.status === "overdue").length;
  const typeCounts   = items.reduce((a, i) => ({ ...a, [i.type]: (a[i.type] || 0) + 1 }), {});

  const layer2Total = items.filter(i => i.type === "revenue_role").reduce((s, i) => s + calcCosts(i).opp, 0);
  const layer3Total = items.filter(i => i.type === "team_drag").reduce((s, i) => s + calcCosts(i).cascade, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #EEF4FA; }

        @keyframes flipIn {
          0%   { transform: perspective(280px) rotateX(-80deg); opacity: 0.1; }
          100% { transform: perspective(280px) rotateX(0deg); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.3; transform: scale(0.6); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #EEF4FA; }
        ::-webkit-scrollbar-thumb { background: #C8DCF0; border-radius: 2px; }
        input[type=range] { height: 4px; cursor: pointer; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#EEF4FA", fontFamily: '"Inter", system-ui, sans-serif', paddingBottom: 80 }}>

        {/* ── HEADER ── */}
        <div style={{ background: "#0D1F30", padding: "28px 48px 36px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
              <div style={{ width: 40, height: 40, background: "#1DA1F2", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>💸</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#E8F4FD" }}>Dollar Counter</div>
                <div style={{ fontSize: 9, color: "#2A5070", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>
                  Decision Cost Intelligence · Direct + Opportunity + Cascade
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {overdueCount > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(224,80,74,0.15)", border: "1px solid rgba(224,80,74,0.3)", borderRadius: 6, padding: "5px 12px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E0504A", animation: "pulse 1s ease-in-out infinite", display: "inline-block" }} />
                  <span style={{ fontSize: 10, color: "#E0504A", fontWeight: 700 }}>{overdueCount} overdue</span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1DA1F2", boxShadow: "0 0 6px #1DA1F2", display: "inline-block", animation: "pulse 1.6s ease-in-out infinite" }} />
                <span style={{ fontSize: 9, color: "#1DA1F2", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Live</span>
              </div>
            </div>
          </div>

          {/* Board */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 8, color: "#2A5070", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12 }}>
              All Layers · Running Total This Session
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", background: "#060E18", border: "1px solid #1A3050", borderRadius: 10, padding: "16px 22px", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.7), 0 0 0 1px rgba(29,161,242,0.06)" }}>
              <HeaderCounter items={items} />
            </div>
            <div style={{ fontSize: 10, color: "#2A5070", marginTop: 10 }}>
              ${Math.round(totalMonthly / 22 / 8).toLocaleString()} per work-hour
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
            {[
              { l: "Total Accrued",    v: fmt$(totalAccrued),                           c: "#1DA1F2" },
              { l: "Monthly Burn",     v: fmtM(totalMonthly),                           c: "#8ECFF8" },
              { l: "Layer 1 Direct",   v: fmtM(items.reduce((s,i)=>s+i.monthlyCost,0)), c: "#5AAFE0" },
              { l: "Layer 2 Opp.",     v: fmtM(layer2Total),                            c: "#2BAE66" },
              { l: "Layer 3 Cascade",  v: fmtM(layer3Total),                            c: "#F0A500" },
            ].map(s => (
              <div key={s.l} style={{ paddingRight: 24, marginRight: 24, borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 8, color: "#2A5070", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginTop: 3 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CONTROLS ── */}
        <div style={{ padding: "20px 48px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {[["all", "All"], ...Object.entries(TYPES).map(([k, v]) => [k, v.label])].map(([key, label]) => {
              const active = tab === key;
              const info   = TYPES[key];
              const count  = key === "all" ? items.length : (typeCounts[key] || 0);
              return (
                <button key={key} onClick={() => setTab(key)} style={{
                  padding: "7px 13px", borderRadius: 7, cursor: "pointer",
                  border: active ? `1px solid ${info?.color || "#1DA1F2"}50` : "1px solid #D5E5F5",
                  background: active ? "#fff" : "transparent",
                  color: active ? (info?.color || "#1DA1F2") : "#7A9BB8",
                  fontSize: 11, fontWeight: 600, transition: "all 0.15s",
                  boxShadow: active ? "0 1px 4px rgba(29,161,242,0.1)" : "none",
                }}>
                  {key !== "all" && info ? `${info.icon} ` : ""}{label}
                  {count > 0 && <span style={{ marginLeft: 5, background: "#EEF4FA", borderRadius: 3, padding: "1px 5px", fontSize: 9, color: "#9AB8CC" }}>{count}</span>}
                </button>
              );
            })}
          </div>
          <button onClick={() => setShowAdd(true)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 20px", background: "#1DA1F2", color: "#fff", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 12px rgba(29,161,242,0.3)" }}>
            + Add Decision
          </button>
        </div>

        {/* ── GRID ── */}
        <div style={{ padding: "18px 48px 0", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 14 }}>
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 24px", color: "#9AB8CC", fontSize: 13 }}>
              No decisions tracked here.
            </div>
          )}
          {filtered.map(item => (
            <DecisionCard
              key={item.id} item={item}
              onRemove={id => setItems(p => p.filter(i => i.id !== id))}
              onResolve={(id, d) => setItems(p => p.map(i => i.id === id ? { ...i, reclaim: { ...i.reclaim, resolvedDate: d } } : i))}
            />
          ))}
        </div>
      </div>

      {showAdd && <AddModal onAdd={item => setItems(p => [...p, item])} onClose={() => setShowAdd(false)} />}
    </>
  );
}
