import { BarChart3, Table as TableIcon } from 'lucide-react';
import type React from 'react';
import type { IterationResult, SummaryStatistics } from '../../types';

interface ResultsSectionCProps {
  results: IterationResult[];
  summaryStats: SummaryStatistics;
}

export const ResultsSectionC: React.FC<ResultsSectionCProps> = ({ results, summaryStats }) => {
  const previewRows = results.slice(0, 50);

  return (
    <div className="space-y-6">
      {/* 1. Data Table */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-slate-800" />
            <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
              Data table
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Showing first {previewRows.length} of {results.length.toLocaleString()} iterations
          </span>
        </div>

        <div className="card-panel rounded-xl overflow-hidden">
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-[11px] text-left font-mono">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Intake (µg/d)</th>
                  <th className="px-3 py-2">Body wt (kg)</th>
                  <th className="px-3 py-2">T½ (yr)</th>
                  <th className="px-3 py-2">Css (µg/L)</th>
                  <th className="px-3 py-2">Burden (µg)</th>
                  <th className="px-3 py-2">HQ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewRows.map((row) => (
                  <tr key={row.iteration} className="hover:bg-slate-50/60">
                    <td className="px-3 py-1.5 text-slate-500">{row.iteration}</td>
                    <td className="px-3 py-1.5 text-slate-700">
                      {row.dailyIntake.toExponential(2)}
                    </td>
                    <td className="px-3 py-1.5 text-slate-700">{row.bodyWeight.toFixed(1)}</td>
                    <td className="px-3 py-1.5 text-slate-700">
                      {row.eliminationHalfLife.toFixed(2)}
                    </td>
                    <td className="px-3 py-1.5 font-semibold text-slate-900">
                      {row.steadyStateConcentration.toFixed(4)}
                    </td>
                    <td className="px-3 py-1.5 text-slate-700">{row.peakBodyBurden.toFixed(3)}</td>
                    <td
                      className={`px-3 py-1.5 font-bold ${
                        row.hazardQuotient > 1.0 ? 'text-red-600' : 'text-emerald-700'
                      }`}
                    >
                      {row.hazardQuotient.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 2. Variance and Population Quantiles */}
      <section className="space-y-2.5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-slate-800" />
          <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
            Variance and population quantiles
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Variance Metrics */}
          <div className="card-panel p-4 rounded-xl space-y-2.5">
            <h4 className="text-xs font-bold font-mono uppercase text-slate-700 border-b border-slate-100 pb-1.5">
              Variance metrics (<span className="normal-case">Css µg/L</span>)
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-500">Mean</div>
                <div className="font-bold text-slate-900">{summaryStats.mean.toFixed(4)}</div>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-500">Std. dev. (SD)</div>
                <div className="font-bold text-slate-900">{summaryStats.stdDev.toFixed(4)}</div>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-500">Min</div>
                <div className="font-bold text-slate-900">{summaryStats.min.toFixed(4)}</div>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-500">Max</div>
                <div className="font-bold text-slate-900">{summaryStats.max.toFixed(4)}</div>
              </div>
            </div>
          </div>

          {/* Population Quantiles */}
          <div className="card-panel p-4 rounded-xl space-y-2.5">
            <h4 className="text-xs font-bold font-mono uppercase text-slate-700 border-b border-slate-100 pb-1.5">
              Population quantiles (<span className="normal-case">Css µg/L</span>)
            </h4>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-500">P5</div>
                <div className="font-bold text-slate-900">{summaryStats.p5.toFixed(4)}</div>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-500">P25</div>
                <div className="font-bold text-slate-900">{summaryStats.p25.toFixed(4)}</div>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-500">P50 (median)</div>
                <div className="font-bold text-slate-900">{summaryStats.median.toFixed(4)}</div>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-500">P75</div>
                <div className="font-bold text-slate-900">{summaryStats.p75.toFixed(4)}</div>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-500">P95</div>
                <div className="font-bold text-slate-900">{summaryStats.p95.toFixed(4)}</div>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-500">P99</div>
                <div className="font-bold text-slate-900">{summaryStats.p99.toFixed(4)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
