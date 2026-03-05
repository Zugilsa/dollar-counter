'use client';

import React from 'react';
import SliderField from '@/components/ui/SliderField';
import { ROLE_PRESETS, MeetingAttendee } from '@/lib/types';
import { fmt$ } from '@/lib/costs';

interface Step3MeetingProps {
  originalMinutes: number;
  optimizedMinutes: number;
  frequencyPerWeek: number;
  attendees: MeetingAttendee[];
  onChange: (field: string, value: unknown) => void;
}

export default function Step3Meeting({
  originalMinutes,
  optimizedMinutes,
  frequencyPerWeek,
  attendees,
  onChange,
}: Step3MeetingProps) {
  const toggleRole = (role: string, hourlyCost: number) => {
    const exists = attendees.find((a) => a.role === role);
    if (exists) {
      onChange(
        'meetingAttendees',
        attendees.filter((a) => a.role !== role)
      );
    } else {
      onChange('meetingAttendees', [
        ...attendees,
        { role, hourlyCost, count: 1 },
      ]);
    }
  };

  const updateAttendee = (
    role: string,
    field: 'count' | 'hourlyCost',
    value: number
  ) => {
    onChange(
      'meetingAttendees',
      attendees.map((a) => (a.role === role ? { ...a, [field]: value } : a))
    );
  };

  // Live preview calculations
  const minutesSaved = originalMinutes - optimizedMinutes;
  const totalHourlyCost = attendees.reduce(
    (s, a) => s + a.hourlyCost * a.count,
    0
  );
  const savingsPerMeeting = (minutesSaved / 60) * totalHourlyCost;
  const monthlySavings = savingsPerMeeting * frequencyPerWeek * 4.33;
  const annualSavings = monthlySavings * 12;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-bold text-slate-800">Meeting Wizard</h3>
        <p className="text-sm text-slate-500 mt-1">
          Model time saved by reducing or eliminating a meeting.
        </p>
      </div>

      {/* Original Duration */}
      <SliderField
        label="Original Duration"
        value={originalMinutes}
        min={15}
        max={120}
        step={5}
        onChange={(v) => onChange('meetingOriginalMinutes', v)}
        format={(v) => `${v} min`}
      />

      {/* New Duration */}
      <SliderField
        label="New Duration"
        value={optimizedMinutes}
        min={0}
        max={Math.max(originalMinutes - 5, 0)}
        step={5}
        onChange={(v) => onChange('meetingOptimizedMinutes', v)}
        format={(v) => (v === 0 ? 'Eliminated' : `${v} min`)}
      />

      {/* Frequency */}
      <SliderField
        label="Frequency"
        value={frequencyPerWeek}
        min={1}
        max={10}
        step={1}
        onChange={(v) => onChange('meetingFrequencyPerWeek', v)}
        format={(v) => `${v}x/wk`}
      />

      {/* Attendees */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Attendees
        </label>
        <div className="rounded-lg border border-[#E1EAF2] overflow-hidden max-h-[220px] overflow-y-auto">
          {ROLE_PRESETS.map((preset) => {
            const active = attendees.find((a) => a.role === preset.role);
            return (
              <div
                key={preset.role}
                className={`flex items-center gap-2 px-3 py-2 border-b border-[#E1EAF2] last:border-b-0 transition-colors ${
                  active ? 'bg-emerald-50' : 'bg-white hover:bg-slate-50'
                }`}
              >
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleRole(preset.role, preset.hourlyCost)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    active
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-300 text-transparent'
                  }`}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* Role name */}
                <span
                  className={`text-sm flex-1 ${
                    active
                      ? 'font-medium text-slate-800'
                      : 'text-slate-500'
                  }`}
                >
                  {preset.role}
                </span>

                {active && (
                  <>
                    {/* Count stepper */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateAttendee(
                            preset.role,
                            'count',
                            Math.max(1, active.count - 1)
                          )
                        }
                        className="w-6 h-6 rounded bg-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-300 transition-colors"
                      >
                        -
                      </button>
                      <span className="text-xs font-semibold text-slate-700 w-6 text-center tabular-nums">
                        x{active.count}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateAttendee(
                            preset.role,
                            'count',
                            active.count + 1
                          )
                        }
                        className="w-6 h-6 rounded bg-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-300 transition-colors"
                      >
                        +
                      </button>
                    </div>

                    {/* Hourly rate (editable) */}
                    <div className="flex items-center gap-0.5">
                      <span className="text-[10px] text-slate-400">$</span>
                      <input
                        type="number"
                        min={0}
                        value={active.hourlyCost}
                        onChange={(e) =>
                          updateAttendee(
                            preset.role,
                            'hourlyCost',
                            Number(e.target.value)
                          )
                        }
                        className="w-14 text-xs text-right font-medium text-slate-700 border border-slate-200 rounded px-1 py-0.5 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none tabular-nums"
                      />
                      <span className="text-[10px] text-slate-400">/hr</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Preview */}
      {attendees.length > 0 && minutesSaved > 0 && (
        <div className="bg-emerald-50 rounded-xl p-4 flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Savings Preview
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col">
              <span className="text-[11px] text-emerald-600 font-medium">
                Per meeting
              </span>
              <span className="text-base font-bold text-emerald-800 tabular-nums">
                {fmt$(savingsPerMeeting)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-emerald-600 font-medium">
                Monthly
              </span>
              <span className="text-base font-bold text-emerald-800 tabular-nums">
                {fmt$(monthlySavings)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-emerald-600 font-medium">
                Annual
              </span>
              <span className="text-base font-bold text-emerald-800 tabular-nums">
                {fmt$(annualSavings)}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-emerald-600">
            {originalMinutes} min → {optimizedMinutes === 0 ? 'Eliminated' : `${optimizedMinutes} min`}
            {' · '}
            {frequencyPerWeek}x/wk · {attendees.reduce((s, a) => s + a.count, 0)} attendees
          </p>
        </div>
      )}
    </div>
  );
}
