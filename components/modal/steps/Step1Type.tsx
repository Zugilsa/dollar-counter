'use client';

import React from 'react';
import { DecisionType, TYPES } from '@/lib/types';

interface Step1TypeProps {
  selected: DecisionType | null;
  onSelect: (t: DecisionType) => void;
}

const typeKeys = Object.keys(TYPES) as DecisionType[];

export default function Step1Type({ selected, onSelect }: Step1TypeProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-bold text-slate-800">What type of decision?</h3>
        <p className="text-sm text-slate-500 mt-1">
          Select the category that best describes this cost.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {typeKeys.map((key) => {
          const t = TYPES[key];
          const isSelected = selected === key;
          const hasWizard = t.wizard !== null;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={`
                relative flex flex-col items-center justify-center gap-2
                rounded-xl px-3 py-5 text-center transition-all duration-150
                cursor-pointer select-none
                ${
                  isSelected
                    ? 'border-2 border-[#1DA1F2] bg-blue-50 shadow-sm'
                    : 'border border-[#E1EAF2] bg-white hover:border-[#1DA1F2] hover:shadow-sm'
                }
              `}
            >
              {/* Wizard badge */}
              {hasWizard && (
                <span
                  className="absolute -top-2 right-2 rounded-full px-2 py-0.5
                             text-[9px] font-bold uppercase tracking-wider
                             bg-gradient-to-r from-[#1DA1F2] to-[#0D8CE0] text-white
                             shadow-sm whitespace-nowrap"
                >
                  + 2nd Order Wizard
                </span>
              )}

              {/* Icon */}
              <span
                className="text-3xl leading-none"
                style={{ color: t.color }}
              >
                {t.icon}
              </span>

              {/* Label */}
              <span className="text-sm font-semibold text-slate-800">
                {t.label}
              </span>

              {/* Subtitle */}
              <span className="text-[11px] text-slate-400 leading-tight">
                {t.sub}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
