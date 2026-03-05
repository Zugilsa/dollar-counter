'use client';

import React, { useId } from 'react';

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}

export default function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: SliderFieldProps) {
  const id = useId();
  const display = format ? format(value) : String(value);

  // Calculate fill percentage for the track gradient
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-2">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-wider text-slate-500"
        >
          {label}
        </label>
        <span className="text-sm font-semibold text-slate-800 tabular-nums">
          {display}
        </span>
      </div>

      {/* Range input */}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-5
                   [&::-webkit-slider-thumb]:h-5
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-[#1DA1F2]
                   [&::-webkit-slider-thumb]:border-2
                   [&::-webkit-slider-thumb]:border-white
                   [&::-webkit-slider-thumb]:shadow-md
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:transition-transform
                   [&::-webkit-slider-thumb]:duration-150
                   [&::-webkit-slider-thumb]:hover:scale-110
                   [&::-moz-range-thumb]:w-5
                   [&::-moz-range-thumb]:h-5
                   [&::-moz-range-thumb]:rounded-full
                   [&::-moz-range-thumb]:bg-[#1DA1F2]
                   [&::-moz-range-thumb]:border-2
                   [&::-moz-range-thumb]:border-white
                   [&::-moz-range-thumb]:shadow-md
                   [&::-moz-range-thumb]:cursor-pointer"
        style={{
          background: `linear-gradient(to right, #1DA1F2 0%, #1DA1F2 ${pct}%, #E2E8F0 ${pct}%, #E2E8F0 100%)`,
          accentColor: '#1DA1F2',
        }}
      />

      {/* Min/Max labels */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400 tabular-nums">
          {format ? format(min) : min}
        </span>
        <span className="text-[10px] text-slate-400 tabular-nums">
          {format ? format(max) : max}
        </span>
      </div>
    </div>
  );
}
