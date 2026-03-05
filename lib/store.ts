import { create } from 'zustand';
import { Decision } from './types';

interface DecisionStore {
  decisions: Decision[];
  tab: string;
  showAdd: boolean;
  setDecisions: (d: Decision[]) => void;
  addDecision: (d: Decision) => void;
  updateDecision: (id: string, d: Partial<Decision>) => void;
  removeDecision: (id: string) => void;
  resolveDecision: (id: string, date: string) => void;
  deliverDecision: (id: string, date: string) => void;
  setTab: (t: string) => void;
  toggleAdd: () => void;
}

export const useDecisionStore = create<DecisionStore>((set) => ({
  decisions: [],
  tab: 'all',
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

  toggleAdd: () => set((state) => ({ showAdd: !state.showAdd })),
}));
