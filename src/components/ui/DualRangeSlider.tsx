import type React from 'react';

interface DualRangeSliderProps {
  minBound: number;
  maxBound: number;
  step: number;
  low: number;
  high: number;
  disabled?: boolean;
  unit?: string;
  onChange: (newLow: number, newHigh: number) => void;
}

export const DualRangeSlider: React.FC<DualRangeSliderProps> = ({
  minBound,
  maxBound,
  step,
  low,
  high,
  disabled = false,
  unit,
  onChange,
}) => {
  const safeSpan = Math.max(maxBound - minBound, 1e-9);
  const clampedLow = Math.max(minBound, Math.min(low, high));
  const clampedHigh = Math.min(maxBound, Math.max(high, clampedLow));

  const leftPct = ((clampedLow - minBound) / safeSpan) * 100;
  const rightPct = ((clampedHigh - minBound) / safeSpan) * 100;

  const formatVal = (v: number) => {
    if (v === 0) return '0';
    if (Math.abs(v) < 0.01) return v.toExponential(2);
    if (Math.abs(v) < 1) return v.toFixed(3);
    return Number(v.toFixed(2)).toString();
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-600">
        <span>
          Min: <strong className="text-slate-900">{formatVal(clampedLow)}</strong>
          {unit ? ` ${unit}` : ''}
        </span>
        <span>
          Max: <strong className="text-slate-900">{formatVal(clampedHigh)}</strong>
          {unit ? ` ${unit}` : ''}
        </span>
      </div>

      <div className="relative h-5 flex items-center select-none">
        {/* Base track */}
        <div className="absolute left-0 right-0 h-1.5 bg-slate-200 rounded-full" />

        {/* Thickened active range between a and b */}
        <div
          className={`absolute h-2 rounded-full transition-colors ${
            disabled ? 'bg-slate-400' : 'bg-slate-900'
          }`}
          style={{
            left: `${leftPct}%`,
            width: `${Math.max(rightPct - leftPct, 1)}%`,
          }}
        />

        {/* Low thumb */}
        <input
          type="range"
          min={minBound}
          max={maxBound}
          step={step}
          value={clampedLow}
          disabled={disabled}
          onChange={(e) => {
            const val = Math.min(parseFloat(e.target.value), clampedHigh);
            onChange(val, clampedHigh);
          }}
          className="dual-range-thumb absolute inset-0 w-full appearance-none bg-transparent pointer-events-none disabled:cursor-not-allowed"
          aria-label="Minimum range value"
        />

        {/* High thumb */}
        <input
          type="range"
          min={minBound}
          max={maxBound}
          step={step}
          value={clampedHigh}
          disabled={disabled}
          onChange={(e) => {
            const val = Math.max(parseFloat(e.target.value), clampedLow);
            onChange(clampedLow, val);
          }}
          className="dual-range-thumb absolute inset-0 w-full appearance-none bg-transparent pointer-events-none disabled:cursor-not-allowed"
          aria-label="Maximum range value"
        />
      </div>
    </div>
  );
};
