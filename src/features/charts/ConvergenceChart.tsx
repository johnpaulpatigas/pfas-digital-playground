import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts';
import type { IterationResult } from '../../types';

interface ConvergenceChartProps {
  results: IterationResult[];
}

export const ConvergenceChart: React.FC<ConvergenceChartProps> = ({ results }) => {
  const convergenceData = useMemo(() => {
    if (!results || results.length === 0) return [];

    const total = results.length;
    const step = Math.max(1, Math.floor(total / 150));

    let runningSum = 0;
    const data = [];

    for (let i = 0; i < total; i++) {
      runningSum += results[i].steadyStateConcentration;
      if (i % step === 0 || i === total - 1) {
        data.push({
          iteration: i + 1,
          runningMean: parseFloat((runningSum / (i + 1)).toFixed(4)),
        });
      }
    }

    return data;
  }, [results]);

  return (
    <div className="w-full h-72 sm:h-80 pt-2 font-mono">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={convergenceData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="iteration"
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 10 }}
            label={{ value: 'Simulation Iterations (N)', position: 'bottom', offset: 5, fill: '#0f172a', fontSize: 11 }}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 10 }}
            label={{ value: 'Running Mean Css (µg/L)', angle: -90, position: 'insideLeft', fill: '#0f172a', fontSize: 11 }}
          />
          <RechartsTooltip
            formatter={(val: any) => [`${val} µg/L`, 'Running Mean']}
            labelFormatter={(label: any) => `Iteration ${label}`}
          />
          <Line type="monotone" dataKey="runningMean" stroke="#2563eb" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
