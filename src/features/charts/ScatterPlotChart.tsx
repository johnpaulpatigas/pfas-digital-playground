import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts';
import type { IterationResult } from '../../types';

interface ScatterPlotChartProps {
  results: IterationResult[];
}

export const ScatterPlotChart: React.FC<ScatterPlotChartProps> = ({ results }) => {
  const scatterData = useMemo(() => {
    if (!results || results.length === 0) return [];

    const step = Math.max(1, Math.floor(results.length / 500));
    const points = [];

    for (let i = 0; i < results.length; i += step) {
      points.push({
        x: parseFloat(results[i].dailyIntake.toFixed(4)),
        y: parseFloat(results[i].steadyStateConcentration.toFixed(4)),
        bw: parseFloat(results[i].bodyWeight.toFixed(1)),
      });
    }

    return points;
  }, [results]);

  return (
    <div className="w-full h-64 sm:h-72 md:h-80 pt-2 font-mono select-none">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsScatterChart margin={{ top: 12, right: 15, left: 0, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            dataKey="x"
            name="Daily Intake"
            unit=" µg/day"
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 10 }}
            interval="preserveStartEnd"
            minTickGap={25}
            label={{ value: 'Daily PFAS Intake (µg/day)', position: 'bottom', offset: 10, fill: '#0f172a', fontSize: 10 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Serum Concentration"
            unit=" µg/L"
            width={45}
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 10 }}
            label={{ value: 'Serum Css (µg/L)', angle: -90, position: 'insideLeft', offset: 10, fill: '#0f172a', fontSize: 10 }}
          />
          <RechartsTooltip
            formatter={(value: unknown, name: unknown) => [`${String(value ?? '')}`, String(name ?? '')]}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Scatter name="Iteration Samples" data={scatterData} fill="#2563eb" opacity={0.6} r={3} />
        </RechartsScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
