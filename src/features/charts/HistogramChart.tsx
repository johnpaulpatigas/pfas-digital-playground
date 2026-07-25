import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import type { IterationResult, SummaryStatistics } from '../../types';

interface HistogramChartProps {
  results: IterationResult[];
  summaryStats: SummaryStatistics;
}

export const HistogramChart: React.FC<HistogramChartProps> = ({ results, summaryStats }) => {
  const binData = useMemo(() => {
    if (!results || results.length === 0) return [];

    const values = results.map((r) => r.steadyStateConcentration);
    const min = summaryStats.min;
    const max = summaryStats.max;
    const binCount = 30;
    const binWidth = (max - min) / binCount || 0.01;

    const bins = new Array(binCount).fill(0).map((_, i) => ({
      binStart: min + i * binWidth,
      binEnd: min + (i + 1) * binWidth,
      binLabel: (min + (i + 0.5) * binWidth).toFixed(3),
      count: 0,
      frequencyPercent: 0,
    }));

    values.forEach((v) => {
      let idx = Math.floor((v - min) / binWidth);
      if (idx >= binCount) idx = binCount - 1;
      if (idx < 0) idx = 0;
      bins[idx].count++;
    });

    bins.forEach((b) => {
      b.frequencyPercent = (b.count / values.length) * 100;
    });

    return bins;
  }, [results, summaryStats]);

  return (
    <div className="w-full h-72 sm:h-80 pt-2 font-mono">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={binData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="binLabel"
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 10 }}
            label={{ value: 'Blood Serum Concentration Css (µg/L)', position: 'bottom', offset: 5, fill: '#0f172a', fontSize: 11 }}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 10 }}
            label={{ value: 'Frequency (%)', angle: -90, position: 'insideLeft', fill: '#0f172a', fontSize: 11 }}
          />
          <RechartsTooltip
            formatter={(value: unknown) => [`${parseFloat(String(value ?? 0)).toFixed(2)}%`, 'Frequency']}
            labelFormatter={(label: unknown) => `Conc: ${String(label ?? '')} µg/L`}
          />
          <Bar dataKey="frequencyPercent" fill="#2563eb" radius={[2, 2, 0, 0]} opacity={0.85} />
          <ReferenceLine x={summaryStats.mean.toFixed(3)} stroke="#0d9488" strokeWidth={2} strokeDasharray="4 4" label={{ value: 'Mean', fill: '#0d9488', fontSize: 10 }} />
          <ReferenceLine x={summaryStats.p95.toFixed(3)} stroke="#dc2626" strokeWidth={2} label={{ value: 'P95 Limit', fill: '#dc2626', fontSize: 10 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
