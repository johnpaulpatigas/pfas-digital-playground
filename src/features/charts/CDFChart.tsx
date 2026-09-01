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
  ReferenceLine,
  Legend,
} from 'recharts';
import type { IterationResult } from '../../types';
import { useSimulationStore } from '../../stores/useSimulationStore';
import { PFAS_COMPOUNDS } from '../../simulation/pfasCompounds';

interface CDFChartProps {
  results: IterationResult[];
}

const COMPOUND_COLORS: Record<string, string> = {
  pfoa: '#2563eb', // Blue
  pfos: '#0d9488', // Teal
  pfhxs: '#7c3aed', // Purple
  pfna: '#d97706', // Amber
  genx: '#e11d48', // Rose
};

export const CDFChart: React.FC<CDFChartProps> = ({ results }) => {
  const { mode } = useSimulationStore();
  const isSimpleMode = mode === 'simple';

  // Multi-compound CDF Data (Simple Mode)
  const multiCdfData = useMemo(() => {
    if (!results || results.length === 0 || !isSimpleMode) return [];

    const numPoints = 100;
    const sortedMap: Record<string, number[]> = {};

    PFAS_COMPOUNDS.forEach((c) => {
      sortedMap[c.id] = results
        .map((r) => (r.compoundOutputs ? r.compoundOutputs[c.id]?.steadyStateConcentration ?? r.steadyStateConcentration : r.steadyStateConcentration))
        .sort((a, b) => a - b);
    });

    const step = Math.max(1, Math.floor(results.length / numPoints));
    const points = [];

    for (let i = 0; i < results.length; i += step) {
      const prob = parseFloat(((i + 1) / results.length * 100).toFixed(2));
      const pt: Record<string, number> = { probability: prob };
      PFAS_COMPOUNDS.forEach((c) => {
        const sorted = sortedMap[c.id];
        pt[c.id] = parseFloat((sorted[Math.min(i, sorted.length - 1)] || 0).toFixed(4));
      });
      points.push(pt);
    }

    return points;
  }, [results, isSimpleMode]);

  // Single Compound CDF Data (Advanced Mode)
  const singleCdfData = useMemo(() => {
    if (!results || results.length === 0 || isSimpleMode) return [];

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
  }, [results, isSimpleMode]);

  if (isSimpleMode) {
    return (
      <div className="w-full h-64 sm:h-72 md:h-80 pt-2 font-mono select-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={multiCdfData} margin={{ top: 12, right: 15, left: 0, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="pfoa"
              stroke="#64748b"
              tick={{ fill: '#475569', fontSize: 10 }}
              interval="preserveStartEnd"
              minTickGap={20}
              label={{ value: 'Serum Concentration Range (µg/L)', position: 'bottom', offset: 10, fill: '#0f172a', fontSize: 10 }}
            />
            <YAxis
              domain={[0, 100]}
              width={45}
              stroke="#64748b"
              tick={{ fill: '#475569', fontSize: 10 }}
              label={{ value: 'Cumulative %', angle: -90, position: 'insideLeft', offset: 10, fill: '#0f172a', fontSize: 10 }}
            />
            <RechartsTooltip
              formatter={(val: unknown, name: unknown) => [`${String(val)} µg/L`, String(name).toUpperCase()]}
              labelFormatter={(label: unknown) => `Cumulative Prob: ${String(label ?? '')}%`}
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
            <ReferenceLine y={50} stroke="#64748b" strokeDasharray="3 3" label={{ value: 'P50', fill: '#64748b', fontSize: 9, position: 'insideTopLeft' }} />
            <ReferenceLine y={95} stroke="#dc2626" strokeDasharray="3 3" label={{ value: 'P95', fill: '#dc2626', fontSize: 9, position: 'insideTopLeft' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full h-64 sm:h-72 md:h-80 pt-2 font-mono select-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={singleCdfData} margin={{ top: 12, right: 15, left: 0, bottom: 25 }}>
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
            interval="preserveStartEnd"
            minTickGap={20}
            label={{ value: 'Blood Concentration Css (µg/L)', position: 'bottom', offset: 10, fill: '#0f172a', fontSize: 10 }}
          />
          <YAxis
            domain={[0, 100]}
            width={45}
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 10 }}
            label={{ value: 'Cumulative %', angle: -90, position: 'insideLeft', offset: 10, fill: '#0f172a', fontSize: 10 }}
          />
          <RechartsTooltip
            formatter={(val: unknown) => [`${String(val)}%`, 'Cumulative Probability']}
            labelFormatter={(label: unknown) => `Conc: ${String(label ?? '')} µg/L`}
          />
          <Area type="monotone" dataKey="probability" stroke="#7c3aed" strokeWidth={2} fillOpacity={1} fill="url(#cdfGradientLight)" />
          <ReferenceLine y={50} stroke="#2563eb" strokeDasharray="3 3" label={{ value: 'P50 (Median)', fill: '#2563eb', fontSize: 9, position: 'insideTopLeft' }} />
          <ReferenceLine y={95} stroke="#dc2626" strokeDasharray="3 3" label={{ value: 'P95 Limit', fill: '#dc2626', fontSize: 9, position: 'insideTopLeft' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

