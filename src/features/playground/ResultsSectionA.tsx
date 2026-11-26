import {
  Activity,
  BarChart2,
  Clock,
  LineChart as LineChartIcon,
  ScatterChart as ScatterIcon,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { MathView } from '../../components/ui/MathView';
import type {
  CompoundSummary,
  IterationResult,
  SimulationParameters,
  SummaryStatistics,
} from '../../types';
import { CDFChart } from '../charts/CDFChart';
import { ConvergenceChart } from '../charts/ConvergenceChart';
import { HistogramChart } from '../charts/HistogramChart';
import { ScatterPlotChart } from '../charts/ScatterPlotChart';
import { TimeCourseChart } from '../charts/TimeCourseChart';
import type { MannWhitneyTableRow } from '../statistics/useCohortComparison';
import { ExceedanceAnalyzer } from './ExceedanceAnalyzer';

interface ResultsSectionAProps {
  results: IterationResult[];
  summaryStats: SummaryStatistics;
  parameters: SimulationParameters;
  compoundId: string;
  compoundSummaries: CompoundSummary[];
  activeScenarioId: string;
  mannWhitneyCssRows: MannWhitneyTableRow[];
  mannWhitneyBurdenRows: MannWhitneyTableRow[];
}

type SectionATab = 'exceedance' | 'css' | 'burden';
type CssGraphTab = 'histogram' | 'cdf' | 'timecourse' | 'scatter' | 'convergence';

const SECTION_A_TABS: { id: SectionATab; label: string }[] = [
  { id: 'exceedance', label: 'Exceedance analyzer' },
  { id: 'css', label: 'Serum Conc. (Css)' },
  { id: 'burden', label: 'Body burden' },
];

const CSS_GRAPH_TABS: {
  id: CssGraphTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'histogram', label: 'Histogram', icon: BarChart2 },
  { id: 'cdf', label: 'CDF', icon: LineChartIcon },
  { id: 'timecourse', label: 'Time course', icon: Clock },
  { id: 'scatter', label: 'Scatter plot', icon: ScatterIcon },
  { id: 'convergence', label: 'Convergence', icon: Activity },
];

const formatNum = (n: number) => {
  if (!Number.isFinite(n)) return 'n/a';
  if (n === 0) return '0';
  if (Math.abs(n) < 0.001) return n.toExponential(2);
  if (Math.abs(n) < 1) return n.toFixed(4);
  return n.toFixed(2);
};

const formatP = (p: number) => {
  if (p < 0.0001) return '< 0.0001';
  return p.toFixed(4);
};

export const ResultsSectionA: React.FC<ResultsSectionAProps> = ({
  results,
  summaryStats,
  parameters,
  compoundId,
  compoundSummaries,
  activeScenarioId,
  mannWhitneyCssRows,
  mannWhitneyBurdenRows,
}) => {
  const [sectionTab, setSectionTab] = useState<SectionATab>('exceedance');
  const [cssTab, setCssTab] = useState<CssGraphTab>('histogram');
  const isCustomMode = activeScenarioId === 'custom';

  const bodyBurdenBarData = compoundSummaries.map((c) => ({
    name: c.compoundId.toUpperCase(),
    Mean: Number(c.meanBodyBurden.toFixed(3)),
    Median: Number(c.medianBodyBurden.toFixed(3)),
  }));

  return (
    <div className="space-y-4">
      {/* Sub-section Tabs to avoid excessive vertical scrolling */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
        {SECTION_A_TABS.map((tab) => {
          const active = sectionTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSectionTab(tab.id)}
              className={`flex-1 min-w-[110px] px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                active
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. Exceedance Analyzer */}
      {sectionTab === 'exceedance' && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-slate-800" />
            <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
              Exceedance analyzer
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Compares simulated internal exposure against compound-specific chronic RfD/MRL values to
            evaluate Hazard Quotients (<MathView math="HQ > 1.0" />) and critical safety boundaries.
          </p>
          <div className="card-panel p-4 rounded-xl">
            <ExceedanceAnalyzer results={results} parameters={parameters} compoundId={compoundId} />
          </div>
        </section>
      )}

      {/* 2. Serum Concentration (Css) */}
      {sectionTab === 'css' && (
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
              Serum concentration (<MathView math="C_{ss}" />)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mt-1">
              Steady-state blood serum concentration (<MathView math="\mu\text{g/L}" />) across all
              simulated iterations, descriptive distribution plots, and cohort comparisons.
            </p>
          </div>

          {/* Table A1: Avg Css of all compounds */}
          <div className="card-panel rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-[11px] font-bold font-mono uppercase text-slate-700">
                Table A1: Serum concentration (<MathView math="C_{ss}" />)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-slate-50/70 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Compound</th>
                    <th className="px-3 py-2">Mean (µg/L)</th>
                    <th className="px-3 py-2">Median (µg/L)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {compoundSummaries.map((c) => (
                    <tr key={c.compoundId} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2 font-bold text-slate-900">
                        {c.compoundId.toUpperCase()}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{formatNum(c.meanCss)}</td>
                      <td className="px-3 py-2 text-slate-700">{formatNum(c.medianCss)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabbed Descriptive Graphs (Histogram -> Convergence) */}
          <div className="card-panel rounded-xl overflow-hidden">
            <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200">
              {CSS_GRAPH_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = cssTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCssTab(tab.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="p-3">
              {cssTab === 'histogram' && (
                <HistogramChart results={results} summaryStats={summaryStats} />
              )}
              {cssTab === 'cdf' && <CDFChart results={results} />}
              {cssTab === 'timecourse' && <TimeCourseChart results={results} />}
              {cssTab === 'scatter' && <ScatterPlotChart results={results} />}
              {cssTab === 'convergence' && <ConvergenceChart results={results} />}
            </div>
          </div>

          {/* % of limit table Css */}
          <div className="card-panel rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
              <span className="text-[11px] font-bold font-mono uppercase text-slate-700">
                % of limit: <MathView math="C_{ss}" /> exceedance
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-slate-50/70 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Compound</th>
                    <th className="px-3 py-2">Css critical limit (µg/L)</th>
                    <th className="px-3 py-2">% simulated over limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {compoundSummaries.map((c) => {
                    const pct = c.totalCount > 0 ? (c.exceedanceCount / c.totalCount) * 100 : 0;
                    return (
                      <tr key={c.compoundId} className="hover:bg-slate-50/60">
                        <td className="px-3 py-2 font-bold text-slate-900">
                          {c.compoundId.toUpperCase()}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {formatNum(c.criticalSerumCss)}
                        </td>
                        <td
                          className={`px-3 py-2 font-bold ${
                            pct > 5 ? 'text-red-600' : 'text-emerald-700'
                          }`}
                        >
                          {pct.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table B & Mann-Whitney Graph for Css (Hidden in Custom Mode) */}
          {!isCustomMode && mannWhitneyCssRows.length > 0 && (
            <div className="space-y-3">
              <div className="card-panel rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                  <span className="text-[11px] font-bold font-mono uppercase text-slate-700">
                    Table B: Mann-Whitney U comparison (<MathView math="C_{ss}" />: Preg ÷ Avg)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left font-mono">
                    <thead className="bg-slate-50/70 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Compound</th>
                        <th className="px-3 py-2">Median ratio (Preg ÷ Avg)</th>
                        <th className="px-3 py-2">U</th>
                        <th className="px-3 py-2">p</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mannWhitneyCssRows.map((row) => (
                        <tr key={row.compoundId} className="hover:bg-slate-50/60">
                          <td className="px-3 py-2 font-bold text-slate-900">{row.label}</td>
                          <td className="px-3 py-2 text-slate-700">
                            {row.medianRatio.toFixed(3)}x
                          </td>
                          <td className="px-3 py-2 text-slate-700">
                            {Math.round(row.uStat).toLocaleString()}
                          </td>
                          <td
                            className={`px-3 py-2 font-semibold ${
                              row.isSignificant ? 'text-blue-700' : 'text-slate-500'
                            }`}
                          >
                            {formatP(row.pValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card-panel p-3 rounded-xl space-y-2">
                <span className="text-[11px] font-bold font-mono uppercase text-slate-700">
                  Mann-Whitney cohort median comparison (<MathView math="C_{ss}" /> µg/L)
                </span>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={mannWhitneyCssRows.map((r) => ({
                        name: r.label,
                        'Avg. Woman': Number(r.avgMedian.toFixed(4)),
                        'Preg. Woman': Number(r.pregMedian.toFixed(4)),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="Avg. Woman" fill="#0f172a" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Preg. Woman" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 3. Body Burden */}
      {sectionTab === 'burden' && (
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
              Body burden (<MathView math="B(t)" />)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mt-1">
              Total internal PFAS mass (<MathView math="\mu\text{g}" />) accumulated in the body,
              compared against critical burden limits and across demographic cohorts.
            </p>
          </div>

          {/* Table A2: Body Burden of all compounds */}
          <div className="card-panel rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
              <span className="text-[11px] font-bold font-mono uppercase text-slate-700">
                Table A2: Body burden (µg)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-slate-50/70 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Compound</th>
                    <th className="px-3 py-2">Mean (µg)</th>
                    <th className="px-3 py-2">Median (µg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {compoundSummaries.map((c) => (
                    <tr key={c.compoundId} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2 font-bold text-slate-900">
                        {c.compoundId.toUpperCase()}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{formatNum(c.meanBodyBurden)}</td>
                      <td className="px-3 py-2 text-slate-700">{formatNum(c.medianBodyBurden)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Simple Bar Graph Comparing Different Body Burdens */}
          <div className="card-panel p-3 rounded-xl space-y-2">
            <span className="text-[11px] font-bold font-mono uppercase text-slate-700">
              Body burden comparison across compounds (µg)
            </span>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bodyBurdenBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Mean" fill="#1e293b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Median" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* % of limit table Body Burden */}
          <div className="card-panel rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
              <span className="text-[11px] font-bold font-mono uppercase text-slate-700">
                % of limit: Critical body burden
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-slate-50/70 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Compound</th>
                    <th className="px-3 py-2">Critical body burden (µg)</th>
                    <th className="px-3 py-2">% simulated over limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {compoundSummaries.map((c) => {
                    const pct = c.totalCount > 0 ? (c.exceedanceCount / c.totalCount) * 100 : 0;
                    return (
                      <tr key={c.compoundId} className="hover:bg-slate-50/60">
                        <td className="px-3 py-2 font-bold text-slate-900">
                          {c.compoundId.toUpperCase()}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {formatNum(c.criticalBodyBurden)}
                        </td>
                        <td
                          className={`px-3 py-2 font-bold ${
                            pct > 5 ? 'text-red-600' : 'text-emerald-700'
                          }`}
                        >
                          {pct.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table B & Mann-Whitney Graph for Body Burden (Hidden in Custom Mode) */}
          {!isCustomMode && mannWhitneyBurdenRows.length > 0 && (
            <div className="space-y-3">
              <div className="card-panel rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                  <span className="text-[11px] font-bold font-mono uppercase text-slate-700">
                    Table B: Mann-Whitney U comparison (Body burden: Preg ÷ Avg)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left font-mono">
                    <thead className="bg-slate-50/70 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Compound</th>
                        <th className="px-3 py-2">Median ratio (Preg ÷ Avg)</th>
                        <th className="px-3 py-2">U</th>
                        <th className="px-3 py-2">p</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mannWhitneyBurdenRows.map((row) => (
                        <tr key={row.compoundId} className="hover:bg-slate-50/60">
                          <td className="px-3 py-2 font-bold text-slate-900">{row.label}</td>
                          <td className="px-3 py-2 text-slate-700">
                            {row.medianRatio.toFixed(3)}x
                          </td>
                          <td className="px-3 py-2 text-slate-700">
                            {Math.round(row.uStat).toLocaleString()}
                          </td>
                          <td
                            className={`px-3 py-2 font-semibold ${
                              row.isSignificant ? 'text-blue-700' : 'text-slate-500'
                            }`}
                          >
                            {formatP(row.pValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card-panel p-3 rounded-xl space-y-2">
                <span className="text-[11px] font-bold font-mono uppercase text-slate-700">
                  Mann-Whitney cohort median comparison (Body burden µg)
                </span>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={mannWhitneyBurdenRows.map((r) => ({
                        name: r.label,
                        'Avg. Woman': Number(r.avgMedian.toFixed(3)),
                        'Preg. Woman': Number(r.pregMedian.toFixed(3)),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="Avg. Woman" fill="#0f172a" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Preg. Woman" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
