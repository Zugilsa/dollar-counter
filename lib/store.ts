import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Decision } from './types';

export type ViewMode = 'active' | 'completed';

interface DecisionStore {
  decisions: Decision[];
  tab: string;
  view: ViewMode;
  showAdd: boolean;
  setDecisions: (d: Decision[]) => void;
  addDecision: (d: Decision) => void;
  updateDecision: (id: string, d: Partial<Decision>) => void;
  removeDecision: (id: string) => void;
  resolveDecision: (id: string, date: string) => void;
  deliverDecision: (id: string, date: string) => void;
  setTab: (t: string) => void;
  setView: (v: ViewMode) => void;
  toggleAdd: () => void;
}

export function isCompleted(d: Decision): boolean {
  if (d.reclaim?.resolvedDate) return true;
  if (d.secondOrder?.type === 'sprint_delay' && d.secondOrder.deliveredDate) return true;
  return false;
}

export const useDecisionStore = create<DecisionStore>()(
  persist(
    (set) => ({
  decisions: [],
  tab: 'all',
  view: 'active' as ViewMode,
  showAdd: false,

  setDecisions: (decisions) => set({ decisions }),

  addDecision: (decision) =>
    set((state) => ({
      decisions: [...state.decisions, decision],
    })),

  updateDecision: (id, partial) =>
    set((state) => ({
      decisions: state.decisions.map((d) =>
        d.id === id
          ? { ...d, ...partial, updatedAt: new Date().toISOString() }
          : d
      ),
    })),

  removeDecision: (id) =>
    set((state) => ({
      decisions: state.decisions.filter((d) => d.id !== id),
    })),

  resolveDecision: (id, date) =>
    set((state) => ({
      decisions: state.decisions.map((d) =>
        d.id === id
          ? {
              ...d,
              reclaim: { ...d.reclaim, resolvedDate: date },
              updatedAt: new Date().toISOString(),
            }
          : d
      ),
    })),

  deliverDecision: (id, date) =>
    set((state) => ({
      decisions: state.decisions.map((d) =>
        d.id === id && d.secondOrder?.type === 'sprint_delay'
          ? {
              ...d,
              secondOrder: { ...d.secondOrder, deliveredDate: date },
              updatedAt: new Date().toISOString(),
            }
          : d
      ),
    })),

  setTab: (tab) => set({ tab }),

  setView: (view) => set({ view }),

  toggleAdd: () => set((state) => ({ showAdd: !state.showAdd })),
}),
    {
      name: 'dollar-counter-decisions',
      partialize: (state) => ({ decisions: state.decisions }),
    }
  )
);
