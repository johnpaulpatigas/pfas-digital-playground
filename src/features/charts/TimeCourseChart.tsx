import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { IterationResult } from '../../types';
import { calculateTimeCourseTrajectory, calculateMultiCompoundTimeCourse } from '../../simulation/toxicokinetics';
import { useSimulationStore } from '../../stores/useSimulationStore';
import { PFAS_COMPOUNDS } from '../../simulation/pfasCompounds';

interface TimeCourseChartProps {
  results: IterationResult[];
}

const COMPOUND_COLORS: Record<string, string> = {
  pfoa: '#2563eb', // Blue
  pfos: '#0d9488', // Teal
  pfhxs: '#7c3aed', // Purple
  pfna: '#d97706', // Amber
  genx: '#e11d48', // Rose
};

export const TimeCourseChart: React.FC<TimeCourseChartProps> = ({ results }) => {
  const { mode } = useSimulationStore();
  const isSimpleMode = mode === 'simple';

  const multiTrajectoryData = useMemo(() => {
    if (!results || results.length === 0 || !isSimpleMode) return [];
    return calculateMultiCompoundTimeCourse(results, 40);
  }, [results, isSimpleMode]);

  const singleTrajectoryData = useMemo(() => {
    if (!results || results.length === 0 || isSimpleMode) return [];
    return calculateTimeCourseTrajectory(results, 40);
  }, [results, isSimpleMode]);

  if (isSimpleMode) {
    return (
      <div className="w-full h-64 sm:h-72 md:h-80 pt-2 font-mono select-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={multiTrajectoryData} margin={{ top: 12, right: 15, left: 0, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="year"
              stroke="#64748b"
              tick={{ fill: '#475569', fontSize: 10 }}
              interval="preserveStartEnd"
              minTickGap={20}
              label={{ value: 'Chronic Exposure Duration (Years)', position: 'bottom', offset: 10, fill: '#0f172a', fontSize: 10 }}
            />
            <YAxis
              width={45}
              stroke="#64748b"
              tick={{ fill: '#475569', fontSize: 10 }}
              label={{ value: 'Serum C(t) (µg/L)', angle: -90, position: 'insideLeft', offset: 10, fill: '#0f172a', fontSize: 10 }}
            />
            <RechartsTooltip
              formatter={(val: unknown, name: unknown) => [`${String(val)} µg/L`, String(name).toUpperCase()]}
              labelFormatter={(label: unknown) => `Year ${String(label ?? '')}`}
            />
            <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: '10px', paddingTop: '-6px' }} />
            {PFAS_COMPOUNDS.map((c) => (
              <Line
                key={c.id}
                type="monotone"
                dataKey={c.id}
                name={c.name.split(' ')[0]}
                stroke={COMPOUND_COLORS[c.id] || '#2563eb'}
                strokeWidth={2.2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full h-64 sm:h-72 md:h-80 pt-2 font-mono select-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={singleTrajectoryData} margin={{ top: 12, right: 15, left: 0, bottom: 25 }}>
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
            interval="preserveStartEnd"
            minTickGap={20}
            label={{ value: 'Chronic Exposure Duration (Years)', position: 'bottom', offset: 10, fill: '#0f172a', fontSize: 10 }}
          />
          <YAxis
            width={45}
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 10 }}
            label={{ value: 'Serum C(t) (µg/L)', angle: -90, position: 'insideLeft', offset: 10, fill: '#0f172a', fontSize: 10 }}
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

