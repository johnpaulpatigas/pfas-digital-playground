import { BookOpen, Download, FileSpreadsheet } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { MathView } from '../components/ui/MathView';
import { ParameterGuideModal } from '../features/playground/ParameterGuideModal';
import { ParameterSidebar } from '../features/playground/ParameterSidebar';
import { ResultsSectionA } from '../features/playground/ResultsSectionA';
import { ResultsSectionB } from '../features/playground/ResultsSectionB';
import { ResultsSectionC } from '../features/playground/ResultsSectionC';
import { useCohortComparison } from '../features/statistics/useCohortComparison';
import { useCompoundSummaries } from '../features/statistics/useCompoundSummaries';
import { PFAS_COMPOUNDS } from '../simulation/pfasCompounds';
import { executeSimulationAsync } from '../simulation/runSimulationAsync';
import { useSimulationStore } from '../stores/useSimulationStore';
import { exportToCSV, exportToJSON } from '../utils/exportUtils';

export const PlaygroundPage: React.FC = () => {
  const parameters = useSimulationStore((state) => state.parameters);
  const samplingConfig = useSimulationStore((state) => state.samplingConfig);
  const activeScenarioId = useSimulationStore((state) => state.activeScenarioId);
  const isSimulating = useSimulationStore((state) => state.isSimulating);
  const results = useSimulationStore((state) => state.results);
  const summaryStats = useSimulationStore((state) => state.summaryStats);
  const sensitivityRanks = useSimulationStore((state) => state.sensitivityRanks);
  const setSimulationResults = useSimulationStore((state) => state.setSimulationResults);
  const setIsSimulating = useSimulationStore((state) => state.setIsSimulating);
  const addLog = useSimulationStore((state) => state.addLog);

  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const activeCompound =
    PFAS_COMPOUNDS.find((c) => c.id === samplingConfig.compoundId) || PFAS_COMPOUNDS[0];

  const compoundSummaries = useCompoundSummaries(results, parameters);
  const { wilcoxonRows, mannWhitneyCssRows, mannWhitneyBurdenRows } = useCohortComparison(
    results,
    activeScenarioId,
    samplingConfig,
  );

  const runSimulation = useCallback(async () => {
    setIsSimulating(true);
    addLog(
      `[Sim] Running ${samplingConfig.method} (${samplingConfig.iterations.toLocaleString()} iterations, Seed: ${samplingConfig.seed})...`,
    );

    try {
      const startTime = performance.now();
      const simResult = await executeSimulationAsync(parameters, samplingConfig);
      const elapsed = Math.round(performance.now() - startTime);

      setSimulationResults(
        simResult.simResults,
        simResult.summaryStats,
        simResult.sensitivityRanks,
        simResult.compoundSummaries,
      );
      addLog(
        `[Done] Completed in ${elapsed}ms. Mean Css: ${simResult.summaryStats.mean.toFixed(4)} µg/L, P95: ${simResult.summaryStats.p95.toFixed(4)} µg/L.`,
      );
    } catch (err) {
      addLog(`[Error] Simulation failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSimulating(false);
    }
  }, [parameters, samplingConfig, setIsSimulating, addLog, setSimulationResults]);

  useEffect(() => {
    if (!results && !isSimulating) {
      void runSimulation();
    }
  }, [results, isSimulating, runSimulation]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      {/* Top Title Card */}
      <div className="card-panel p-4 sm:p-5 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              PFAS toxicokinetic simulation playground
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-semibold border border-slate-200">
              {activeScenarioId === 'custom' ? activeCompound.name : 'All 5 PFAS Compounds'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Probabilistic 1-compartment modeling: bioaccumulation serum concentration (
            <MathView math="C_{ss}" />) &amp; internal body burden (<MathView math="B(t)" />)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsGuideOpen(true)}
            icon={<BookOpen className="w-3.5 h-3.5" />}
          >
            Parameter guide
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!results}
            onClick={() => results && exportToCSV(results, activeCompound.id)}
            icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!results || !summaryStats}
            onClick={() =>
              results && summaryStats && exportToJSON(results, summaryStats, activeCompound.id)
            }
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export JSON
          </Button>
        </div>
      </div>

      {/* Main 2-Column Desktop Layout: 1. Input (Left) | 2. Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* 1. INPUT COLUMN */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-3">
          <div className="card-panel px-4 py-2.5 rounded-xl flex items-center justify-between">
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900">
              1. Input
            </h2>
            <span className="text-[10px] font-mono text-slate-500">Configuration</span>
          </div>

          <ParameterSidebar
            onRunSimulation={runSimulation}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        </aside>

        {/* 2. RESULTS COLUMN */}
        <main className="lg:col-span-8 xl:col-span-9 space-y-5">
          <div className="card-panel px-4 py-2.5 rounded-xl flex items-center justify-between">
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900">
              2. Results
            </h2>
            <span className="text-[10px] font-mono text-slate-500">
              {results ? `${results.length.toLocaleString()} iterations` : 'Pending'}
            </span>
          </div>

          {results && summaryStats ? (
            <div className="space-y-6">
              {/* Top Half: Section A (Left) | Section B (Right) */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <div className="card-panel p-4 sm:p-5 rounded-2xl space-y-4">
                  <div className="border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800">
                      Section A — Exposure, <MathView math="C_{ss}" /> &amp; Body Burden
                    </span>
                  </div>
                  <ResultsSectionA
                    results={results}
                    summaryStats={summaryStats}
                    parameters={parameters}
                    compoundId={samplingConfig.compoundId}
                    compoundSummaries={compoundSummaries}
                    activeScenarioId={activeScenarioId}
                    mannWhitneyCssRows={mannWhitneyCssRows}
                    mannWhitneyBurdenRows={mannWhitneyBurdenRows}
                  />
                </div>

                <div className="card-panel p-4 sm:p-5 rounded-2xl space-y-4">
                  <div className="border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800">
                      Section B — Exposure Drivers &amp; Risk Assessment
                    </span>
                  </div>
                  <ResultsSectionB
                    sensitivityRanks={sensitivityRanks}
                    wilcoxonRows={wilcoxonRows}
                  />
                </div>
              </div>

              {/* Bottom Half: Section C (Full Width of Results) */}
              <div className="card-panel p-4 sm:p-5 rounded-2xl space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800">
                    Section C — Data Table, Variance &amp; Population Quantiles
                  </span>
                </div>
                <ResultsSectionC results={results} summaryStats={summaryStats} />
              </div>
            </div>
          ) : (
            <div className="card-panel p-12 rounded-2xl text-center text-slate-500 font-mono text-xs">
              Running initial simulation...
            </div>
          )}
        </main>
      </div>

      <ParameterGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
};
