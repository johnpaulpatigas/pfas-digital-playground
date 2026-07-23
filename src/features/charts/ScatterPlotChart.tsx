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
    <div className="w-full h-72 sm:h-80 pt-2 font-mono">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            dataKey="x"
            name="Daily Intake"
            unit=" µg/day"
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 10 }}
            label={{ value: 'Daily PFAS Intake (µg/day)', position: 'bottom', offset: 5, fill: '#0f172a', fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Serum Concentration"
            unit=" µg/L"
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 10 }}
            label={{ value: 'Serum Concentration Css (µg/L)', angle: -90, position: 'insideLeft', fill: '#0f172a', fontSize: 11 }}
          />
          <RechartsTooltip
            formatter={(value: any, name: any) => [`${value}`, name]}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Scatter name="Iteration Samples" data={scatterData} fill="#2563eb" opacity={0.6} r={3} />
        </RechartsScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
