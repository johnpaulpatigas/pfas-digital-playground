import type React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
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
    dailyIntake: 'Daily Intake',
    exposureDuration: 'Exposure Dur.',
    bioavailability: 'Bioavail.',
  };
  if (map[name]) return map[name];
  return name.replace(/([A-Z])/g, ' $1').trim();
};

export const TornadoChart: React.FC<TornadoChartProps> = ({ sensitivityRanks }) => {
  const chartData = sensitivityRanks.map((item) => {
    const val = item.prcc !== undefined ? item.prcc : item.correlationCoefficient;
    return {
      name: item.parameterName,
      displayName: formatParamName(item.parameterId || item.parameterName),
      prcc: parseFloat(val.toFixed(3)),
      spearman: parseFloat(item.correlationCoefficient.toFixed(3)),
      absVal: Math.abs(val),
      tStat: item.tStatistic,
      pValue: item.pValue,
      isSignificant: item.isSignificant ?? Math.abs(val) >= 0.1,
    };
  });

  return (
    <div className="w-full space-y-2 font-mono select-none">
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 px-1 gap-1">
        <span>Global Sensitivity Analysis: PRCC on Serum Concentration (Css) (Hypothesis 3)</span>
        <span className="text-[10px] text-slate-400">
          Significance threshold: |PRCC| ≥ 0.10, p &lt; 0.05 (dashed lines)
        </span>
      </div>

      <div className="w-full h-64 sm:h-72 md:h-80 pt-2 font-mono">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 12, right: 20, left: 0, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              domain={[-1, 1]}
              stroke="#64748b"
              tick={{ fill: '#475569', fontSize: 10 }}
              interval="preserveStartEnd"
              minTickGap={20}
              label={{
                value: 'Partial Rank Correlation Coefficient (PRCC)',
                position: 'bottom',
                offset: 10,
                fill: '#0f172a',
                fontSize: 10,
              }}
            />
            <YAxis
              type="category"
              dataKey="displayName"
              width={90}
              stroke="#64748b"
              tick={{ fill: '#475569', fontSize: 10 }}
            />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white text-[11px] p-2.5 rounded shadow-lg space-y-1">
                      <div className="font-bold border-b border-slate-700 pb-1">{data.name}</div>
                      <div>
                        PRCC: <span className="font-bold text-teal-300">{data.prcc}</span>
                      </div>
                      <div>
                        Spearman ρ: <span className="text-slate-300">{data.spearman}</span>
                      </div>
                      {data.tStat !== undefined && (
                        <div>
                          t-statistic: <span className="text-slate-300">{data.tStat}</span>
                        </div>
                      )}
                      {data.pValue !== undefined && (
                        <div>
                          p-value:{' '}
                          <span className="text-slate-300">
                            {data.pValue < 0.001 ? '< 0.001' : data.pValue.toFixed(4)}
                          </span>
                        </div>
                      )}
                      <div className="pt-1 text-[10px] border-t border-slate-700">
                        Status:{' '}
                        {data.isSignificant ? (
                          <span className="text-emerald-400 font-semibold">
                            Significant Effect (|PRCC| ≥ 0.10, p &lt; 0.05)
                          </span>
                        ) : (
                          <span className="text-slate-400">Non-Significant</span>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1.5} />
            <ReferenceLine x={0.1} stroke="#f59e0b" strokeDasharray="3 3" />
            <ReferenceLine x={-0.1} stroke="#f59e0b" strokeDasharray="3 3" />
            <Bar dataKey="prcc" radius={[2, 2, 2, 2]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isSignificant ? (entry.prcc >= 0 ? '#0d9488' : '#dc2626') : '#94a3b8'}
                  opacity={entry.isSignificant ? 0.9 : 0.5}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
