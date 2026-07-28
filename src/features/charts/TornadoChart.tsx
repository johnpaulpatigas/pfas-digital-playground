import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';
import type { SensitivityRank } from '../../types';

interface TornadoChartProps {
  sensitivityRanks: SensitivityRank[];
}

const formatParamName = (name: string): string => {
  const map: Record<string, string> = {
    waterConcentration: 'Water Conc.',
    halfLifeYears: 'Half-Life',
    waterConsumption: 'Water Intake',
    bodyWeight: 'Body Weight',
    dietaryIntake: 'Dietary Intake',
    volumeDistribution: 'Vol. Distrib.',
    eliminationHalfLife: 'Elim. Half-Life',
    clearanceRate: 'Clearance Rate',
  };
  if (map[name]) return map[name];
  return name.replace(/([A-Z])/g, ' $1').trim();
};

export const TornadoChart: React.FC<TornadoChartProps> = ({ sensitivityRanks }) => {
  const chartData = sensitivityRanks.map((item) => ({
    name: item.parameterName,
    displayName: formatParamName(item.parameterName),
    correlation: parseFloat(item.correlationCoefficient.toFixed(3)),
    absCorr: Math.abs(item.correlationCoefficient),
  }));

  return (
    <div className="w-full h-64 sm:h-72 md:h-80 pt-2 font-mono select-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={chartData} margin={{ top: 12, right: 15, left: 0, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            domain={[-1, 1]}
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 10 }}
            interval="preserveStartEnd"
            minTickGap={20}
            label={{ value: 'Spearman Rank Correlation Coefficient (ρ)', position: 'bottom', offset: 10, fill: '#0f172a', fontSize: 10 }}
          />
          <YAxis
            type="category"
            dataKey="displayName"
            width={85}
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 10 }}
          />
          <RechartsTooltip
            formatter={(val: unknown) => [String(val ?? ''), 'Spearman Correlation']}
            labelFormatter={(label: unknown) => `Parameter: ${String(label ?? '')}`}
          />
          <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1.5} />
          <Bar dataKey="correlation" radius={[2, 2, 2, 2]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.correlation >= 0 ? '#0d9488' : '#dc2626'}
                opacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
