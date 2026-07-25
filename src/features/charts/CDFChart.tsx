import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import type { IterationResult } from '../../types';

interface CDFChartProps {
  results: IterationResult[];
}

export const CDFChart: React.FC<CDFChartProps> = ({ results }) => {
  const cdfData = useMemo(() => {
    if (!results || results.length === 0) return [];

    const sorted = [...results.map((r) => r.steadyStateConcentration)].sort((a, b) => a - b);
    const step = Math.max(1, Math.floor(sorted.length / 200));

    const points = [];
    for (let i = 0; i < sorted.length; i += step) {
      points.push({
        concentration: parseFloat(sorted[i].toFixed(4)),
        probability: parseFloat(((i + 1) / sorted.length * 100).toFixed(2)),
      });
    }

    return points;
  }, [results]);

  return (
    <div className="w-full h-72 sm:h-80 pt-2 font-mono">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={cdfData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="cdfGradientLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="concentration"
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 10 }}
            label={{ value: 'Blood Concentration Css (µg/L)', position: 'bottom', offset: 5, fill: '#0f172a', fontSize: 11 }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 10 }}
            label={{ value: 'Cumulative Percentile (%)', angle: -90, position: 'insideLeft', fill: '#0f172a', fontSize: 11 }}
          />
          <RechartsTooltip
            formatter={(val: unknown) => [`${String(val)}%`, 'Cumulative Probability']}
            labelFormatter={(label: unknown) => `Conc: ${String(label ?? '')} µg/L`}
          />
          <Area type="monotone" dataKey="probability" stroke="#7c3aed" strokeWidth={2} fillOpacity={1} fill="url(#cdfGradientLight)" />
          <ReferenceLine y={50} stroke="#2563eb" strokeDasharray="3 3" label={{ value: 'P50 (Median)', fill: '#2563eb', fontSize: 10 }} />
          <ReferenceLine y={95} stroke="#dc2626" strokeDasharray="3 3" label={{ value: 'P95 Limit', fill: '#dc2626', fontSize: 10 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
