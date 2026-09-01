import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { IterationResult } from '../../types';
import { useSimulationStore } from '../../stores/useSimulationStore';
import { PFAS_COMPOUNDS } from '../../simulation/pfasCompounds';

interface ConvergenceChartProps {
  results: IterationResult[];
}

const COMPOUND_COLORS: Record<string, string> = {
  pfoa: '#2563eb', // Blue
  pfos: '#0d9488', // Teal
  pfhxs: '#7c3aed', // Purple
  pfna: '#d97706', // Amber
  genx: '#e11d48', // Rose
};

export const ConvergenceChart: React.FC<ConvergenceChartProps> = ({ results }) => {
  const { mode } = useSimulationStore();
  const isSimpleMode = mode === 'simple';

  const multiConvergenceData = useMemo(() => {
    if (!results || results.length === 0 || !isSimpleMode) return [];

    const total = results.length;
    const step = Math.max(1, Math.floor(total / 150));

    const runningSums: Record<string, number> = {
      pfoa: 0,
      pfos: 0,
      pfhxs: 0,
      pfna: 0,
      genx: 0,
    };

    const data = [];

    for (let i = 0; i < total; i++) {
      const r = results[i];
      PFAS_COMPOUNDS.forEach((c) => {
        const val = r.compoundOutputs ? r.compoundOutputs[c.id]?.steadyStateConcentration ?? r.steadyStateConcentration : r.steadyStateConcentration;
        runningSums[c.id] += val;
      });

      if (i % step === 0 || i === total - 1) {
        const pt: Record<string, number> = { iteration: i + 1 };
        PFAS_COMPOUNDS.forEach((c) => {
          pt[c.id] = parseFloat((runningSums[c.id] / (i + 1)).toFixed(4));
        });
        data.push(pt);
      }
    }

    return data;
  }, [results, isSimpleMode]);

  const singleConvergenceData = useMemo(() => {
    if (!results || results.length === 0 || isSimpleMode) return [];

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
  }, [results, isSimpleMode]);

  if (isSimpleMode) {
    return (
      <div className="w-full h-64 sm:h-72 md:h-80 pt-2 font-mono select-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={multiConvergenceData} margin={{ top: 12, right: 15, left: 0, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="iteration"
              stroke="#64748b"
              tick={{ fill: '#475569', fontSize: 10 }}
              interval="preserveStartEnd"
              minTickGap={25}
              label={{ value: 'Simulation Iterations (N)', position: 'bottom', offset: 10, fill: '#0f172a', fontSize: 10 }}
            />
            <YAxis
              width={45}
              stroke="#64748b"
              tick={{ fill: '#475569', fontSize: 10 }}
              label={{ value: 'Running Mean Css (µg/L)', angle: -90, position: 'insideLeft', offset: 10, fill: '#0f172a', fontSize: 10 }}
            />
            <RechartsTooltip
              formatter={(val: unknown, name: unknown) => [`${String(val)} µg/L`, String(name).toUpperCase()]}
              labelFormatter={(label: unknown) => `Iteration ${String(label ?? '')}`}
            />
            <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: '10px', paddingTop: '-6px' }} />
            {PFAS_COMPOUNDS.map((c) => (
              <Line
                key={c.id}
                type="monotone"
                dataKey={c.id}
                name={c.name.split(' ')[0]}
                stroke={COMPOUND_COLORS[c.id] || '#2563eb'}
                strokeWidth={2}
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
        <LineChart data={singleConvergenceData} margin={{ top: 12, right: 15, left: 0, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="iteration"
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 10 }}
            interval="preserveStartEnd"
            minTickGap={25}
            label={{ value: 'Simulation Iterations (N)', position: 'bottom', offset: 10, fill: '#0f172a', fontSize: 10 }}
          />
          <YAxis
            width={45}
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 10 }}
            label={{ value: 'Running Mean Css (µg/L)', angle: -90, position: 'insideLeft', offset: 10, fill: '#0f172a', fontSize: 10 }}
          />
          <RechartsTooltip
            formatter={(val: unknown) => [`${String(val)} µg/L`, 'Running Mean']}
            labelFormatter={(label: unknown) => `Iteration ${String(label ?? '')}`}
          />
          <Line type="monotone" dataKey="runningMean" stroke="#2563eb" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

