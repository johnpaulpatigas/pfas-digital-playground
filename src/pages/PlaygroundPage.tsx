import {
  Activity,
  BarChart2,
  BookOpen,
  ChevronDown,
  Clock,
  Download,
  FileSpreadsheet,
  Flame,
  LineChart as LineChartIcon,
  ScatterChart as ScatterIcon,
  Sparkles,
  Table as TableIcon,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { MathView } from '../components/ui/MathView';
import { CDFChart } from '../features/charts/CDFChart';
import { ConvergenceChart } from '../features/charts/ConvergenceChart';
import { HistogramChart } from '../features/charts/HistogramChart';
import { ScatterPlotChart } from '../features/charts/ScatterPlotChart';
import { TimeCourseChart } from '../features/charts/TimeCourseChart';
import { TornadoChart } from '../features/charts/TornadoChart';
import { ExceedanceAnalyzer } from '../features/playground/ExceedanceAnalyzer';
import { ParameterGuideModal } from '../features/playground/ParameterGuideModal';
import { ParameterSidebar } from '../features/playground/ParameterSidebar';
import { SimulationConsole } from '../features/playground/SimulationConsole';
import { SummaryPanel } from '../features/statistics/SummaryPanel';
import { PFAS_COMPOUNDS } from '../simulation/pfasCompounds';
import { executeSimulationAsync } from '../simulation/runSimulationAsync';
import { useSimulationStore } from '../stores/useSimulationStore';
import { exportToCSV, exportToJSON } from '../utils/exportUtils';

type TabId =
  | 'thresholds'
  | 'histogram'
  | 'cdf'
  | 'timecourse'
  | 'scatter'
  | 'tornado'
  | 'convergence'
  | 'table';

interface TabMeta {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  whatToLookFor: string[];
}

const TAB_METADATA: Record<TabId, TabMeta> = {
  thresholds: {
    id: 'thresholds',
    label: 'Exceedance analyzer',
    icon: Zap,
    title: 'Toxicokinetic Exceedance & Safety Thresholds',
    description:
      'Compares simulated internal exposure against toxicological reference limits (EPA RfD) to determine whether body burden or serum concentration exceeds safe benchmark limits (HQ > 1.0).',
    whatToLookFor: [
      'In the area chart, the vertical red dashed line marks the critical threshold; the red shaded area to the right shows iterations with HQ > 1.0.',
      'Use the toggle buttons to switch between Body Burden (µg) and Serum Concentration (µg/L) views.',
      'Check the status banner for the baseline Hazard Quotient (HQ) and equilibrium progress percentage.',
      'Review the Analytical Parameter Thresholds table to identify which input variable is closest to or exceeding its critical limit.',
    ],
  },
  histogram: {
    id: 'histogram',
    label: 'Histogram',
    icon: BarChart2,
    title: 'Blood Serum Concentration Distribution (Css)',
    description:
      'Shows the frequency distribution of predicted steady-state blood serum concentrations (Css) across all simulated iterations.',
    whatToLookFor: [
      'The highest bar indicates the modal concentration range where most simulated iterations cluster.',
      'Bars stretching toward the right show iterations that reached higher concentrations due to combinations of higher daily intake, lower body weight, or longer half-life.',
      'Hover over any bar to see its concentration midpoint and exact percentage frequency.',
      'Use the PFAS View buttons above the chart to inspect serum concentration distributions for each compound.',
    ],
  },
  cdf: {
    id: 'cdf',
    label: 'CDF',
    icon: LineChartIcon,
    title: 'Cumulative Distribution Function (CDF)',
    description:
      'Plots the cumulative percentage of simulation iterations resulting in serum concentrations at or below any given value.',
    whatToLookFor: [
      'Locate where the curve crosses the horizontal dashed lines at 50% (P50 median) and 95% (P95 upper boundary).',
      'Steeper S-curves indicate tighter clustering of iteration values; flatter curves reflect wider input variability.',
    ],
  },
  timecourse: {
    id: 'timecourse',
    label: 'Time course C(t)',
    icon: Clock,
    title: 'Dynamic Bioaccumulation Trajectory C(t)',
    description:
      'Models chronic serum accumulation over up to 40 years of exposure using 1-compartment first-order elimination kinetics (C(t) = Css(1 - e^(-ke*t))).',
    whatToLookFor: [
      'Observe the solid blue Mean trajectory bounded by the shaded P95 upper area and dashed P5 lower line.',
      'The point where a curve levels off horizontally marks steady-state equilibrium where daily intake equals daily elimination.',
    ],
  },
  scatter: {
    id: 'scatter',
    label: 'Scatter plot',
    icon: ScatterIcon,
    title: 'Intake Rate vs. Serum Concentration Correlation',
    description:
      'Plots daily intake (µg/day) against steady-state serum concentration (µg/L) for sampled simulation iterations.',
    whatToLookFor: [
      'Teal dots represent safe iterations (HQ ≤ 1.0); red dots represent iterations exceeding reference limits (HQ > 1.0).',
      'Vertical spread at the same intake level reflects variations in sampled body weight and elimination half-life.',
      'Hover over any point to inspect that iteration’s intake, serum concentration, body burden, and calculated HQ.',
      'Use the PFAS View buttons above the chart to switch between compounds.',
    ],
  },
  tornado: {
    id: 'tornado',
    label: 'Sensitivity rankings',
    icon: Flame,
    title: 'Sensitivity Analysis & Parameter Rankings (Tornado)',
    description:
      'Ranks input parameters by their Spearman rank correlation (ρ) with steady-state serum concentration.',
    whatToLookFor: [
      'The top bar has the strongest correlation with serum concentration (|ρ|), meaning it drives the most variance in the output.',
      'Teal bars pointing right (ρ > 0) indicate positive correlation (increasing the input increases serum concentration).',
      'Red bars pointing left (ρ < 0) indicate negative correlation (e.g. higher body weight dilutes the concentration across a larger volume).',
      'Bars near zero (|ρ| < 0.1) have little effect on serum concentration variance.',
    ],
  },
  convergence: {
    id: 'convergence',
    label: 'Convergence',
    icon: Activity,
    title: 'Monte Carlo Convergence Stability',
    description:
      'Plots the running mean of steady-state concentration as simulation iterations accumulate to evaluate sample stability.',
    whatToLookFor: [
      'Observe the running mean trajectory for the selected compound.',
      'Check whether the running mean line fluctuates at low iteration counts and flattens into a horizontal line as iterations accumulate.',
      'A flat, horizontal line confirms that the number of iterations (N) is sufficiently large to eliminate random sampling error.',
    ],
  },
  table: {
    id: 'table',
    label: 'Data table',
    icon: TableIcon,
    title: 'Raw Simulation Iteration Records',
    description:
      'Provides record-level inspection of individual simulation iterations with sampled inputs and calculated outputs.',
    whatToLookFor: [
      'Filter records using the "All", "Exceeding HQ > 1.0", or "Safe" buttons to focus on specific cohorts.',
      'Use the search box to locate a specific iteration number.',
      'Inspect sampled Half-Life alongside resulting Body Burden, Serum Css, and HQ.',
    ],
  },
};

export const PlaygroundPage: React.FC = () => {
  const {
    parameters,
    samplingConfig,
    results,
    summaryStats,
    sensitivityRanks,
    isSimulating,
    setIsSimulating,
    setSimulationResults,
  } = useSimulationStore();

  const [activeTab, setActiveTab] = useState<TabId>('thresholds');
  const [isGuidanceOpen, setIsGuidanceOpen] = useState(false);

  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [tableFilter, setTableFilter] = useState<'all' | 'exceeding' | 'safe'>('all');
  const [tablePage, setTablePage] = useState(1);

  const activeCompound =
    PFAS_COMPOUNDS.find((c) => c.id === samplingConfig.compoundId) || PFAS_COMPOUNDS[0];

  const activeTabMeta = TAB_METADATA[activeTab];
  const ActiveTabIcon = activeTabMeta.icon;

  const executeSimulation = useCallback(() => {
    setIsSimulating(true);

    executeSimulationAsync(parameters, samplingConfig)
      .then(({ simResults, summaryStats, sensitivityRanks, compoundSummaries }) => {
        setSimulationResults(simResults, summaryStats, sensitivityRanks, compoundSummaries);
      })
      .catch((err) => {
        console.error('Simulation execution error:', err);
        setIsSimulating(false);
      });
  }, [parameters, samplingConfig, setIsSimulating, setSimulationResults]);

  useEffect(() => {
    if (!results) {
      executeSimulation();
    }
  }, [results, executeSimulation]);

  const filteredResults = React.useMemo(() => {
    if (!results) return [];
    let list = results;
    if (tableFilter === 'exceeding') {
      list = list.filter((r) => r.hazardQuotient > 1.0);
    } else if (tableFilter === 'safe') {
      list = list.filter((r) => r.hazardQuotient <= 1.0);
    }
    if (!tableSearch) return list;
    return list.filter((r) => r.iteration.toString().includes(tableSearch));
  }, [results, tableFilter, tableSearch]);

  const pageSize = 15;
  const totalPages = Math.ceil(filteredResults.length / pageSize) || 1;
  const paginatedResults = filteredResults.slice((tablePage - 1) * pageSize, tablePage * pageSize);

  return (
    <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-panel p-4 sm:p-5 rounded-xl">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 font-heading tracking-tight">
              PFAS toxicokinetic simulation playground
            </h1>
            <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-xs font-mono font-bold">
              {activeCompound.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono">
            Probabilistic 1-compartment modeling: bioaccumulation serum concentration (
            <MathView math="C_{ss}" />)
          </p>
        </div>

        {/* Quick Actions & Export Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsGuideModalOpen(true)}
            icon={<BookOpen className="w-3.5 h-3.5 text-indigo-600" />}
          >
            Parameter guide
          </Button>

          <Button
            variant="secondary"
            size="sm"
            disabled={!results}
            onClick={() => results && exportToCSV(results)}
            icon={<FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />}
          >
            Export CSV
          </Button>

          <Button
            variant="secondary"
            size="sm"
            disabled={!results}
            onClick={() => results && exportToJSON(results, summaryStats)}
            icon={<Download className="w-3.5 h-3.5 text-blue-600" />}
          >
            Export JSON
          </Button>
        </div>
      </div>

      {/* Main Grid: Sidebar (3 cols), Center Visualizations (6 cols), Statistics (3 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3">
          <ParameterSidebar
            onRunSimulation={executeSimulation}
            onOpenGuide={() => setIsGuideModalOpen(true)}
          />
        </div>

        {/* Center Column: Interactive Scientific Charts Suite */}
        <div className="lg:col-span-8 xl:col-span-6 space-y-6">
          <div className="card-panel p-4 sm:p-5 rounded-xl space-y-4">
            {/* Scrollable Navigation Tabs on Mobile */}
            <div className="border-b border-slate-200 pb-3">
              <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar py-1">
                {Object.values(TAB_METADATA).map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium font-mono transition-colors flex-shrink-0 cursor-pointer ${
                        isActive
                          ? 'text-white font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeChartTabPill"
                          className="absolute inset-0 bg-slate-900 rounded-md shadow-xs"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                      )}
                      <Icon
                        className={`relative z-10 w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`}
                      />
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Tab Description Header */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 sm:p-3.5 text-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 font-heading text-xs">
                  <ActiveTabIcon className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{activeTabMeta.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsGuidanceOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-sans font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 shadow-2xs transition-all cursor-pointer"
                    aria-expanded={isGuidanceOpen}
                    aria-label="Toggle what to look for guidance"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>What to look for</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-blue-600 transition-transform duration-200 ${
                        isGuidanceOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
              <p className="text-[11px] font-sans text-slate-600 leading-relaxed">
                {activeTabMeta.description}
              </p>

              {/* Collapsible Guidance Dropdown */}
              <AnimatePresence initial={false}>
                {isGuidanceOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2.5 border-t border-slate-200/60 bg-blue-50/50 p-3 rounded-md border border-blue-100/80 text-[11px] space-y-2 mt-1">
                      <div className="flex items-center gap-1.5 text-blue-900 font-bold font-sans text-[11px]">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Specific indicators to look for:</span>
                      </div>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-slate-700 text-[10.5px] font-sans list-disc list-inside">
                        {activeTabMeta.whatToLookFor.map((item, idx) => (
                          <li key={idx} className="leading-snug marker:text-blue-500">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Active Chart View */}
            <div className="relative">
              {isSimulating && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-xs z-20 rounded-lg flex items-center justify-center font-mono text-slate-800 gap-2">
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <span>Computing iterations...</span>
                </div>
              )}

              {results && summaryStats ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12, ease: 'easeOut' }}
                  >
                    {activeTab === 'thresholds' && (
                      <ExceedanceAnalyzer
                        results={results}
                        parameters={parameters}
                        compoundId={samplingConfig.compoundId}
                        samplingMethod={samplingConfig.method}
                      />
                    )}
                    {activeTab === 'histogram' && (
                      <HistogramChart results={results} summaryStats={summaryStats} />
                    )}
                    {activeTab === 'cdf' && <CDFChart results={results} />}
                    {activeTab === 'timecourse' && <TimeCourseChart results={results} />}
                    {activeTab === 'scatter' && <ScatterPlotChart results={results} />}
                    {activeTab === 'tornado' && (
                      <TornadoChart sensitivityRanks={sensitivityRanks} />
                    )}
                    {activeTab === 'convergence' && <ConvergenceChart results={results} />}

                    {activeTab === 'table' && (
                      <div className="space-y-3 font-mono text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              placeholder="Search iteration #..."
                              value={tableSearch}
                              onChange={(e) => {
                                setTableSearch(e.target.value);
                                setTablePage(1);
                              }}
                              className="bg-white border border-slate-300 text-slate-900 rounded-md px-3 py-1 text-xs focus:outline-none focus:border-blue-500 w-full sm:w-auto"
                            />
                            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200 text-[10px]">
                              <button
                                onClick={() => {
                                  setTableFilter('all');
                                  setTablePage(1);
                                }}
                                className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                                  tableFilter === 'all'
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                All ({results.length})
                              </button>
                              <button
                                onClick={() => {
                                  setTableFilter('exceeding');
                                  setTablePage(1);
                                }}
                                className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                                  tableFilter === 'exceeding'
                                    ? 'bg-red-600 text-white'
                                    : 'text-red-700 hover:text-red-900'
                                }`}
                              >
                                Exceeding HQ &gt; 1.0 (
                                {results.filter((r) => r.hazardQuotient > 1.0).length})
                              </button>
                              <button
                                onClick={() => {
                                  setTableFilter('safe');
                                  setTablePage(1);
                                }}
                                className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                                  tableFilter === 'safe'
                                    ? 'bg-emerald-600 text-white'
                                    : 'text-emerald-700 hover:text-emerald-900'
                                }`}
                              >
                                Safe ({results.filter((r) => r.hazardQuotient <= 1.0).length})
                              </button>
                            </div>
                          </div>
                          <span className="text-slate-500 text-[11px]">
                            Showing {paginatedResults.length} of {filteredResults.length} samples
                          </span>
                        </div>

                        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
                          <table className="w-full text-left border-collapse text-[11px]">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-700 bg-slate-50">
                                <th className="p-2">#</th>
                                <th className="p-2">Intake (µg/d)</th>
                                <th className="p-2">BW (kg)</th>
                                <th className="p-2">Half-Life (yr)</th>
                                <th className="p-2 text-amber-800">Body Burden (µg)</th>
                                <th className="p-2 text-blue-700">Serum Css (µg/L)</th>
                                <th className="p-2 text-red-700">HQ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-800">
                              {paginatedResults.map((row) => (
                                <tr
                                  key={row.iteration}
                                  className={`hover:bg-slate-50 ${row.hazardQuotient > 1.0 ? 'bg-red-50/25' : ''}`}
                                >
                                  <td className="p-2 text-slate-400">{row.iteration}</td>
                                  <td className="p-2 font-mono">{row.dailyIntake.toFixed(4)}</td>
                                  <td className="p-2">{row.bodyWeight.toFixed(1)}</td>
                                  <td className="p-2">{row.eliminationHalfLife.toFixed(2)}</td>
                                  <td className="p-2 font-mono text-amber-900 font-semibold">
                                    {row.peakBodyBurden.toFixed(3)}
                                  </td>
                                  <td className="p-2 font-mono text-blue-700 font-bold">
                                    {row.steadyStateConcentration.toFixed(4)}
                                  </td>
                                  <td
                                    className={`p-2 font-mono font-bold ${row.hazardQuotient > 1.0 ? 'text-red-600' : 'text-emerald-700'}`}
                                  >
                                    {row.hazardQuotient.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between text-slate-600 pt-1">
                          <button
                            disabled={tablePage <= 1}
                            onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                            className="px-3 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                          >
                            Previous
                          </button>
                          <span>
                            Page {tablePage} of {totalPages}
                          </span>
                          <button
                            disabled={tablePage >= totalPages}
                            onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
                            className="px-3 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="h-72 flex items-center justify-center text-slate-400 text-xs font-mono">
                  Loading simulation data...
                </div>
              )}
            </div>
          </div>

          {/* Execution Log Console */}
          <SimulationConsole />
        </div>

        {/* Right Column: Statistics & Quantiles */}
        <div className="lg:col-span-12 xl:col-span-3">
          <SummaryPanel
            summaryStats={summaryStats}
            sensitivityRanks={sensitivityRanks}
            samplingMethod={samplingConfig.method}
            compoundId={samplingConfig.compoundId}
            results={results}
            parameters={parameters}
          />
        </div>
      </div>

      {/* Parameter Input & Usage Reference Guide Modal */}
      <ParameterGuideModal isOpen={isGuideModalOpen} onClose={() => setIsGuideModalOpen(false)} />
    </div>
  );
};
