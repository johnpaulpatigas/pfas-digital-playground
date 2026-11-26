import { AlertTriangle, Award, CheckCircle2, Flame, ShieldAlert } from 'lucide-react';
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
import { PFAS_COMPOUNDS } from '../../simulation/pfasCompounds';
import type { SensitivityRank } from '../../types';
import { TornadoChart } from '../charts/TornadoChart';
import type { WilcoxonTableRow } from '../statistics/useCohortComparison';

interface ResultsSectionBProps {
  sensitivityRanks: SensitivityRank[];
  wilcoxonRows: WilcoxonTableRow[];
}

const formatP = (p: number) => {
  if (p < 0.0001) return '< 0.0001';
  return p.toFixed(4);
};

export const ResultsSectionB: React.FC<ResultsSectionBProps> = ({
  sensitivityRanks,
  wilcoxonRows,
}) => {
  const hiRow = wilcoxonRows.find((r) => r.id === 'hi');
  const significantCompounds = wilcoxonRows.filter((r) => r.id !== 'hi' && r.isSignificantRisk);

  return (
    <div className="space-y-6">
      {/* 1. Top Exposure Driver */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-slate-800" />
          <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
            Top Exposure Driver
          </h3>
        </div>

        {/* Complete Ranking List of Drivers */}
        <div className="card-panel rounded-xl overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono uppercase text-slate-700">
              Complete Sensitivity Ranking
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {sensitivityRanks.length} Drivers
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {sensitivityRanks.map((item, idx) => {
              const isTop = idx === 0;
              return (
                <div
                  key={item.parameterId}
                  className={`px-3 py-2 flex items-center justify-between text-xs ${
                    isTop ? 'bg-amber-50/70' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                        isTop ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.rank}
                    </span>
                    <span className="font-semibold text-slate-800">{item.parameterName}</span>
                    {isTop && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-mono font-bold">
                        <Award className="w-3 h-3" /> Top Driver
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[11px] text-slate-600">
                    ρ ={' '}
                    <strong className="text-slate-900">
                      {item.correlationCoefficient.toFixed(3)}
                    </strong>
                    {item.prcc !== undefined && (
                      <span className="ml-2 text-slate-500">(PRCC: {item.prcc.toFixed(3)})</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PRCC / Spearman Ranking Graph */}
        <div className="card-panel p-3 rounded-xl">
          <TornadoChart sensitivityRanks={sensitivityRanks} />
        </div>
      </section>

      <hr className="border-slate-200" />

      {/* 2. Are We At Risk? */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-slate-800" />
          <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
            Are We At Risk?
          </h3>
        </div>

        {/* Wilcoxon Table Proper */}
        <div className="card-panel rounded-xl overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
            <span className="text-[11px] font-bold font-mono uppercase text-slate-700">
              One-Sample Wilcoxon Signed-Rank Test (vs. HQ = 1.0)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left font-mono">
              <thead className="bg-slate-50/70 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-2.5 py-2">Compound</th>
                  <th className="px-2.5 py-2">Mean</th>
                  <th className="px-2.5 py-2">Median</th>
                  <th className="px-2.5 py-2">% &gt; HQ 1.0</th>
                  <th className="px-2.5 py-2">W</th>
                  <th className="px-2.5 py-2">p</th>
                  <th className="px-2.5 py-2">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wilcoxonRows.map((row) => {
                  const isHI = row.id === 'hi';
                  return (
                    <tr
                      key={row.id}
                      className={`${isHI ? 'bg-slate-100/80 font-bold border-t-2 border-slate-300' : 'hover:bg-slate-50/60'}`}
                    >
                      <td className="px-2.5 py-2 text-slate-900 font-bold">{row.label}</td>
                      <td className="px-2.5 py-2 text-slate-700">{row.mean.toFixed(3)}</td>
                      <td className="px-2.5 py-2 text-slate-700">{row.median.toFixed(3)}</td>
                      <td className="px-2.5 py-2 text-slate-700">
                        {row.exceedancePercent.toFixed(1)}%
                      </td>
                      <td className="px-2.5 py-2 text-slate-700">
                        {Math.round(row.wStat).toLocaleString()}
                      </td>
                      <td className="px-2.5 py-2 text-slate-700">{formatP(row.pValue)}</td>
                      <td className="px-2.5 py-2">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            row.isSignificantRisk
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {row.isSignificantRisk ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          {row.decision}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Wilcoxon Graph */}
        <div className="card-panel p-3 rounded-xl space-y-2">
          <span className="text-[11px] font-bold font-mono uppercase text-slate-700">
            Median Hazard Quotient (HQ) &amp; Hazard Index (HI) vs. Safety Threshold (1.0)
          </span>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={wilcoxonRows.map((r) => ({
                  name: r.id === 'hi' ? 'HI (Sum)' : r.label,
                  Median: Number(r.median.toFixed(3)),
                  isRisk: r.isSignificantRisk,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartsTooltip />
                <ReferenceLine y={1.0} stroke="#dc2626" strokeDasharray="4 4" label="HQ = 1.0" />
                <Bar dataKey="Median" radius={[4, 4, 0, 0]}>
                  {wilcoxonRows.map((entry) => (
                    <Cell key={entry.id} fill={entry.isSignificantRisk ? '#dc2626' : '#0d9488'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary of Wilcoxon Test */}
        <div className="card-panel p-3.5 rounded-xl bg-slate-50/80 space-y-1.5">
          <span className="text-[11px] font-bold font-mono uppercase text-slate-800">
            Summary of Wilcoxon Test
          </span>
          <p className="text-xs text-slate-700 leading-relaxed">
            {significantCompounds.length > 0 ? (
              <>
                The one-sample Wilcoxon signed-rank test indicates statistically significant
                exceedance (<span className="font-mono">p &lt; 0.05</span>, median HQ &gt; 1.0) for{' '}
                <strong>{significantCompounds.map((c) => c.label).join(', ')}</strong>.
              </>
            ) : (
              <>
                None of the individual PFAS compounds showed a statistically significant median
                Hazard Quotient above the 1.0 safety threshold.
              </>
            )}{' '}
            {hiRow && (
              <>
                When evaluating cumulative mixture risk, the{' '}
                <strong>Hazard Index (HI = {hiRow.median.toFixed(3)} median)</strong>{' '}
                {hiRow.isSignificantRisk
                  ? `significantly exceeds 1.0 (${hiRow.exceedancePercent.toFixed(1)}% of simulated iterations above 1.0, p = ${formatP(hiRow.pValue)}), indicating potential cumulative non-cancer health risk.`
                  : `remains below the 1.0 cumulative threshold (${hiRow.exceedancePercent.toFixed(1)}% of iterations above 1.0, p = ${formatP(hiRow.pValue)}).`}
              </>
            )}
          </p>
        </div>

        {/* RfD Reference Table */}
        <div className="card-panel rounded-xl overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
            <span className="text-[11px] font-bold font-mono uppercase text-slate-700">
              Reference Dose (RfD) Values
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left font-mono">
              <thead className="bg-slate-50/70 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-2.5 py-2">Compound</th>
                  <th className="px-2.5 py-2">RfD Value</th>
                  <th className="px-2.5 py-2">Unit</th>
                  <th className="px-2.5 py-2">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PFAS_COMPOUNDS.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="px-2.5 py-2 font-bold text-slate-900">{c.id.toUpperCase()}</td>
                    <td className="px-2.5 py-2 text-slate-700">{c.rfdDose.toExponential(2)}</td>
                    <td className="px-2.5 py-2 text-slate-600">µg/kg/day</td>
                    <td className="px-2.5 py-2 text-slate-600 font-sans">{c.rfdSource}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
