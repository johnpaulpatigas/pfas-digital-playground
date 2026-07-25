import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Line,
} from 'recharts';
import type { IterationResult } from '../../types';
import { calculateTimeCourseTrajectory } from '../../simulation/toxicokinetics';

interface TimeCourseChartProps {
  results: IterationResult[];
}

export const TimeCourseChart: React.FC<TimeCourseChartProps> = ({ results }) => {
  const trajectoryData = useMemo(() => {
    return calculateTimeCourseTrajectory(results, 40);
  }, [results]);

  return (
    <div className="w-full h-72 sm:h-80 pt-2 font-mono">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trajectoryData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="timeCourseBandLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="year"
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 10 }}
            label={{ value: 'Chronic Exposure Duration (Years)', position: 'bottom', offset: 5, fill: '#0f172a', fontSize: 11 }}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 10 }}
            label={{ value: 'Serum Concentration C(t) (µg/L)', angle: -90, position: 'insideLeft', fill: '#0f172a', fontSize: 11 }}
          />
          <RechartsTooltip
            formatter={(val: unknown, name: unknown) => [`${String(val)} µg/L`, String(name) === 'meanConcentration' ? 'Mean Serum' : String(name ?? '')]}
            labelFormatter={(label: unknown) => `Year ${String(label ?? '')}`}
          />
          <Area type="monotone" dataKey="p95Concentration" stroke="none" fill="url(#timeCourseBandLight)" name="P95 Upper Bound" />
          <Line type="monotone" dataKey="meanConcentration" stroke="#2563eb" strokeWidth={2.5} dot={false} name="Mean Trajectory" />
          <Line type="monotone" dataKey="p5Concentration" stroke="#0d9488" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="P5 Lower Bound" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
