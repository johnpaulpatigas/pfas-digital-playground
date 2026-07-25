import React, { useState } from 'react';
import { useSimulationStore } from '../stores/useSimulationStore';
import { runMonteCarloSimulation } from '../simulation/monteCarlo';
import { runLatinHypercubeSimulation } from '../simulation/latinHypercube';
import { runMonteCarloLhsSimulation } from '../simulation/monteCarloLhs';
import { calculateSummaryStatistics } from '../simulation/statistics';
import type { ComparisonResult } from '../types';
import { Button } from '../components/ui/Button';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, Legend } from 'recharts';
import { Layers, Cpu, Play, GitMerge } from 'lucide-react';
import { MathView } from '../components/ui/MathView';

export const ComparePage: React.FC = () => {
  const { parameters } = useSimulationStore();
  const [iterations, setIterations] = useState<number>(3000);
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);

  const runBenchmark = () => {
    setIsBenchmarking(true);

    setTimeout(() => {
      // Benchmark Monte Carlo
      const t0_mc = performance.now();
      const mcResults = runMonteCarloSimulation(parameters, iterations, 42);
      const t1_mc = performance.now();
      const mcStats = calculateSummaryStatistics(mcResults);

      // Benchmark Latin Hypercube
      const t0_lhs = performance.now();
      const lhsResults = runLatinHypercubeSimulation(parameters, iterations, 42);
      const t1_lhs = performance.now();
      const lhsStats = calculateSummaryStatistics(lhsResults);

      // Benchmark Monte Carlo + Latin Hypercube
      const t0_mcLhs = performance.now();
      const mcLhsResults = runMonteCarloLhsSimulation(parameters, iterations, 42);
      const t1_mcLhs = performance.now();
      const mcLhsStats = calculateSummaryStatistics(mcLhsResults);

      // Compute Convergence data over iterations
      const step = Math.max(1, Math.floor(iterations / 100));
      let mcSum = 0;
      let lhsSum = 0;
      let mcLhsSum = 0;
      const mcConvergence = [];
      const lhsConvergence = [];
      const mcLhsConvergence = [];

      for (let i = 0; i < iterations; i++) {
        mcSum += mcResults[i].steadyStateConcentration;
        lhsSum += lhsResults[i].steadyStateConcentration;
        mcLhsSum += mcLhsResults[i].steadyStateConcentration;

        if (i % step === 0 || i === iterations - 1) {
          mcConvergence.push({
            iteration: i + 1,
            runningMean: parseFloat((mcSum / (i + 1)).toFixed(4)),
            runningStd: 0,
          });
          lhsConvergence.push({
            iteration: i + 1,
            runningMean: parseFloat((lhsSum / (i + 1)).toFixed(4)),
            runningStd: 0,
          });
          mcLhsConvergence.push({
            iteration: i + 1,
            runningMean: parseFloat((mcLhsSum / (i + 1)).toFixed(4)),
            runningStd: 0,
          });
        }
      }

      setComparison({
        mcStats,
        lhsStats,
        mcLhsStats,
        mcRuntimeMs: parseFloat((t1_mc - t0_mc).toFixed(2)),
        lhsRuntimeMs: parseFloat((t1_lhs - t0_lhs).toFixed(2)),
        mcLhsRuntimeMs: parseFloat((t1_mcLhs - t0_mcLhs).toFixed(2)),
        mcConvergence,
        lhsConvergence,
        mcLhsConvergence,
      });

      setIsBenchmarking(false);
    }, 50);
  };

  const combinedConvergenceData = comparison
    ? comparison.mcConvergence.map((item, idx) => ({
        iteration: item.iteration,
        MonteCarlo: item.runningMean,
        LatinHypercube: comparison.lhsConvergence[idx]?.runningMean || item.runningMean,
        MonteCarloLHS: comparison.mcLhsConvergence?.[idx]?.runningMean || item.runningMean,
      }))
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title Header */}
      <div className="card-panel p-6 sm:p-8 rounded-2xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-800 text-xs font-mono font-medium">
          <Layers className="w-3.5 h-3.5" />
          <span>Sampling Efficiency &amp; Variance Benchmarking</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 font-heading">
          Monte Carlo vs Latin Hypercube vs Monte Carlo + LHS
        </h1>

        <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">
          Standard <strong>Monte Carlo (MC)</strong> sampling relies on unstratified pseudo-random draws.
          <strong> Latin Hypercube Sampling (LHS)</strong> partitions each parameter distribution into <MathView math="N" /> equal strata.
          The <strong>Monte Carlo + Latin Hypercube (MC + LHS)</strong> hybrid combines pseudo-random stochastic draws with stratified quantile sampling for optimal variance reduction and tail risk precision.
        </p>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-slate-600">Sample Iterations (<MathView math="N" />):</span>
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
            Run 3-Way Benchmark
          </Button>
        </div>
      </div>

      {/* Head to Head Comparison Cards */}
      {comparison && (
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
                  <span>Mean Serum <MathView math="C_{ss}" /></span>
                  <span className="text-teal-800 font-bold">{comparison.mcStats.mean.toFixed(4)} µg/L</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Std Dev (<MathView math="\sigma" />)</span>
                  <span className="text-slate-900 font-bold">{comparison.mcStats.stdDev.toFixed(4)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Variance (<MathView math="\sigma^2" />)</span>
                  <span className="text-slate-900 font-bold">{comparison.mcStats.variance.toFixed(4)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>95% CI</span>
                  <span className="text-slate-900 font-bold">[{comparison.mcStats.ci95Lower.toFixed(3)}, {comparison.mcStats.ci95Upper.toFixed(3)}]</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>High Risk (<MathView math="P_{95}" />)</span>
                  <span className="text-red-700 font-bold">{comparison.mcStats.p95.toFixed(4)} µg/L</span>
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
                  <span>Mean Serum <MathView math="C_{ss}" /></span>
                  <span className="text-purple-800 font-bold">{comparison.lhsStats.mean.toFixed(4)} µg/L</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Std Dev (<MathView math="\sigma" />)</span>
                  <span className="text-slate-900 font-bold">{comparison.lhsStats.stdDev.toFixed(4)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Variance (<MathView math="\sigma^2" />)</span>
                  <span className="text-slate-900 font-bold">{comparison.lhsStats.variance.toFixed(4)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>95% CI</span>
                  <span className="text-slate-900 font-bold">[{comparison.lhsStats.ci95Lower.toFixed(3)}, {comparison.lhsStats.ci95Upper.toFixed(3)}]</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>High Risk (<MathView math="P_{95}" />)</span>
                  <span className="text-red-700 font-bold">{comparison.lhsStats.p95.toFixed(4)} µg/L</span>
                </div>
              </div>
            </div>

            {/* Monte Carlo + LHS Hybrid Card */}
            <div className="card-panel p-5 rounded-xl space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <GitMerge className="w-4 h-4 text-blue-700" />
                  <h2 className="text-sm font-bold text-slate-900 font-heading">Monte Carlo + LHS</h2>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-semibold border border-blue-200">
                  {comparison.mcLhsRuntimeMs || 0} ms
                </span>
              </div>

              {comparison.mcLhsStats && (
                <div className="space-y-2 text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Mean Serum <MathView math="C_{ss}" /></span>
                    <span className="text-blue-800 font-bold">{comparison.mcLhsStats.mean.toFixed(4)} µg/L</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Std Dev (<MathView math="\sigma" />)</span>
                    <span className="text-slate-900 font-bold">{comparison.mcLhsStats.stdDev.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Variance (<MathView math="\sigma^2" />)</span>
                    <span className="text-slate-900 font-bold">{comparison.mcLhsStats.variance.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>95% CI</span>
                    <span className="text-slate-900 font-bold">[{comparison.mcLhsStats.ci95Lower.toFixed(3)}, {comparison.mcLhsStats.ci95Upper.toFixed(3)}]</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>High Risk (<MathView math="P_{95}" />)</span>
                    <span className="text-red-700 font-bold">{comparison.mcLhsStats.p95.toFixed(4)} µg/L</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Combined Convergence Overlay Chart */}
          <div className="card-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">Mean Convergence Comparison</h3>
                <p className="text-xs text-slate-500 font-mono">
                  Comparing stability of running mean across Monte Carlo, Stratified Latin Hypercube, and Monte Carlo + LHS Hybrid
                </p>
              </div>
            </div>

            <div className="w-full h-80 pt-2 font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedConvergenceData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="iteration"
                    stroke="#64748b"
                    tick={{ fill: '#475569', fontSize: 10 }}
                    label={{ value: 'Iterations (N)', position: 'bottom', offset: 5, fill: '#0f172a', fontSize: 11 }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#475569', fontSize: 10 }}
                    label={{ value: 'Running Mean Css (µg/L)', angle: -90, position: 'insideLeft', fill: '#0f172a', fontSize: 11 }}
                  />
                  <RechartsTooltip />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="MonteCarlo" stroke="#0d9488" strokeWidth={2} dot={false} name="Monte Carlo" />
                  <Line type="monotone" dataKey="LatinHypercube" stroke="#7c3aed" strokeWidth={2} dot={false} name="Latin Hypercube (LHS)" />
                  <Line type="monotone" dataKey="MonteCarloLHS" stroke="#2563eb" strokeWidth={2} dot={false} name="Monte Carlo + LHS" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

