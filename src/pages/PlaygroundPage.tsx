import React, { useEffect, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useSimulationStore } from '../stores/useSimulationStore';
import { executeSimulationAsync } from '../simulation/runSimulationAsync';
import { ParameterSidebar } from '../features/playground/ParameterSidebar';
import { SummaryPanel } from '../features/statistics/SummaryPanel';
import { SimulationConsole } from '../features/playground/SimulationConsole';
import { ExceedanceAnalyzer } from '../features/playground/ExceedanceAnalyzer';
import { ParameterGuideModal } from '../features/playground/ParameterGuideModal';
import { HistogramChart } from '../features/charts/HistogramChart';
import { CDFChart } from '../features/charts/CDFChart';
import { TimeCourseChart } from '../features/charts/TimeCourseChart';
import { ScatterPlotChart } from '../features/charts/ScatterPlotChart';
import { TornadoChart } from '../features/charts/TornadoChart';
import { ConvergenceChart } from '../features/charts/ConvergenceChart';
import { exportToCSV, exportToJSON } from '../utils/exportUtils';
import { MathView } from '../components/ui/MathView';
import { PFAS_COMPOUNDS } from '../simulation/pfasCompounds';
import {
  Download,
  BarChart2,
  LineChart as LineChartIcon,
  Activity,
  Flame,
  FileSpreadsheet,
  Clock,
  ScatterChart as ScatterIcon,
  Table as TableIcon,
  GraduationCap,
  Zap,
  BookOpen,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const PlaygroundPage: React.FC = () => {
  const {
    mode,
    parameters,
    samplingConfig,
    results,
    summaryStats,
    sensitivityRanks,
    isSimulating,
    setIsSimulating,
    setSimulationResults,
  } = useSimulationStore();

  const isSimpleMode = mode === 'simple';

  const [activeTab, setActiveTab] = useState<
    'thresholds' | 'histogram' | 'cdf' | 'timecourse' | 'scatter' | 'tornado' | 'convergence' | 'table'
  >('thresholds');

  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [tableFilter, setTableFilter] = useState<'all' | 'exceeding' | 'safe'>('all');
  const [tablePage, setTablePage] = useState(1);

  const activeCompound = PFAS_COMPOUNDS.find((c) => c.id === samplingConfig.compoundId) || PFAS_COMPOUNDS[0];

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
              PFAS Toxicokinetic Simulation Playground
            </h1>
            <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-xs font-mono font-bold">
              {isSimpleMode ? '5 PFAS Types Parallel Evaluation' : activeCompound.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono">
            {isSimpleMode
              ? 'Multi-PFAS 100k MC+LHS Simulation • Evaluating PFOA, PFOS, PFHxS, PFNA & GenX'
              : <>Probabilistic 1-Compartment Modeling • Target: Bioaccumulation Serum (<MathView math="C_{ss}" />)</>}
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
            Parameter &amp; Input Guide
          </Button>

          <Link to="/guide">
            <Button
              variant="secondary"
              size="sm"
              icon={<GraduationCap className="w-3.5 h-3.5 text-blue-600" />}
            >
              Scientific Guide
            </Button>
          </Link>

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
                {[
                  { id: 'thresholds', label: 'Exceedance Analyzer', icon: Zap },
                  { id: 'histogram', label: 'Frequency Histogram', icon: BarChart2 },
                  { id: 'cdf', label: 'CDF', icon: LineChartIcon },
                  { id: 'timecourse', label: 'Bioaccumulation C(t)', icon: Clock },
                  { id: 'scatter', label: 'Scatter', icon: ScatterIcon },
                  { id: 'tornado', label: 'Sensitivity Tornado', icon: Flame },
                  { id: 'convergence', label: 'Convergence', icon: Activity },
                  { id: 'table', label: 'Data Matrix', icon: TableIcon },
                ].map((tab) => {

                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
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
                      <Icon className={`relative z-10 w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Chart View */}
            <div className="relative">
              {isSimulating && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-xs z-20 rounded-lg flex items-center justify-center font-mono text-slate-800 gap-2">
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <span>Computing Toxicokinetic Iterations...</span>
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
                              onClick={() => { setTableFilter('all'); setTablePage(1); }}
                              className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                                tableFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              All ({results.length})
                            </button>
                            <button
                              onClick={() => { setTableFilter('exceeding'); setTablePage(1); }}
                              className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                                tableFilter === 'exceeding' ? 'bg-red-600 text-white' : 'text-red-700 hover:text-red-900'
                              }`}
                            >
                              Exceeding HQ &gt; 1.0 ({results.filter((r) => r.hazardQuotient > 1.0).length})
                            </button>
                            <button
                              onClick={() => { setTableFilter('safe'); setTablePage(1); }}
                              className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                                tableFilter === 'safe' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:text-emerald-900'
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
                              {isSimpleMode ? (
                                <>
                                  <th className="p-2 text-blue-700">PFOA Css</th>
                                  <th className="p-2 text-teal-700">PFOS Css</th>
                                  <th className="p-2 text-purple-700">PFHxS Css</th>
                                  <th className="p-2 text-amber-700">PFNA Css</th>
                                  <th className="p-2 text-rose-700">GenX Css</th>
                                  <th className="p-2 text-slate-900">Burden (µg)</th>
                                  <th className="p-2 text-red-700">Max HQ</th>
                                </>
                              ) : (
                                <>
                                  <th className="p-2">Half-Life (yr)</th>
                                  <th className="p-2 text-amber-800">Body Burden (µg)</th>
                                  <th className="p-2 text-blue-700">Serum Css (µg/L)</th>
                                  <th className="p-2 text-red-700">HQ</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-800">
                            {paginatedResults.map((row) => {
                              const pfoaCss = row.compoundOutputs?.pfoa?.steadyStateConcentration ?? row.steadyStateConcentration;
                              const pfosCss = row.compoundOutputs?.pfos?.steadyStateConcentration ?? row.steadyStateConcentration;
                              const pfhxsCss = row.compoundOutputs?.pfhxs?.steadyStateConcentration ?? row.steadyStateConcentration;
                              const pfnaCss = row.compoundOutputs?.pfna?.steadyStateConcentration ?? row.steadyStateConcentration;
                              const genxCss = row.compoundOutputs?.genx?.steadyStateConcentration ?? row.steadyStateConcentration;
                              const maxHq = isSimpleMode && row.compoundOutputs
                                ? Math.max(
                                    row.compoundOutputs.pfoa.hazardQuotient,
                                    row.compoundOutputs.pfos.hazardQuotient,
                                    row.compoundOutputs.pfhxs.hazardQuotient,
                                    row.compoundOutputs.pfna.hazardQuotient,
                                    row.compoundOutputs.genx.hazardQuotient
                                  )
                                : row.hazardQuotient;

                              return (
                                <tr
                                  key={row.iteration}
                                  className={`hover:bg-slate-50 ${maxHq > 1.0 ? 'bg-red-50/25' : ''}`}
                                >
                                  <td className="p-2 text-slate-400">{row.iteration}</td>
                                  <td className="p-2 font-mono">{row.dailyIntake.toFixed(4)}</td>
                                  <td className="p-2">{row.bodyWeight.toFixed(1)}</td>
                                  {isSimpleMode ? (
                                    <>
                                      <td className="p-2 font-mono text-blue-700 font-semibold">{pfoaCss.toFixed(4)}</td>
                                      <td className="p-2 font-mono text-teal-700 font-semibold">{pfosCss.toFixed(4)}</td>
                                      <td className="p-2 font-mono text-purple-700 font-semibold">{pfhxsCss.toFixed(4)}</td>
                                      <td className="p-2 font-mono text-amber-700 font-semibold">{pfnaCss.toFixed(4)}</td>
                                      <td className="p-2 font-mono text-rose-700 font-semibold">{genxCss.toFixed(4)}</td>
                                      <td className="p-2 font-mono text-slate-900">{row.peakBodyBurden.toFixed(3)}</td>
                                      <td className={`p-2 font-mono font-bold ${maxHq > 1.0 ? 'text-red-600' : 'text-emerald-700'}`}>
                                        {maxHq.toFixed(2)}
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="p-2">{row.eliminationHalfLife.toFixed(2)}</td>
                                      <td className="p-2 font-mono text-amber-900 font-semibold">{row.peakBodyBurden.toFixed(3)}</td>
                                      <td className="p-2 font-mono text-blue-700 font-bold">{row.steadyStateConcentration.toFixed(4)}</td>
                                      <td className={`p-2 font-mono font-bold ${row.hazardQuotient > 1.0 ? 'text-red-600' : 'text-emerald-700'}`}>
                                        {row.hazardQuotient.toFixed(2)}
                                      </td>
                                    </>
                                  )}
                                </tr>
                              );
                            })}
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
                        <span>Page {tablePage} of {totalPages}</span>
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
            onOpenExceedanceAnalyzer={() => setActiveTab('thresholds')}
          />
        </div>
      </div>

      {/* Parameter Input & Usage Reference Guide Modal */}
      <ParameterGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
};

