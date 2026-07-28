import React, { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulationStore } from '../stores/useSimulationStore';
import { executeSimulationAsync } from '../simulation/runSimulationAsync';
import { ParameterSidebar } from '../features/playground/ParameterSidebar';
import { SummaryPanel } from '../features/statistics/SummaryPanel';
import { SimulationConsole } from '../features/playground/SimulationConsole';
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
} from 'lucide-react';
import { Button } from '../components/ui/Button';

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

  const [activeTab, setActiveTab] = useState<
    'histogram' | 'cdf' | 'timecourse' | 'scatter' | 'tornado' | 'convergence' | 'table'
  >('histogram');

  const [tableSearch, setTableSearch] = useState('');
  const [tablePage, setTablePage] = useState(1);

  const activeCompound = PFAS_COMPOUNDS.find((c) => c.id === samplingConfig.compoundId) || PFAS_COMPOUNDS[0];

  const executeSimulation = useCallback(() => {
    setIsSimulating(true);

    executeSimulationAsync(parameters, samplingConfig)
      .then(({ simResults, summaryStats, sensitivityRanks }) => {
        setSimulationResults(simResults, summaryStats, sensitivityRanks);
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
    if (!tableSearch) return results;
    return results.filter((r) => r.iteration.toString().includes(tableSearch));
  }, [results, tableSearch]);

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
              {activeCompound.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono">
            Probabilistic 1-Compartment Modeling • Target: Bioaccumulation Serum (<MathView math="C_{ss}" />)
          </p>
        </div>

        {/* Quick Export Controls */}
        <div className="flex items-center gap-2">
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
          <ParameterSidebar onRunSimulation={executeSimulation} />
        </div>

        {/* Center Column: Interactive Scientific Charts Suite */}
        <div className="lg:col-span-8 xl:col-span-6 space-y-6">
          <div className="card-panel p-4 sm:p-5 rounded-xl space-y-4">
            {/* Scrollable Navigation Tabs on Mobile */}
            <div className="border-b border-slate-200 pb-3">
              <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar py-1">
                {[
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
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                  >
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
                        <input
                          type="text"
                          placeholder="Search iteration number..."
                          value={tableSearch}
                          onChange={(e) => {
                            setTableSearch(e.target.value);
                            setTablePage(1);
                          }}
                          className="bg-white border border-slate-300 text-slate-900 rounded-md px-3 py-1 text-xs focus:outline-none focus:border-blue-500 w-full sm:w-auto"
                        />
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
                              <th className="p-2 text-blue-700">Serum Css (µg/L)</th>
                              <th className="p-2 text-amber-700">HQ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-800">
                            {paginatedResults.map((row) => (
                              <tr key={row.iteration} className="hover:bg-slate-50">
                                <td className="p-2 text-slate-400">{row.iteration}</td>
                                <td className="p-2">{row.dailyIntake.toFixed(4)}</td>
                                <td className="p-2">{row.bodyWeight.toFixed(1)}</td>
                                <td className="p-2">{row.eliminationHalfLife.toFixed(2)}</td>
                                <td className="p-2 text-blue-700 font-bold">{row.steadyStateConcentration.toFixed(4)}</td>
                                <td className={`p-2 font-bold ${row.hazardQuotient > 1.0 ? 'text-red-600' : 'text-slate-800'}`}>
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
          />
        </div>
      </div>
    </div>
  );
};
