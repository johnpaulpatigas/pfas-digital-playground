import type React from 'react';
import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { calculateConvergenceSeries } from '../../simulation/statistics';
import type { IterationResult } from '../../types';

interface ConvergenceChartProps {
  results: IterationResult[];
}

export const ConvergenceChart: React.FC<ConvergenceChartProps> = ({ results }) => {
  const convergenceData = useMemo(() => calculateConvergenceSeries(results, 150), [results]);

  return (
    <div className="w-full h-64 sm:h-72 md:h-80 pt-2 font-mono select-none">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={convergenceData} margin={{ top: 12, right: 15, left: 0, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="iteration"
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 10 }}
            interval="preserveStartEnd"
            minTickGap={25}
            label={{
              value: 'Simulation Iterations (N)',
              position: 'bottom',
              offset: 10,
              fill: '#0f172a',
              fontSize: 10,
            }}
          />
          <YAxis
            width={45}
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 10 }}
            label={{
              value: 'Running Mean Css (µg/L)',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              fill: '#0f172a',
              fontSize: 10,
            }}
          />
          <RechartsTooltip
            formatter={(val: unknown) => [`${String(val)} µg/L`, 'Running Mean']}
            labelFormatter={(label: unknown) => `Iteration ${String(label ?? '')}`}
          />
          <Line
            type="monotone"
            dataKey="runningMean"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
