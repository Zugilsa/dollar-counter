'use client';

import React from 'react';
import { SprintSecondOrder } from '@/lib/types';
import { fmt$ } from '@/lib/costs';

interface DeliveryPanelProps {
  so: SprintSecondOrder;
  onDeliver: () => void;
}

export default function DeliveryPanel({ so, onDeliver }: DeliveryPanelProps) {
  const totalMonthly = so.teamSize * so.avgSalary + so.expectedRevenue;
  const weeklyRate = totalMonthly / 4.33;

  if (so.deliveredDate) {
    const deliveredMs = new Date(so.deliveredDate).getTime();
    const targetMs = new Date(so.originalTargetDate).getTime();
    const diffDays = Math.round((deliveredMs - targetMs) / 86400000);
    const diffWeeks = (deliveredMs - targetMs) / (7 * 86400000);
    const costDelta = diffWeeks * weeklyRate;
    const isEarly = diffDays < 0;
    const isOnTime = diffDays === 0;

    return (
      <div
        className="rounded-lg p-4"
        style={{
          backgroundColor: isEarly ? '#ECFDF5' : isOnTime ? '#F0F9FF' : '#FEF2F2',
          border: `1px solid ${isEarly ? '#A7F3D0' : isOnTime ? '#BAE6FD' : '#FECACA'}`,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">
            {isEarly ? '🟢' : isOnTime ? '🔵' : '🔴'}
          </span>
          <span
            className="text-sm font-bold"
            style={{ color: isEarly ? '#059669' : isOnTime ? '#0284C7' : '#DC2626' }}
          >
            {isEarly
              ? `Delivered ${Math.abs(diffDays)}d early`
              : isOnTime
              ? 'Delivered on time'
              : `Delivered ${diffDays}d late`}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Delivered on {so.deliveredDate}
          </span>
          <span
            className="font-bold tabular-nums"
            style={{ color: isEarly ? '#059669' : isOnTime ? '#0284C7' : '#DC2626' }}
          >
            {isEarly ? '-' : '+'}{fmt$(Math.abs(costDelta))}
          </span>
        </div>
      </div>
    );
  }

  // Not yet delivered
  const today = new Date();
  const targetMs = new Date(so.originalTargetDate).getTime();
  const daysToTarget = Math.round((targetMs - today.getTime()) / 86400000);
  const isOverdue = daysToTarget < 0;

  return (
    <div
      className="rounded-lg p-4"
      style={{
        backgroundColor: isOverdue ? '#FEF2F2' : '#F8FAFC',
        border: `1px solid ${isOverdue ? '#FECACA' : '#E1EAF2'}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Delivery Status
          </span>
          <p
            className="text-sm font-semibold mt-0.5"
            style={{ color: isOverdue ? '#DC2626' : '#64748B' }}
          >
            {isOverdue
              ? `${Math.abs(daysToTarget)}d overdue`
              : `${daysToTarget}d until target`}
          </p>
        </div>
        <button
          type="button"
          onClick={onDeliver}
          className="px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all
                     hover:shadow-md active:scale-[0.98]"
          style={{ background: '#2BAE66' }}
        >
          Mark Delivered
        </button>
      </div>
      {isOverdue && (
        <p className="text-xs text-red-500">
          Extra cost: {fmt$(Math.abs(daysToTarget / 7) * weeklyRate)} since target date
        </p>
      )}
    </div>
  );
}
