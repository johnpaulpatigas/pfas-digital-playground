import {
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  FileText,
  Flame,
  GitMerge,
  Layers,
  Play,
  Scale,
  ShieldAlert,
  Users,
} from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '../components/ui/Button';
import { MathView } from '../components/ui/MathView';
import { DEMOGRAPHIC_PRESETS } from '../features/scenarios/presets';
import { runMonteCarloLhsSimulation } from '../simulation/monteCarloLhs';
import { PFAS_COMPOUNDS } from '../simulation/pfasCompounds';
import { executeComparisonAsync } from '../simulation/runSimulationAsync';
import {
  calculateConvergenceSeries,
  calculateMannWhitneyU,
  calculateOneSampleWilcoxon,
  calculatePRCC,
  calculateSummaryStatistics,
  quantileSorted,
} from '../simulation/statistics';
import { useSimulationStore } from '../stores/useSimulationStore';
import type { ComparisonResult, MannWhitneyUResult, WilcoxonOneSampleResult } from '../types';

interface CohortHypothesisRow {
  compoundId: string;
  compoundName: string;
  endpoint: string;
  hypothesisId: string;
  nullHypothesis: string;
  avgMedian: number;
  avgP25: number;
  avgP75: number;
  pregMedian: number;
  pregP25: number;
  pregP75: number;
  unit: string;
  testResult: MannWhitneyUResult;
}

interface CohortSensitivityRow {
  parameterId: string;
  parameterName: string;
  avgPRCC: number;
  avgTStat: number;
  avgPValue: number;
  avgIsSignificant: boolean;
  pregPRCC: number;
  pregTStat: number;
  pregPValue: number;
  pregIsSignificant: boolean;
}

interface CohortHealthRiskRow {
  id: string;
  sopId: string;
  name: string;
  benchmark: string;
  rfdDose?: number;
  avgMedianHQ: number;
  avgMeanHQ: number;
  avgExceedancePercent: number;
  avgWilcoxon: WilcoxonOneSampleResult;
  pregMedianHQ: number;
  pregMeanHQ: number;
  pregExceedancePercent: number;
  pregWilcoxon: WilcoxonOneSampleResult;
}

export const ComparePage: React.FC = () => {
  const { parameters } = useSimulationStore();
  const [activeTab, setActiveTab] = useState<'cohorts' | 'sampling'>('cohorts');
  const [showFrameworkTransition, setShowFrameworkTransition] = useState<boolean>(false);

  // Sampling benchmark state
  const [iterations, setIterations] = useState<number>(3000);
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);

  // Cohort comparison state (SOP Questions 1, 2, 3, 4)
  const [cohortIterations, setCohortIterations] = useState<number>(5000);
  const [isEvaluatingCohorts, setIsEvaluatingCohorts] = useState<boolean>(false);
  const [cohortResults, setCohortResults] = useState<{
    h1Rows: CohortHypothesisRow[];
    h2Rows: CohortHypothesisRow[];
    h3Rows: CohortSensitivityRow[];
    h4Rows: CohortHealthRiskRow[];
    totalIterations: number;
  } | null>(null);

  const runBenchmark = () => {
    setIsBenchmarking(true);

    executeComparisonAsync(parameters, iterations)
      .then(
        ({ mcResults, lhsResults, mcLhsResults, mcRuntimeMs, lhsRuntimeMs, mcLhsRuntimeMs }) => {
          const mcStats = calculateSummaryStatistics(mcResults);
          const lhsStats = calculateSummaryStatistics(lhsResults);
          const mcLhsStats = calculateSummaryStatistics(mcLhsResults);

          const mcConvergence = calculateConvergenceSeries(mcResults, 100);
          const lhsConvergence = calculateConvergenceSeries(lhsResults, 100);
          const mcLhsConvergence = calculateConvergenceSeries(mcLhsResults, 100);

          setComparison({
            mcStats,
            lhsStats,
            mcLhsStats,
            mcRuntimeMs,
            lhsRuntimeMs,
            mcLhsRuntimeMs,
            mcConvergence,
            lhsConvergence,
            mcLhsConvergence,
          });

          setIsBenchmarking(false);
        },
      )
      .catch((err) => {
        console.error('Benchmark execution error:', err);
        setIsBenchmarking(false);
      });
  };

  const runCohortEvaluation = () => {
    setIsEvaluatingCohorts(true);

    setTimeout(() => {
      try {
        const avgScenario = DEMOGRAPHIC_PRESETS.find((p) => p.id === 'average-filipino-woman')!;
        const pregScenario = DEMOGRAPHIC_PRESETS.find((p) => p.id === 'pregnant-woman')!;

        // Run stratified LHS-MCS for both cohorts
        const simAvg = runMonteCarloLhsSimulation(
          avgScenario.parameters,
          cohortIterations,
          42,
          'pfoa',
        );
        const simPreg = runMonteCarloLhsSimulation(
          pregScenario.parameters,
          cohortIterations,
          101,
          'pfoa',
        );

        const h1Rows: CohortHypothesisRow[] = [];
        const h2Rows: CohortHypothesisRow[] = [];
        const h4Rows: CohortHealthRiskRow[] = [];

        // Question 1, 2, and 4 (4.1 to 4.5 for individual PFAS)
        PFAS_COMPOUNDS.forEach((c, idx) => {
          // 1. Steady-state serum concentration (Css)
          const avgCss = simAvg.map(
            (r) =>
              r.compoundOutputs?.[c.id]?.steadyStateConcentration ?? r.steadyStateConcentration,
          );
          const pregCss = simPreg.map(
            (r) =>
              r.compoundOutputs?.[c.id]?.steadyStateConcentration ?? r.steadyStateConcentration,
          );

          const sortedAvgCss = [...avgCss].sort((a, b) => a - b);
          const sortedPregCss = [...pregCss].sort((a, b) => a - b);
          const mwCss = calculateMannWhitneyU(avgCss, pregCss);

          h1Rows.push({
            compoundId: c.id,
            compoundName: c.name.split(' ')[0],
            endpoint: 'Serum Concentration (Css)',
            hypothesisId: `H₀ 1 (${c.name.split(' ')[0]})`,
            nullHypothesis: `No significant difference in Css between Average and Pregnant women.`,
            avgMedian: parseFloat(quantileSorted(sortedAvgCss, 0.5).toFixed(4)),
            avgP25: parseFloat(quantileSorted(sortedAvgCss, 0.25).toFixed(4)),
            avgP75: parseFloat(quantileSorted(sortedAvgCss, 0.75).toFixed(4)),
            pregMedian: parseFloat(quantileSorted(sortedPregCss, 0.5).toFixed(4)),
            pregP25: parseFloat(quantileSorted(sortedPregCss, 0.25).toFixed(4)),
            pregP75: parseFloat(quantileSorted(sortedPregCss, 0.75).toFixed(4)),
            unit: 'µg/L',
            testResult: mwCss,
          });

          // 2. Cumulative Body Burden (B(t))
          const avgBb = simAvg.map(
            (r) => r.compoundOutputs?.[c.id]?.peakBodyBurden ?? r.peakBodyBurden,
          );
          const pregBb = simPreg.map(
            (r) => r.compoundOutputs?.[c.id]?.peakBodyBurden ?? r.peakBodyBurden,
          );

          const sortedAvgBb = [...avgBb].sort((a, b) => a - b);
          const sortedPregBb = [...pregBb].sort((a, b) => a - b);
          const mwBb = calculateMannWhitneyU(avgBb, pregBb);

          h2Rows.push({
            compoundId: c.id,
            compoundName: c.name.split(' ')[0],
            endpoint: 'Cumulative Body Burden (B(t))',
            hypothesisId: `H₀ 2 (${c.name.split(' ')[0]})`,
            nullHypothesis: `No significant difference in body burden over modeled exposure period (22 yrs vs. 19 yrs).`,
            avgMedian: parseFloat(quantileSorted(sortedAvgBb, 0.5).toFixed(3)),
            avgP25: parseFloat(quantileSorted(sortedAvgBb, 0.25).toFixed(3)),
            avgP75: parseFloat(quantileSorted(sortedAvgBb, 0.75).toFixed(3)),
            pregMedian: parseFloat(quantileSorted(sortedPregBb, 0.5).toFixed(3)),
            pregP25: parseFloat(quantileSorted(sortedPregBb, 0.25).toFixed(3)),
            pregP75: parseFloat(quantileSorted(sortedPregBb, 0.75).toFixed(3)),
            unit: 'µg',
            testResult: mwBb,
          });

          // 4. Health Risk Level: Hazard Quotient (HQ)
          const avgHQs = simAvg.map((r) => r.compoundOutputs?.[c.id]?.hazardQuotient ?? 0);
          const pregHQs = simPreg.map((r) => r.compoundOutputs?.[c.id]?.hazardQuotient ?? 0);

          const sortedAvgHQ = [...avgHQs].sort((a, b) => a - b);
          const sortedPregHQ = [...pregHQs].sort((a, b) => a - b);

          const avgMeanHQ = avgHQs.reduce((acc, v) => acc + v, 0) / avgHQs.length;
          const pregMeanHQ = pregHQs.reduce((acc, v) => acc + v, 0) / pregHQs.length;

          const avgWilcoxon = calculateOneSampleWilcoxon(avgHQs, 1.0);
          const pregWilcoxon = calculateOneSampleWilcoxon(pregHQs, 1.0);

          h4Rows.push({
            id: c.id,
            sopId: `4.${idx + 1}`,
            name: c.name,
            benchmark: `RfD = ${c.rfdDose} µg/kg/day`,
            rfdDose: c.rfdDose,
            avgMedianHQ: parseFloat(quantileSorted(sortedAvgHQ, 0.5).toFixed(3)),
            avgMeanHQ: parseFloat(avgMeanHQ.toFixed(3)),
            avgExceedancePercent: avgWilcoxon.exceedancePercent,
            avgWilcoxon,
            pregMedianHQ: parseFloat(quantileSorted(sortedPregHQ, 0.5).toFixed(3)),
            pregMeanHQ: parseFloat(pregMeanHQ.toFixed(3)),
            pregExceedancePercent: pregWilcoxon.exceedancePercent,
            pregWilcoxon,
          });
        });

        // 4.6 Exploratory sum of HQs across the five modeled compounds
        const avgHIs = simAvg.map((r) => r.hazardIndex ?? 0);
        const pregHIs = simPreg.map((r) => r.hazardIndex ?? 0);
        const sortedAvgHI = [...avgHIs].sort((a, b) => a - b);
        const sortedPregHI = [...pregHIs].sort((a, b) => a - b);

        const avgMeanHI = avgHIs.reduce((acc, v) => acc + v, 0) / avgHIs.length;
        const pregMeanHI = pregHIs.reduce((acc, v) => acc + v, 0) / pregHIs.length;

        const avgWilcoxonHI = calculateOneSampleWilcoxon(avgHIs, 1.0);
        const pregWilcoxonHI = calculateOneSampleWilcoxon(pregHIs, 1.0);

        h4Rows.push({
          id: 'mixture-hi',
          sopId: '4.6',
          name: 'Exploratory sum of HQs (5 modeled PFAS)',
          benchmark: 'Exploratory threshold (sum = 1.0)',
          avgMedianHQ: parseFloat(quantileSorted(sortedAvgHI, 0.5).toFixed(3)),
          avgMeanHQ: parseFloat(avgMeanHI.toFixed(3)),
          avgExceedancePercent: avgWilcoxonHI.exceedancePercent,
          avgWilcoxon: avgWilcoxonHI,
          pregMedianHQ: parseFloat(quantileSorted(sortedPregHI, 0.5).toFixed(3)),
          pregMeanHQ: parseFloat(pregMeanHI.toFixed(3)),
          pregExceedancePercent: pregWilcoxonHI.exceedancePercent,
          pregWilcoxon: pregWilcoxonHI,
        });

        // 3. Question 3 & Hypothesis 3: PRCC Sensitivity on Css for both cohorts
        const avgPRCCs = calculatePRCC(simAvg, avgScenario.parameters, 'steadyStateConcentration');
        const pregPRCCs = calculatePRCC(
          simPreg,
          pregScenario.parameters,
          'steadyStateConcentration',
        );

        const prccMapAvg = new Map(avgPRCCs.map((p) => [p.parameterId, p]));
        const prccMapPreg = new Map(pregPRCCs.map((p) => [p.parameterId, p]));

        const paramOrder = [
          'dailyIntakePfoa',
          'bodyWeight',
          'waterConsumption',
          'eliminationHalfLife',
          'bioavailability',
          'exposureDuration',
          'age',
        ];

        const h3Rows: CohortSensitivityRow[] = paramOrder.map((key) => {
          const pAvg = prccMapAvg.get(key);
          const pPreg = prccMapPreg.get(key);
          return {
            parameterId: key,
            parameterName:
              avgScenario.parameters[key as keyof typeof avgScenario.parameters]?.name || key,
            avgPRCC: pAvg?.prcc ?? 0,
            avgTStat: pAvg?.tStatistic ?? 0,
            avgPValue: pAvg?.pValue ?? 1,
            avgIsSignificant: pAvg?.isSignificant ?? false,
            pregPRCC: pPreg?.prcc ?? 0,
            pregTStat: pPreg?.tStatistic ?? 0,
            pregPValue: pPreg?.pValue ?? 1,
            pregIsSignificant: pPreg?.isSignificant ?? false,
          };
        });

        setCohortResults({
          h1Rows,
          h2Rows,
          h3Rows,
          h4Rows,
          totalIterations: cohortIterations,
        });
      } catch (err) {
        console.error('Cohort evaluation failed:', err);
      } finally {
        setIsEvaluatingCohorts(false);
      }
    }, 50);
  };

  const combinedConvergenceData = useMemo(() => {
    return comparison
      ? comparison.mcConvergence.map((item, idx) => ({
          iteration: item.iteration,
          MonteCarlo: item.runningMean,
          LatinHypercube: comparison.lhsConvergence[idx]?.runningMean || item.runningMean,
          MonteCarloLHS: comparison.mcLhsConvergence?.[idx]?.runningMean || item.runningMean,
        }))
      : [];
  }, [comparison]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Tab Navigation */}
      <div className="card-panel p-6 sm:p-8 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-800 text-xs font-mono font-medium">
            <Scale className="w-3.5 h-3.5" />
            <span>Comparative Research & Hypothesis Testing</span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab('cohorts')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'cohorts'
                  ? 'bg-white text-purple-900 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Demographic Cohorts (SOP & Hypotheses)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sampling')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'sampling'
                  ? 'bg-white text-purple-900 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Sampling Algorithms (MC vs LHS)</span>
            </button>
          </div>
        </div>

        {activeTab === 'cohorts' ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">
                  Cohort Comparison & Study Hypotheses Evaluation
                </h1>
                <p className="text-slate-600 text-sm max-w-4xl leading-relaxed mt-1">
                  Tests the study&apos;s <strong>Statement of the Problem (SOP 1 to 4)</strong> and{' '}
                  <strong>Hypotheses (H₀ 1 to 4)</strong> for Average Filipino Women (22-year
                  exposure) and Pregnant Filipino Women (19-year exposure) using Latin Hypercube
                  Sampling (LHS-MCS).
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowFrameworkTransition((prev) => !prev)}
                icon={
                  showFrameworkTransition ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )
                }
              >
                {showFrameworkTransition ? 'Hide SOP & Hypotheses' : 'View SOP & Hypotheses'}
              </Button>
            </div>

            {/* Collapsible Research Framework and Hypotheses */}
            {showFrameworkTransition && (
              <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 font-sans text-xs">
                <div className="flex items-center gap-2 text-purple-900 font-bold font-heading text-sm border-b border-slate-200 pb-2">
                  <FileText className="w-4 h-4 text-purple-700" />
                  <span>Research Framework & Hypotheses</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-emerald-200 space-y-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                    SOP & Hypotheses
                  </span>
                  <ul className="space-y-1.5 text-slate-600 text-[11px] list-disc list-inside">
                    <li>
                      <strong>Q1 & H₀ 1 (Css):</strong> Two-sided Mann-Whitney U test (α = 0.05)
                      comparing Average vs. Pregnant women across all 5 PFAS.
                    </li>
                    <li>
                      <strong>Q2 & H₀ 2 (Body Burden):</strong> Calibrated modeled exposure
                      horizons: <strong>22 years</strong> for Average and <strong>19 years</strong>{' '}
                      for Pregnant women (NDHS data).
                    </li>
                    <li>
                      <strong>Q3 & H₀ 3 (Sensitivity):</strong> Global sensitivity on steady-state
                      serum concentration (Css) using Partial Rank Correlation Coefficients (PRCC,
                      |PRCC| ≥ 0.10, p &lt; 0.05).
                    </li>
                    <li>
                      <strong>Q4 & H₀ 4 (Health Risk):</strong> Selected chronic RfD/MRL-based
                      Hazard Quotients (HQ 4.1 to 4.5), exploratory sum of HQs (4.6), % exceeding
                      1.0, and one-sided Wilcoxon signed-rank test against 1.0.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-200 mt-4">
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-slate-600">Sample Iterations per Cohort (N):</span>
                <select
                  value={cohortIterations}
                  onChange={(e) => setCohortIterations(parseInt(e.target.value, 10))}
                  className="bg-white border border-slate-300 text-slate-900 rounded-md px-3 py-1.5 focus:outline-none"
                >
                  <option value={2000}>2,000 Iterations</option>
                  <option value={5000}>5,000 Iterations</option>
                  <option value={10000}>10,000 Iterations</option>
                  <option value={25000}>25,000 Iterations</option>
                </select>
              </div>

              <Button
                onClick={runCohortEvaluation}
                loading={isEvaluatingCohorts}
                variant="primary"
                size="md"
                icon={<ArrowRightLeft className="w-4 h-4" />}
              >
                Execute full study SOP & hypothesis tests (H₀ 1, H₀ 2, H₀ 3, H₀ 4)
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">
              Monte Carlo, Latin Hypercube, and Hybrid Sampling Comparison
            </h1>
            <p className="text-slate-600 text-sm max-w-4xl leading-relaxed mt-2">
              Benchmarks runtime, variance reduction, and running mean convergence rates across{' '}
              <strong>Monte Carlo (MC)</strong>, <strong>Latin Hypercube (LHS)</strong>, and{' '}
              <strong>Hybrid (MC + LHS)</strong> methods under identical parameter distributions.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-200 mt-4">
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-slate-600">Sample Iterations (N):</span>
                <select
                  value={iterations}
                  onChange={(e) => setIterations(parseInt(e.target.value, 10))}
                  className="bg-white border border-slate-300 text-slate-900 rounded-md px-3 py-1.5 focus:outline-none"
                >
                  <option value={1000}>1,000 Iterations</option>
                  <option value={3000}>3,000 Iterations</option>
                  <option value={5000}>5,000 Iterations</option>
                  <option value={10000}>10,000 Iterations</option>
                </select>
              </div>

              <Button
                onClick={runBenchmark}
                loading={isBenchmarking}
                variant="primary"
                size="md"
                icon={<Play className="w-4 h-4 fill-current" />}
              >
                Run benchmark comparison
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Cohort Results Tab */}
      {activeTab === 'cohorts' && cohortResults && (
        <div className="space-y-8 font-mono">
          {/* Summary Box */}
          <div className="card-panel p-5 rounded-xl space-y-3 bg-purple-50/40 border border-purple-200">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-700" />
              <h2 className="text-sm font-bold text-slate-900 font-heading">
                Cohort Toxicokinetic Baseline Summary
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
              <div className="bg-white p-3 rounded-lg border border-purple-100">
                <span className="font-bold text-purple-900 block mb-1">
                  Average Filipino Woman Profile
                </span>
                <ul className="space-y-0.5 text-[11px] text-slate-600">
                  <li>
                    • Chronic Exposure Horizon: <strong>22 years</strong>
                  </li>
                  <li>• Baseline Body Mass: 55.4 kg (±8.2 kg)</li>
                  <li>• Daily Water Intake: 2.0 L/day (mode)</li>
                </ul>
              </div>
              <div className="bg-white p-3 rounded-lg border border-purple-100">
                <span className="font-bold text-purple-900 block mb-1">
                  Pregnant Female Cohort Profile
                </span>
                <ul className="space-y-0.5 text-[11px] text-slate-600">
                  <li>
                    • Pre-Gestational Exposure: <strong>19 years</strong>
                  </li>
                  <li>• Baseline Body Mass: 65.2 kg (plasma volume expansion)</li>
                  <li>• Daily Water Intake: 2.8 L/day (increased fluid demands)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Hypothesis 1 Table: Steady-State Serum Concentration (Css) */}
          <div className="card-panel p-6 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-heading">
                  Hypothesis 1: Steady-State Serum Concentration (<MathView math="C_{ss}" />)
                  Differences
                </h2>
                <p className="text-slate-500 text-xs">
                  H₀ 1: No significant difference in Css between cohorts | Two-Sided Mann-Whitney U
                  Test (α = 0.05)
                </p>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                N = {cohortResults.totalIterations.toLocaleString()} iterations/cohort
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                    <th className="py-2.5 px-3 font-semibold">PFAS Compound</th>
                    <th className="py-2.5 px-3 font-semibold">Average Median (P25 - P75)</th>
                    <th className="py-2.5 px-3 font-semibold">Pregnant Median (P25 - P75)</th>
                    <th className="py-2.5 px-3 font-semibold">Mann-Whitney U</th>
                    <th className="py-2.5 px-3 font-semibold">Z-Score</th>
                    <th className="py-2.5 px-3 font-semibold">p-value</th>
                    <th className="py-2.5 px-3 font-semibold">Rank-Biserial r</th>
                    <th className="py-2.5 px-3 font-semibold">Decision (α = 0.05)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cohortResults.h1Rows.map((row) => (
                    <tr key={row.compoundId} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-bold text-slate-900 font-sans">
                        {row.compoundName}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className="font-bold text-blue-900">{row.avgMedian.toFixed(4)}</span>{' '}
                        <span className="text-[10px] text-slate-400">
                          [{row.avgP25.toFixed(4)} to {row.avgP75.toFixed(4)}] {row.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className="font-bold text-purple-900">
                          {row.pregMedian.toFixed(4)}
                        </span>{' '}
                        <span className="text-[10px] text-slate-400">
                          [{row.pregP25.toFixed(4)} to {row.pregP75.toFixed(4)}] {row.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {row.testResult.uStat.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {row.testResult.zScore.toFixed(3)}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`font-bold ${
                            row.testResult.pValue < 0.05 ? 'text-red-700' : 'text-slate-700'
                          }`}
                        >
                          {row.testResult.pValue < 0.001
                            ? '< 0.001'
                            : row.testResult.pValue.toFixed(4)}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {row.testResult.rankBiserialCorrelation.toFixed(3)}
                      </td>
                      <td className="py-3 px-3">
                        {row.testResult.isSignificant ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Reject H₀ (Significant)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200">
                            <AlertCircle className="w-3 h-3" />
                            Fail to Reject H₀
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hypothesis 2 Table: Cumulative Body Burden */}
          <div className="card-panel p-6 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-heading">
                  Hypothesis 2: Cumulative Body Burden (<MathView math="B(t)" />) Differences
                </h2>
                <p className="text-slate-500 text-xs">
                  H₀ 2: Cumulative body burden does not differ significantly between cohorts over
                  modeled exposure (22 yrs vs. 19 yrs) | Two-Sided Mann-Whitney U Test (α = 0.05)
                </p>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                N = {cohortResults.totalIterations.toLocaleString()} iterations/cohort
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                    <th className="py-2.5 px-3 font-semibold">PFAS Compound</th>
                    <th className="py-2.5 px-3 font-semibold">Average Median (22 yrs)</th>
                    <th className="py-2.5 px-3 font-semibold">Pregnant Median (19 yrs)</th>
                    <th className="py-2.5 px-3 font-semibold">Mann-Whitney U</th>
                    <th className="py-2.5 px-3 font-semibold">Z-Score</th>
                    <th className="py-2.5 px-3 font-semibold">p-value</th>
                    <th className="py-2.5 px-3 font-semibold">Rank-Biserial r</th>
                    <th className="py-2.5 px-3 font-semibold">Decision (α = 0.05)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cohortResults.h2Rows.map((row) => (
                    <tr key={row.compoundId} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-bold text-slate-900 font-sans">
                        {row.compoundName}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className="font-bold text-slate-900">{row.avgMedian.toFixed(3)}</span>{' '}
                        <span className="text-[10px] text-slate-400">
                          [{row.avgP25.toFixed(3)} to {row.avgP75.toFixed(3)}] {row.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className="font-bold text-purple-900">
                          {row.pregMedian.toFixed(3)}
                        </span>{' '}
                        <span className="text-[10px] text-slate-400">
                          [{row.pregP25.toFixed(3)} to {row.pregP75.toFixed(3)}] {row.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {row.testResult.uStat.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {row.testResult.zScore.toFixed(3)}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`font-bold ${
                            row.testResult.pValue < 0.05 ? 'text-red-700' : 'text-slate-700'
                          }`}
                        >
                          {row.testResult.pValue < 0.001
                            ? '< 0.001'
                            : row.testResult.pValue.toFixed(4)}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {row.testResult.rankBiserialCorrelation.toFixed(3)}
                      </td>
                      <td className="py-3 px-3">
                        {row.testResult.isSignificant ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Reject H₀ (Significant)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200">
                            <AlertCircle className="w-3 h-3" />
                            Fail to Reject H₀
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hypothesis 3 Table: Parameter Sensitivity Analysis (PRCC on Css) */}
          <div className="card-panel p-6 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <h2 className="text-base font-bold text-slate-900 font-heading">
                    Hypothesis 3: Parameter Sensitivity Analysis (PRCC on <MathView math="C_{ss}" />
                    )
                  </h2>
                </div>
                <p className="text-slate-500 text-xs mt-0.5">
                  H₀ 3: No TK parameter has a significant monotonic effect on steady-state serum
                  concentration (<MathView math="C_{ss}" />) (|PRCC| &lt; 0.10 or p &ge; 0.05) vs.
                  H₁ 3: At least one parameter has a significant effect (|PRCC| &ge; 0.10 and p &lt;
                  0.05).
                </p>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Student&apos;s t-test (df = N - k - 1)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                    <th className="py-2.5 px-3 font-semibold">Model Parameter</th>
                    <th className="py-2.5 px-3 font-semibold">Average Cohort PRCC</th>
                    <th className="py-2.5 px-3 font-semibold">Average t-stat (p-val)</th>
                    <th className="py-2.5 px-3 font-semibold">Average Decision</th>
                    <th className="py-2.5 px-3 font-semibold">Pregnant Cohort PRCC</th>
                    <th className="py-2.5 px-3 font-semibold">Pregnant t-stat (p-val)</th>
                    <th className="py-2.5 px-3 font-semibold">Pregnant Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cohortResults.h3Rows.map((row) => (
                    <tr key={row.parameterId} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-bold text-slate-900 font-sans">
                        {row.parameterName}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`font-bold ${
                            row.avgIsSignificant
                              ? row.avgPRCC >= 0
                                ? 'text-teal-700'
                                : 'text-red-700'
                              : 'text-slate-600'
                          }`}
                        >
                          {row.avgPRCC.toFixed(4)}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        t = {row.avgTStat.toFixed(2)}{' '}
                        <span className="text-[10px] text-slate-400">
                          ({row.avgPValue < 0.001 ? 'p < 0.001' : `p = ${row.avgPValue.toFixed(4)}`}
                          )
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {row.avgIsSignificant ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Reject H₀ 3 (Significant)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
                            Fail to Reject H₀ 3
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`font-bold ${
                            row.pregIsSignificant
                              ? row.pregPRCC >= 0
                                ? 'text-teal-700'
                                : 'text-red-700'
                              : 'text-slate-600'
                          }`}
                        >
                          {row.pregPRCC.toFixed(4)}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        t = {row.pregTStat.toFixed(2)}{' '}
                        <span className="text-[10px] text-slate-400">
                          (
                          {row.pregPValue < 0.001
                            ? 'p < 0.001'
                            : `p = ${row.pregPValue.toFixed(4)}`}
                          )
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {row.pregIsSignificant ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Reject H₀ 3 (Significant)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
                            Fail to Reject H₀ 3
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hypothesis 4 Table: Health Risk Level & Population Exceedance */}
          <div className="card-panel p-6 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <h2 className="text-base font-bold text-slate-900 font-heading">
                    Hypothesis 4 & SOP Question 4: Health Risk Level & Population Exceedance (% &gt;
                    1.0)
                  </h2>
                </div>
                <p className="text-slate-500 text-xs mt-0.5">
                  H₀ 4: Median compound HQ and exploratory HQ sum do not exceed 1.0 based on the
                  selected chronic benchmark | One-Sided Wilcoxon Signed-Rank Test (α = 0.05)
                </p>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Threshold: HQ &gt; 1.0 / exploratory HQ sum &gt; 1.0
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                    <th className="py-2.5 px-3 font-semibold">Classification & Chemical</th>
                    <th className="py-2.5 px-3 font-semibold">Reference Benchmark</th>
                    <th className="py-2.5 px-3 font-semibold">Average Median HQ (Mean)</th>
                    <th className="py-2.5 px-3 font-semibold">Average % &gt; 1.0</th>
                    <th className="py-2.5 px-3 font-semibold">Average H₀ 4 Wilcoxon</th>
                    <th className="py-2.5 px-3 font-semibold">Pregnant Median HQ (Mean)</th>
                    <th className="py-2.5 px-3 font-semibold">Pregnant % &gt; 1.0</th>
                    <th className="py-2.5 px-3 font-semibold">Pregnant H₀ 4 Wilcoxon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cohortResults.h4Rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-50/70 ${
                        row.id === 'mixture-hi' ? 'bg-purple-50/30 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-bold text-slate-900 font-sans">
                        <span className="text-slate-500 font-mono text-[10px] mr-1.5">
                          {row.sopId}
                        </span>
                        {row.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                        {row.benchmark}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className="font-bold text-slate-900">
                          {row.avgMedianHQ.toFixed(3)}
                        </span>{' '}
                        <span className="text-[10px] text-slate-400">
                          ({row.avgMeanHQ.toFixed(3)})
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            row.avgExceedancePercent > 5
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {row.avgExceedancePercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {row.avgWilcoxon.isSignificantRisk ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <CheckCircle2 className="w-3 h-3 text-red-600" />
                            Reject H₀ 4 (Risk)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
                            Fail to Reject H₀ 4
                          </span>
                        )}
                        <span className="block text-[9px] text-slate-400 font-mono mt-0.5">
                          {row.avgWilcoxon.pValue < 0.001
                            ? 'p < 0.001'
                            : `p = ${row.avgWilcoxon.pValue.toFixed(4)}`}{' '}
                          (Z={row.avgWilcoxon.zScore.toFixed(2)})
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className="font-bold text-purple-900">
                          {row.pregMedianHQ.toFixed(3)}
                        </span>{' '}
                        <span className="text-[10px] text-slate-400">
                          ({row.pregMeanHQ.toFixed(3)})
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            row.pregExceedancePercent > 5
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {row.pregExceedancePercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {row.pregWilcoxon.isSignificantRisk ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <CheckCircle2 className="w-3 h-3 text-red-600" />
                            Reject H₀ 4 (Risk)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
                            Fail to Reject H₀ 4
                          </span>
                        )}
                        <span className="block text-[9px] text-slate-400 font-mono mt-0.5">
                          {row.pregWilcoxon.pValue < 0.001
                            ? 'p < 0.001'
                            : `p = ${row.pregWilcoxon.pValue.toFixed(4)}`}{' '}
                          (Z={row.pregWilcoxon.zScore.toFixed(2)})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sampling Algorithms Tab */}
      {activeTab === 'sampling' && comparison && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Monte Carlo Stats Card */}
            <div className="card-panel p-5 rounded-xl space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-teal-700" />
                  <h2 className="text-sm font-bold text-slate-900 font-heading">Monte Carlo</h2>
                </div>
                <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 text-[10px] font-semibold border border-teal-200">
                  {comparison.mcRuntimeMs} ms
                </span>
              </div>

              <div className="space-y-2 text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <div>
                    <span className="block">
                      Mean Serum <MathView math="C_{ss}" />
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      Expected central value
                    </span>
                  </div>
                  <span className="text-teal-800 font-bold self-center">
                    {comparison.mcStats.mean.toFixed(4)} µg/L
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <div>
                    <span className="block">
                      Std Dev (<MathView math="\sigma" />)
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans">Spread around mean</span>
                  </div>
                  <span className="text-slate-900 font-bold self-center">
                    {comparison.mcStats.stdDev.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <div>
                    <span className="block">
                      Variance (<MathView math="\sigma^2" />)
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans">Squared dispersion</span>
                  </div>
                  <span className="text-slate-900 font-bold self-center">
                    {comparison.mcStats.variance.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <div>
                    <span className="block">95% Mean CI</span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      Confidence interval
                    </span>
                  </div>
                  <span className="text-slate-900 font-bold self-center">
                    [{comparison.mcStats.ci95Lower.toFixed(3)},{' '}
                    {comparison.mcStats.ci95Upper.toFixed(3)}]
                  </span>
                </div>
              </div>
            </div>

            {/* Latin Hypercube Stats Card */}
            <div className="card-panel p-5 rounded-xl space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-700" />
                  <h2 className="text-sm font-bold text-slate-900 font-heading">Latin Hypercube</h2>
                </div>
                <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 text-[10px] font-semibold border border-purple-200">
                  {comparison.lhsRuntimeMs} ms
                </span>
              </div>

              <div className="space-y-2 text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <div>
                    <span className="block">
                      Mean Serum <MathView math="C_{ss}" />
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      Expected central value
                    </span>
                  </div>
                  <span className="text-purple-800 font-bold self-center">
                    {comparison.lhsStats.mean.toFixed(4)} µg/L
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <div>
                    <span className="block">
                      Std Dev (<MathView math="\sigma" />)
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans">Spread around mean</span>
                  </div>
                  <span className="text-slate-900 font-bold self-center">
                    {comparison.lhsStats.stdDev.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <div>
                    <span className="block">
                      Variance (<MathView math="\sigma^2" />)
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans">Reduced variance</span>
                  </div>
                  <span className="text-slate-900 font-bold self-center">
                    {comparison.lhsStats.variance.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <div>
                    <span className="block">95% Mean CI</span>
                    <span className="text-[10px] text-slate-400 font-sans">Tighter confidence</span>
                  </div>
                  <span className="text-slate-900 font-bold self-center">
                    [{comparison.lhsStats.ci95Lower.toFixed(3)},{' '}
                    {comparison.lhsStats.ci95Upper.toFixed(3)}]
                  </span>
                </div>
              </div>
            </div>

            {/* Hybrid MC + LHS Card */}
            <div className="card-panel p-5 rounded-xl space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <GitMerge className="w-4 h-4 text-blue-700" />
                  <h2 className="text-sm font-bold text-slate-900 font-heading">
                    Monte Carlo + LHS
                  </h2>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-semibold border border-blue-200">
                  {comparison.mcLhsRuntimeMs} ms
                </span>
              </div>

              <div className="space-y-2 text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <div>
                    <span className="block">
                      Mean Serum <MathView math="C_{ss}" />
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      Expected central value
                    </span>
                  </div>
                  <span className="text-blue-800 font-bold self-center">
                    {comparison.mcLhsStats?.mean.toFixed(4)} µg/L
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <div>
                    <span className="block">
                      Std Dev (<MathView math="\sigma" />)
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans">Spread around mean</span>
                  </div>
                  <span className="text-slate-900 font-bold self-center">
                    {comparison.mcLhsStats?.stdDev.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <div>
                    <span className="block">
                      Variance (<MathView math="\sigma^2" />)
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      Balanced dispersion
                    </span>
                  </div>
                  <span className="text-slate-900 font-bold self-center">
                    {comparison.mcLhsStats?.variance.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <div>
                    <span className="block">95% Mean CI</span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      Confidence interval
                    </span>
                  </div>
                  <span className="text-slate-900 font-bold self-center">
                    [{comparison.mcLhsStats?.ci95Lower.toFixed(3)},{' '}
                    {comparison.mcLhsStats?.ci95Upper.toFixed(3)}]
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Running Mean Convergence Chart */}
          <div className="card-panel p-6 sm:p-8 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-slate-900 font-heading">
              Running Mean Convergence across Iterations
            </h2>
            <div className="w-full h-80 pt-2 font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={combinedConvergenceData}
                  margin={{ top: 10, right: 30, left: 10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="iteration"
                    stroke="#64748b"
                    tick={{ fill: '#475569', fontSize: 10 }}
                    interval="preserveStartEnd"
                    minTickGap={25}
                    label={{
                      value: 'Iterations (N)',
                      position: 'bottom',
                      offset: 10,
                      fill: '#0f172a',
                      fontSize: 10,
                    }}
                  />
                  <YAxis
                    width={45}
                    stroke="#64748b"
                    tick={{ fill: '#475569', fontSize: 10 }}
                    label={{
                      value: 'Running Mean Css (µg/L)',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 10,
                      fill: '#0f172a',
                      fontSize: 10,
                    }}
                  />
                  <RechartsTooltip />
                  <Legend
                    verticalAlign="top"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="MonteCarlo"
                    stroke="#0d9488"
                    strokeWidth={2}
                    dot={false}
                    name="Monte Carlo"
                  />
                  <Line
                    type="monotone"
                    dataKey="LatinHypercube"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    dot={false}
                    name="Latin Hypercube (LHS)"
                  />
                  <Line
                    type="monotone"
                    dataKey="MonteCarloLHS"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    name="Monte Carlo + LHS"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
