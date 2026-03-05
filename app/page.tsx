"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useDecisionStore } from "@/lib/store";
import { Decision, TYPES } from "@/lib/types";
import DashboardHeader from "@/components/header/DashboardHeader";
import TabBar from "@/components/ui/TabBar";
import DecisionCard from "@/components/cards/DecisionCard";
import AddModal from "@/components/modal/AddModal";

export default function Home() {
  const {
    decisions,
    tab,
    showAdd,
    setDecisions,
    addDecision,
    removeDecision,
    resolveDecision,
    deliverDecision,
    setTab,
    toggleAdd,
  } = useDecisionStore();

  // Fetch decisions on mount
  useEffect(() => {
    fetch("/api/decisions")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDecisions(data);
      })
      .catch(console.error);
  }, [setDecisions]);

  // Filter by tab
  const filtered = useMemo(
    () =>
      tab === "all"
        ? decisions
        : decisions.filter((d) => d.type === tab),
    [decisions, tab]
  );

  // Tab counts
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: decisions.length };
    for (const t of Object.keys(TYPES)) {
      c[t] = decisions.filter((d) => d.type === t).length;
    }
    return c;
  }, [decisions]);

  // Add decision handler
  // Note: AddModal already closes itself via handleReset/onClose — do NOT call toggleAdd here
  const handleAdd = useCallback(
    async (d: Omit<Decision, "id" | "createdAt" | "updatedAt">) => {
      try {
        const res = await fetch("/api/decisions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(d),
        });
        if (!res.ok) {
          console.error("Failed to save decision:", res.status);
          return;
        }
        const created = await res.json();
        if (created && created.id) {
          addDecision(created);
        }
      } catch (e) {
        console.error("Failed to create decision:", e);
      }
    },
    [addDecision]
  );

  // Delete decision handler
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/decisions/${id}`, { method: "DELETE" });
        removeDecision(id);
      } catch (e) {
        console.error("Failed to delete:", e);
      }
    },
    [removeDecision]
  );

  // Deliver sprint decision handler
  const handleDeliver = useCallback(
    async (id: string) => {
      const today = new Date().toISOString().split("T")[0];
      try {
        await fetch(`/api/decisions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deliveredDate: today }),
        });
        deliverDecision(id, today);
      } catch (e) {
        console.error("Failed to deliver:", e);
      }
    },
    [deliverDecision]
  );

  // Resolve decision handler
  const handleResolve = useCallback(
    async (id: string) => {
      const today = new Date().toISOString().split("T")[0];
      try {
        await fetch(`/api/decisions/${id}/resolve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resolvedDate: today }),
        });
        resolveDecision(id, today);
      } catch (e) {
        console.error("Failed to resolve:", e);
      }
    },
    [resolveDecision]
  );

  return (
    <div className="min-h-screen" style={{ background: "#EEF4FA" }}>
      {/* Header */}
      <DashboardHeader decisions={decisions} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab bar + Add button */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <TabBar active={tab} onChange={setTab} counts={counts} />
          </div>
          <button
            onClick={toggleAdd}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-[9px] text-white font-semibold text-sm transition-all hover:shadow-lg active:scale-95"
            style={{ background: "#1DA1F2" }}
          >
            <span className="text-lg leading-none">+</span>
            Add Decision
          </button>
        </div>

        {/* Decision Cards Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-30">&#9672;</div>
            <p className="text-slate-400 text-lg font-medium">
              No decisions tracked yet
            </p>
            <p className="text-slate-400 text-sm mt-1">
              Click &quot;Add Decision&quot; to start quantifying your decision
              costs
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

      {/* Add Modal */}
      <AddModal open={showAdd} onClose={toggleAdd} onSave={handleAdd} />
    </div>
  );
}
