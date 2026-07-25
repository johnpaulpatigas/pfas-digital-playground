import React from 'react';
import type { SummaryStatistics, SensitivityRank } from '../../types';
import { Activity, ShieldAlert, TrendingUp, Cpu, Award, AlertTriangle, ShieldCheck } from 'lucide-react';
import { MathView } from '../../components/ui/MathView';

interface SummaryPanelProps {
  summaryStats: SummaryStatistics | null;
  sensitivityRanks: SensitivityRank[];
  samplingMethod: string;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({
  summaryStats,
  sensitivityRanks,
  samplingMethod,
}) => {
  if (!summaryStats) {
    return (
      <div className="card-panel p-6 rounded-xl text-center space-y-3 font-mono text-xs">
        <Cpu className="w-8 h-8 text-slate-400 mx-auto animate-pulse" />
        <p className="text-slate-600 font-semibold">No simulation data generated yet.</p>
        <p className="text-slate-500 text-[11px]">
          Configure parameters on the left sidebar and click &quot;Execute Simulation&quot;.
        </p>
      </div>
    );
  }

  const isHighRisk = summaryStats.riskExceedancePercent > 5;

  const getMethodBadge = () => {
    if (samplingMethod === 'monte-carlo') return 'MONTE CARLO';
    if (samplingMethod === 'latin-hypercube') return 'LATIN HYPERCUBE';
    if (samplingMethod === 'monte-carlo-lhs') return 'MC + LATIN HYPERCUBE';
    return samplingMethod.toUpperCase();
  };

  return (
    <div className="w-full space-y-4 font-mono text-xs">
      {/* Primary KPI Card: Mean Concentration */}
      <div className="card-panel-teal p-4 rounded-xl space-y-1.5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-600 uppercase tracking-wider font-bold">
            Expected Mean Serum (<MathView math="C_{ss}" />)
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold">
            {getMethodBadge()}
          </span>
        </div>
        <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
          {summaryStats.mean.toFixed(4)} <span className="text-sm font-medium text-teal-700">µg/L</span>
        </div>
        <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-0.5">
          <span className="text-teal-800 font-semibold">95% CI:</span>
          <span>[{summaryStats.ci95Lower.toFixed(4)} - {summaryStats.ci95Upper.toFixed(4)}] µg/L</span>
        </div>
      </div>

      {/* Health Risk & Hazard Quotient Card */}
      <div className={`p-4 rounded-xl ${isHighRisk ? 'card-panel-rose' : 'card-panel-accent'} space-y-2`}>
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-1.5">
            {isHighRisk ? (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            )}
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Health Risk Quotient (HQ)
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
            isHighRisk
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            Mean HQ = {summaryStats.meanHazardQuotient.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-700">
          <span>Population Exceeding HQ &gt; 1.0:</span>
          <span className={`font-bold ${isHighRisk ? 'text-red-700' : 'text-blue-700'}`}>
            {summaryStats.riskExceedancePercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Quantiles Risk Table */}
      <div className="card-panel p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-teal-600" />
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Population Quantiles
            </span>
          </div>
          <span className="text-[10px] text-slate-500">N = {summaryStats.count.toLocaleString()}</span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-slate-600">P5 (5th Percentile)</span>
            <span className="text-slate-900 font-bold">{summaryStats.p5.toFixed(4)} µg/L</span>
          </div>
          <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-slate-600">P25 (First Quartile)</span>
            <span className="text-slate-900 font-bold">{summaryStats.p25.toFixed(4)} µg/L</span>
          </div>
          <div className="flex justify-between items-center bg-blue-50/70 p-2 rounded border border-blue-200">
            <span className="text-blue-900 font-semibold">P50 (Median)</span>
            <span className="text-blue-950 font-bold">{summaryStats.median.toFixed(4)} µg/L</span>
          </div>
          <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-slate-600">P75 (Third Quartile)</span>
            <span className="text-slate-900 font-bold">{summaryStats.p75.toFixed(4)} µg/L</span>
          </div>
          <div className="flex justify-between items-center bg-amber-50 p-2 rounded border border-amber-200">
            <span className="text-amber-900 font-semibold">P95 (High Exposure)</span>
            <span className="text-amber-950 font-bold">{summaryStats.p95.toFixed(4)} µg/L</span>
          </div>
          <div className="flex justify-between items-center bg-red-50 p-2 rounded border border-red-200">
            <span className="text-red-900 font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-red-600" />
              P99 (Extreme Tail)
            </span>
            <span className="text-red-950 font-bold">{summaryStats.p99.toFixed(4)} µg/L</span>
          </div>
        </div>
      </div>

      {/* Variance & Deviation Metrics */}
      <div className="card-panel p-4 rounded-xl space-y-2">
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
          <TrendingUp className="w-4 h-4 text-purple-600" />
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            Variance Metrics
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <div className="text-slate-500 text-[10px]">Std Dev (<MathView math="\sigma" />)</div>
            <div className="text-slate-900 font-bold">{summaryStats.stdDev.toFixed(4)}</div>
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <div className="text-slate-500 text-[10px]">Variance (<MathView math="\sigma^2" />)</div>
            <div className="text-slate-900 font-bold">{summaryStats.variance.toFixed(4)}</div>
          </div>
        </div>
      </div>

      {/* Top Sensitivity Driver */}
      {sensitivityRanks.length > 0 && (
        <div className="card-panel-amber p-4 rounded-xl space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-amber-900 uppercase tracking-wider text-[11px]">
              Top Exposure Driver
            </span>
          </div>
          <div className="text-slate-900 font-bold text-xs font-sans">
            {sensitivityRanks[0].parameterName}
          </div>
          <div className="text-slate-600 text-[10px]">
            Spearman Rank (<MathView math="\rho" />): <span className="text-amber-800 font-bold">{sensitivityRanks[0].correlationCoefficient.toFixed(3)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
