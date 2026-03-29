"use client";

import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { useDecisionStore, isCompleted, ViewMode } from "@/lib/store";
import { Decision, TYPES } from "@/lib/types";
import { toPng } from "html-to-image";
import DashboardHeader from "@/components/header/DashboardHeader";
import TabBar from "@/components/ui/TabBar";
import DecisionCard from "@/components/cards/DecisionCard";
import AddModal from "@/components/modal/AddModal";

export default function Home() {
  const {
    decisions,
    tab,
    view,
    showAdd,
    setDecisions,
    addDecision,
    removeDecision,
    resolveDecision,
    deliverDecision,
    setTab,
    setView,
    toggleAdd,
  } = useDecisionStore();

  // Fetch decisions on mount — merge API data with any local-only decisions
  useEffect(() => {
    fetch("/api/decisions")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        // Keep local-only decisions that aren't in the API response
        const apiIds = new Set(data.map((d: Decision) => d.id));
        const localOnly = decisions.filter(
          (d) => d.id.startsWith("local_") && !apiIds.has(d.id)
        );
        setDecisions([...data, ...localOnly]);
      })
      .catch(() => {
        // API unavailable — keep whatever is in localStorage (via persist)
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setDecisions]);

  // Filter by view (active vs completed) then by tab
  const viewFiltered = useMemo(
    () =>
      view === "active"
        ? decisions.filter((d) => !isCompleted(d))
        : decisions.filter((d) => isCompleted(d)),
    [decisions, view]
  );

  const filtered = useMemo(
    () =>
      tab === "all"
        ? viewFiltered
        : viewFiltered.filter((d) => d.type === tab),
    [viewFiltered, tab]
  );

  // Tab counts (based on current view)
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: viewFiltered.length };
    for (const t of Object.keys(TYPES)) {
      c[t] = viewFiltered.filter((d) => d.type === t).length;
    }
    return c;
  }, [viewFiltered]);

  // Counts for the view toggle
  const activeCount = useMemo(
    () => decisions.filter((d) => !isCompleted(d)).length,
    [decisions]
  );
  const completedCount = useMemo(
    () => decisions.filter((d) => isCompleted(d)).length,
    [decisions]
  );

  // Add decision handler
  // Note: AddModal already closes itself via handleReset/onClose — do NOT call toggleAdd here
  const handleAdd = useCallback(
    async (d: Omit<Decision, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const localDecision: Decision = {
        ...d,
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: now,
        updatedAt: now,
      };

      try {
        const res = await fetch("/api/decisions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(d),
        });
        if (res.ok) {
          const created = await res.json();
          if (created && created.id) {
            addDecision(created);
            return;
          }
        }
      } catch {
        // API unavailable — fall through to local add
      }

      // Add locally even if API fails
      addDecision(localDecision);
    },
    [addDecision]
  );

  // Delete decision handler — always remove locally
  const handleDelete = useCallback(
    async (id: string) => {
      removeDecision(id);
      try {
        await fetch(`/api/decisions/${id}`, { method: "DELETE" });
      } catch {
        // Local removal already done
      }
    },
    [removeDecision]
  );

  // Deliver sprint decision handler — always update locally
  const handleDeliver = useCallback(
    async (id: string) => {
      const today = new Date().toISOString().split("T")[0];
      deliverDecision(id, today);
      try {
        await fetch(`/api/decisions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deliveredDate: today }),
        });
      } catch {
        // Local update already done
      }
    },
    [deliverDecision]
  );

  // Resolve decision handler — always update locally
  // ── Export as PNG ──────────────────────────────────────
  const exportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!exportRef.current || exporting) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(exportRef.current, {
        backgroundColor: "#EEF4FA",
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      const viewLabel = view === "completed" ? "resolved" : "active";
      const tabLabel = tab === "all" ? "" : `-${tab.replace(/_/g, "-")}`;
      link.download = `dollar-counter-${viewLabel}${tabLabel}-${date}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }, [exporting, view, tab]);

  const handleResolve = useCallback(
    async (id: string) => {
      const today = new Date().toISOString().split("T")[0];
      resolveDecision(id, today);
      try {
        await fetch(`/api/decisions/${id}/resolve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resolvedDate: today }),
        });
      } catch {
        // Local update already done
      }
    },
    [resolveDecision]
  );

  return (
    <div className="min-h-screen" style={{ background: "#EEF4FA" }}>
      {/* Exportable area: header + main content */}
      <div ref={exportRef}>
      {/* Header */}
      <DashboardHeader decisions={decisions} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* View toggle + Add button row */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div
            className="inline-flex rounded-full p-1 relative"
            style={{ background: '#E1EAF2' }}
          >
            {/* Sliding pill indicator */}
            <div
              className="absolute top-1 bottom-1 rounded-full transition-all duration-200 ease-out shadow-sm"
              style={{
                width: 'calc(50% - 4px)',
                left: view === 'active' ? 4 : 'calc(50%)',
                background: view === 'active' ? '#fff' : '#fff',
              }}
            />
            {([
              { key: 'active' as ViewMode, label: 'Active', count: activeCount, activeColor: 'text-slate-800' },
              { key: 'completed' as ViewMode, label: 'Resolved', count: completedCount, activeColor: 'text-emerald-700' },
            ]).map(({ key, label, count, activeColor }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`
                  relative z-10 inline-flex items-center gap-1.5 px-4 sm:px-5 py-2
                  text-sm font-semibold rounded-full transition-colors duration-200
                  ${
                    view === key
                      ? activeColor
                      : 'text-slate-400 hover:text-slate-600'
                  }
                `}
              >
                {view === key && key === 'completed' && (
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
                {label}
                <span
                  className={`
                    inline-flex items-center justify-center
                    min-w-[20px] h-5 px-1.5 text-xs font-bold
                    rounded-full tabular-nums
                    ${
                      view === key
                        ? key === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                        : 'bg-transparent text-slate-400'
                    }
                  `}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-md active:scale-95
                ${exporting ? 'bg-slate-200 text-slate-400 cursor-wait' : 'bg-white text-slate-600 border border-[#E1EAF2] hover:bg-slate-50'}`}
              title="Export as PNG"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export'}</span>
            </button>
            <button
              onClick={toggleAdd}
              className="flex-shrink-0 flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-white font-semibold text-sm transition-all hover:shadow-lg active:scale-95"
              style={{ background: "#1DA1F2" }}
            >
              <span className="text-lg leading-none">+</span>
              <span className="hidden sm:inline">Add Decision</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
        {/* Tab bar */}
        <div className="mb-6">
          <TabBar active={tab} onChange={setTab} counts={counts} />
        </div>

        {/* Decision Cards Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-30">&#9672;</div>
            <p className="text-slate-400 text-lg font-medium">
              {view === "completed"
                ? "No completed savings yet"
                : "No decisions tracked yet"}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {view === "completed"
                ? "Resolve active decisions to see your savings here"
                : 'Click "Add Decision" to start quantifying your decision costs'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filtered.map((d) => (
              <DecisionCard
                key={d.id}
                decision={d}
                onDelete={handleDelete}
                onResolve={handleResolve}
                onDeliver={handleDeliver}
              />
            ))}
          </div>
        )}
      </main>
      </div>{/* end exportable area */}

      {/* Add Modal */}
      <AddModal open={showAdd} onClose={toggleAdd} onSave={handleAdd} />
    </div>
  );
}
