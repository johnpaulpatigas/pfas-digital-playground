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

export const TornadoChart: React.FC<TornadoChartProps> = ({ sensitivityRanks }) => {
  const chartData = sensitivityRanks.map((item) => ({
    name: item.parameterName,
    correlation: parseFloat(item.correlationCoefficient.toFixed(3)),
    absCorr: Math.abs(item.correlationCoefficient),
  }));

  return (
    <div className="w-full h-72 sm:h-80 pt-2 font-mono">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={chartData} margin={{ top: 10, right: 30, left: 90, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            domain={[-1, 1]}
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 10 }}
            label={{ value: 'Spearman Rank Correlation Coefficient (ρ)', position: 'bottom', offset: 5, fill: '#0f172a', fontSize: 11 }}
          />
          <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fill: '#475569', fontSize: 10 }} />
          <RechartsTooltip
            formatter={(val: any) => [val, 'Spearman Correlation']}
            labelFormatter={(label: any) => `Parameter: ${label}`}
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
