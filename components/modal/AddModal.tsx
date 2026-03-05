'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Decision,
  DecisionType,
  SecondOrder,
  TYPES,
  MeetingAttendee,
} from '@/lib/types';
import Step1Type from './steps/Step1Type';
import Step2Basic from './steps/Step2Basic';
import Step3Revenue from './steps/Step3Revenue';
import Step3Team from './steps/Step3Team';
import Step3Sprint from './steps/Step3Sprint';
import Step3Meeting from './steps/Step3Meeting';
import Step3EngTime from './steps/Step3EngTime';
import Step4Reclaim from './steps/Step4Reclaim';
import CostPreview from './CostPreview';

interface AddModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (
    decision: Omit<Decision, 'id' | 'createdAt' | 'updatedAt'>
  ) => void;
}

// ── Default form state ──────────────────────────────────
const defaultForm = {
  type: null as DecisionType | null,
  title: '',
  monthlyCost: 0,
  startDate: new Date().toISOString().split('T')[0],
  note: '',
  // Revenue wizard
  quota: 500000,
  attainRate: 0.7,
  rampQ: 3,
  // Team wizard
  teamSize: 5,
  avgSalary: 12000,
  dragPct: 0.2,
  attrProb: 0.15,
  replaceCost: 50000,
  // Sprint wizard
  sprintTeamSize: 5,
  sprintAvgSalary: 12000,
  sprintExpectedRevenue: 50000,
  sprintOriginalTargetDate: '',
  sprintDelays: [] as { date: string; weeksDelayed: number; reason: string }[],
  // Meeting wizard
  meetingOriginalMinutes: 60,
  meetingOptimizedMinutes: 20,
  meetingFrequencyPerWeek: 1,
  meetingAttendees: [
    { role: 'CEO', hourlyCost: 350, count: 1 },
    { role: 'CTO', hourlyCost: 325, count: 1 },
    { role: 'Other', hourlyCost: 100, count: 1 },
  ] as MeetingAttendee[],
  // Eng time wizard
  engEngineerCount: 53,
  engAvgMonthlyCost: 15000,
  engCurrentCodingPct: 0.5,
  engTargetCodingPct: 0.7,
  // Reclaim
  reclaimEnabled: false,
  reclaimTargetDate: '',
};

type FormState = typeof defaultForm;

// ── Helpers ─────────────────────────────────────────────
function hasWizard(type: DecisionType | null): boolean {
  if (!type) return false;
  return TYPES[type].wizard !== null;
}

function wizardType(type: DecisionType | null): 'revenue' | 'team' | 'sprint' | 'meeting' | 'eng_time' | null {
  if (!type) return null;
  return TYPES[type].wizard as 'revenue' | 'team' | 'sprint' | 'meeting' | 'eng_time' | null;
}

function totalSteps(type: DecisionType | null): number {
  return hasWizard(type) ? 4 : 3;
}

// Map logical step to display step for non-wizard types
// Non-wizard: step 1 = Type, step 2 = Basic, step 3 = Reclaim (skip wizard)
// Wizard:     step 1 = Type, step 2 = Basic, step 3 = Wizard,  step 4 = Reclaim
function getLogicalStep(step: number, type: DecisionType | null): string {
  if (hasWizard(type)) {
    switch (step) {
      case 1: return 'type';
      case 2: return 'basic';
      case 3: return 'wizard';
      case 4: return 'reclaim';
      default: return 'type';
    }
  } else {
    switch (step) {
      case 1: return 'type';
      case 2: return 'basic';
      case 3: return 'reclaim';
      default: return 'type';
    }
  }
}

export default function AddModal({ open, onClose, onSave }: AddModalProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({ ...defaultForm });
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  // Build second-order for preview
  const secondOrder: SecondOrder = useMemo(() => {
    if (form.type === 'revenue_role') {
      return {
        type: 'revenue_role' as const,
        quota: form.quota,
        attainRate: form.attainRate,
        rampQ: form.rampQ,
      };
    }
    if (form.type === 'team_drag') {
      return {
        type: 'team_blocker' as const,
        teamSize: form.teamSize,
        avgSalary: form.avgSalary,
        dragPct: form.dragPct,
        attrProb: form.attrProb,
        replaceCost: form.replaceCost,
      };
    }
    if (form.type === 'sprint_delay') {
      return {
        type: 'sprint_delay' as const,
        teamSize: form.sprintTeamSize,
        avgSalary: form.sprintAvgSalary,
        expectedRevenue: form.sprintExpectedRevenue,
        originalTargetDate: form.sprintOriginalTargetDate,
        delays: form.sprintDelays,
        deliveredDate: null,
      };
    }
    if (form.type === 'meeting_waste') {
      return {
        type: 'meeting_waste' as const,
        originalMinutes: form.meetingOriginalMinutes,
        optimizedMinutes: form.meetingOptimizedMinutes,
        frequencyPerWeek: form.meetingFrequencyPerWeek,
        attendees: form.meetingAttendees,
      };
    }
    if (form.type === 'eng_time') {
      return {
        type: 'eng_time' as const,
        engineerCount: form.engEngineerCount,
        avgMonthlyCost: form.engAvgMonthlyCost,
        currentCodingPct: form.engCurrentCodingPct,
        targetCodingPct: form.engTargetCodingPct,
      };
    }
    return null;
  }, [form.type, form.quota, form.attainRate, form.rampQ, form.teamSize, form.avgSalary, form.dragPct, form.attrProb, form.replaceCost, form.sprintTeamSize, form.sprintAvgSalary, form.sprintExpectedRevenue, form.sprintOriginalTargetDate, form.sprintDelays, form.meetingOriginalMinutes, form.meetingOptimizedMinutes, form.meetingFrequencyPerWeek, form.meetingAttendees, form.engEngineerCount, form.engAvgMonthlyCost, form.engCurrentCodingPct, form.engTargetCodingPct]);

  // Compute total monthly for reclaim preview
  const totalMonthly = useMemo(() => {
    let total = form.monthlyCost;
    if (secondOrder?.type === 'revenue_role') {
      const fullMonthly = (secondOrder.quota * secondOrder.attainRate) / 12;
      total += fullMonthly;
    }
    if (secondOrder?.type === 'team_blocker') {
      const teamDrag = secondOrder.teamSize * secondOrder.avgSalary * secondOrder.dragPct;
      const attrRisk = (secondOrder.attrProb * secondOrder.replaceCost) / 12;
      total += teamDrag + attrRisk;
    }
    if (secondOrder?.type === 'sprint_delay') {
      total = secondOrder.teamSize * secondOrder.avgSalary + secondOrder.expectedRevenue;
    }
    if (secondOrder?.type === 'meeting_waste') {
      const minutesSaved = secondOrder.originalMinutes - secondOrder.optimizedMinutes;
      const totalHourlyCost = secondOrder.attendees.reduce((s, a) => s + a.hourlyCost * a.count, 0);
      const savingsPerMeeting = (minutesSaved / 60) * totalHourlyCost;
      total = -(savingsPerMeeting * secondOrder.frequencyPerWeek * 4.33);
    }
    if (secondOrder?.type === 'eng_time') {
      const teamCost = secondOrder.engineerCount * secondOrder.avgMonthlyCost;
      const wastedPct = (1 - secondOrder.currentCodingPct) - (1 - secondOrder.targetCodingPct);
      total = -(teamCost * wastedPct);
    }
    return total;
  }, [form.monthlyCost, secondOrder]);

  const maxStep = totalSteps(form.type);
  const logicalStep = getLogicalStep(step, form.type);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = useCallback((field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleNext = useCallback(() => {
    if (step < maxStep) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }, [step, maxStep]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }, [step]);

  const handleReset = useCallback(() => {
    setStep(1);
    setForm({ ...defaultForm });
    setDirection(1);
    onClose();
  }, [onClose]);

  const handleSave = useCallback(() => {
    if (!form.type) return;

    const decision: Omit<Decision, 'id' | 'createdAt' | 'updatedAt'> = {
      type: form.type,
      title: form.title,
      monthlyCost: form.monthlyCost,
      startDate: form.startDate,
      note: form.note || undefined,
      secondOrder,
      reclaim: {
        enabled: form.reclaimEnabled,
        targetDate: form.reclaimTargetDate,
        resolvedDate: null,
      },
    };

    onSave(decision);
    handleReset();
  }, [form, secondOrder, onSave, handleReset]);

  // ── Validation ──────────────────────────────────────
  const canProceed = useMemo((): boolean => {
    switch (logicalStep) {
      case 'type':
        return form.type !== null;
      case 'basic':
        // These types compute cost from wizard — don't require monthlyCost
        if (form.type === 'sprint_delay' || form.type === 'meeting_waste' || form.type === 'eng_time') {
          return form.title.trim().length > 0 && form.startDate.length > 0;
        }
        return form.title.trim().length > 0 && form.monthlyCost > 0 && form.startDate.length > 0;
      case 'wizard':
        if (wizardType(form.type) === 'revenue') {
          return form.quota > 0;
        }
        if (wizardType(form.type) === 'team') {
          return form.teamSize > 0 && form.avgSalary > 0;
        }
        if (wizardType(form.type) === 'sprint') {
          return form.sprintTeamSize > 0 && form.sprintAvgSalary > 0 && form.sprintOriginalTargetDate.length > 0;
        }
        if (wizardType(form.type) === 'meeting') {
          return form.meetingAttendees.length > 0 && form.meetingOriginalMinutes > form.meetingOptimizedMinutes;
        }
        if (wizardType(form.type) === 'eng_time') {
          return form.engEngineerCount > 0 && form.engAvgMonthlyCost > 0 && form.engTargetCodingPct > form.engCurrentCodingPct;
        }
        return true;
      case 'reclaim':
        // Reclaim is optional -- always valid
        return true;
      default:
        return false;
    }
  }, [logicalStep, form.type, form.title, form.monthlyCost, form.startDate, form.quota, form.teamSize, form.avgSalary, form.sprintTeamSize, form.sprintAvgSalary, form.sprintOriginalTargetDate, form.meetingAttendees, form.meetingOriginalMinutes, form.meetingOptimizedMinutes, form.engEngineerCount, form.engAvgMonthlyCost, form.engCurrentCodingPct, form.engTargetCodingPct]);

  const isFinalStep = step === maxStep;

  // Animation variants for step transitions
  const variants = {
    enter: (d: number) => ({
      x: d > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (d: number) => ({
      x: d > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleReset}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <div
              className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl
                         shadow-2xl max-h-[95vh] sm:max-h-[85vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#E1EAF2] shrink-0">
                <h2 className="text-lg font-bold text-slate-800">
                  Add Decision
                </h2>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-8 h-8 flex items-center justify-center rounded-full
                             text-slate-400 hover:text-slate-600 hover:bg-slate-100
                             transition-colors"
                  aria-label="Close"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M12 4L4 12M4 4l8 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2 py-3 shrink-0">
                {Array.from({ length: maxStep }, (_, i) => {
                  const dotStep = i + 1;
                  const isActive = dotStep === step;
                  const isComplete = dotStep < step;
                  return (
                    <div
                      key={dotStep}
                      className={`
                        rounded-full transition-all duration-200
                        ${
                          isActive
                            ? 'w-8 h-2 bg-[#1DA1F2]'
                            : isComplete
                            ? 'w-2 h-2 bg-[#1DA1F2]'
                            : 'w-2 h-2 bg-[#E1EAF2]'
                        }
                      `}
                    />
                  );
                })}
              </div>

              {/* Step content */}
              <div className="flex-1 overflow-y-auto px-6 pb-2">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={`step-${step}`}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  >
                    {logicalStep === 'type' && (
                      <Step1Type
                        selected={form.type}
                        onSelect={(t) => handleChange('type', t)}
                      />
                    )}

                    {logicalStep === 'basic' && (
                      <Step2Basic
                        title={form.title}
                        monthlyCost={form.monthlyCost}
                        startDate={form.startDate}
                        note={form.note}
                        onChange={handleChange}
                      />
                    )}

                    {logicalStep === 'wizard' &&
                      wizardType(form.type) === 'revenue' && (
                        <Step3Revenue
                          quota={form.quota}
                          attainRate={form.attainRate}
                          rampQ={form.rampQ}
                          onChange={handleChange}
                        />
                      )}

                    {logicalStep === 'wizard' &&
                      wizardType(form.type) === 'team' && (
                        <Step3Team
                          teamSize={form.teamSize}
                          avgSalary={form.avgSalary}
                          dragPct={form.dragPct}
                          attrProb={form.attrProb}
                          replaceCost={form.replaceCost}
                          onChange={handleChange}
                        />
                      )}

                    {logicalStep === 'wizard' &&
                      wizardType(form.type) === 'sprint' && (
                        <Step3Sprint
                          teamSize={form.sprintTeamSize}
                          avgSalary={form.sprintAvgSalary}
                          expectedRevenue={form.sprintExpectedRevenue}
                          originalTargetDate={form.sprintOriginalTargetDate}
                          delays={form.sprintDelays}
                          onChange={handleChange}
                        />
                      )}

                    {logicalStep === 'wizard' &&
                      wizardType(form.type) === 'meeting' && (
                        <Step3Meeting
                          originalMinutes={form.meetingOriginalMinutes}
                          optimizedMinutes={form.meetingOptimizedMinutes}
                          frequencyPerWeek={form.meetingFrequencyPerWeek}
                          attendees={form.meetingAttendees}
                          onChange={handleChange}
                        />
                      )}

                    {logicalStep === 'wizard' &&
                      wizardType(form.type) === 'eng_time' && (
                        <Step3EngTime
                          engineerCount={form.engEngineerCount}
                          avgMonthlyCost={form.engAvgMonthlyCost}
                          currentCodingPct={form.engCurrentCodingPct}
                          targetCodingPct={form.engTargetCodingPct}
                          onChange={handleChange}
                        />
                      )}

                    {logicalStep === 'reclaim' && form.type && (
                      <Step4Reclaim
                        enabled={form.reclaimEnabled}
                        targetDate={form.reclaimTargetDate}
                        onChange={handleChange}
                        totalMonthly={totalMonthly}
                        startDate={form.startDate}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Cost Preview (shown on steps 2+) */}
                {step >= 2 && form.type && (
                  <div className="mt-4">
                    <CostPreview
                      monthlyCost={form.monthlyCost}
                      type={form.type}
                      secondOrder={secondOrder}
                    />
                  </div>
                )}
              </div>

              {/* Footer navigation */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#E1EAF2] shrink-0 bg-white">
                <button
                  type="button"
                  onClick={step === 1 ? handleReset : handleBack}
                  className="px-4 py-2 text-sm font-medium text-slate-500
                             hover:text-slate-700 transition-colors rounded-lg
                             hover:bg-slate-50"
                >
                  {step === 1 ? 'Cancel' : 'Back'}
                </button>

                <button
                  type="button"
                  onClick={isFinalStep ? handleSave : handleNext}
                  disabled={!canProceed}
                  className={`
                    px-6 py-2.5 text-sm font-semibold rounded-xl
                    transition-all duration-150 shadow-sm
                    ${
                      canProceed
                        ? isFinalStep
                          ? 'bg-gradient-to-r from-[#2BAE66] to-[#229955] text-white hover:shadow-md active:scale-[0.98]'
                          : 'bg-[#1DA1F2] text-white hover:bg-[#0D8CE0] hover:shadow-md active:scale-[0.98]'
                        : 'bg-[#E1EAF2] text-slate-400 cursor-not-allowed'
                    }
                  `}
                >
                  {isFinalStep ? 'Save Decision' : 'Next'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
