import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { SummaryStatistics, SensitivityRank, IterationResult, SimulationParameters } from '../../types';
import { PFAS_COMPOUNDS } from '../../simulation/pfasCompounds';
import { calculateExceedanceRangeStats } from '../../simulation/toxicokinetics';
import { Activity, ShieldAlert, TrendingUp, Cpu, Award, AlertTriangle, ShieldCheck, Info, Scale, ChevronRight } from 'lucide-react';
import { MathView } from '../../components/ui/MathView';


interface SummaryPanelProps {
  summaryStats: SummaryStatistics | null;
  sensitivityRanks: SensitivityRank[];
  samplingMethod: string;
  compoundId?: string;
  results?: IterationResult[] | null;
  parameters?: SimulationParameters;
  onOpenExceedanceAnalyzer?: () => void;
}


export const SummaryPanel: React.FC<SummaryPanelProps> = ({
  summaryStats,
  sensitivityRanks,
  samplingMethod,
  compoundId = 'pfoa',
  results,
  parameters,
  onOpenExceedanceAnalyzer,
}) => {
  const activeCompound = useMemo(() => {
    return PFAS_COMPOUNDS.find((c) => c.id === compoundId) || PFAS_COMPOUNDS[0];
  }, [compoundId]);

  const exceedanceStats = useMemo(() => {
    if (!results || results.length === 0 || !parameters) return null;
    const pBw = parameters.bodyWeight.distribution;
    const meanBW = pBw.type === 'fixed' ? pBw.value : (pBw.type === 'normal' || pBw.type === 'lognormal') ? pBw.mean : 55;
    const pBio = parameters.bioavailability.distribution;
    const meanBio = pBio.type === 'fixed' ? pBio.value : (pBio.type === 'normal' || pBio.type === 'lognormal') ? pBio.mean : 0.9;
    const pHalfLife = parameters.eliminationHalfLife.distribution;
    const meanHalfLife = pHalfLife.type === 'fixed' ? pHalfLife.value : (pHalfLife.type === 'normal' || pHalfLife.type === 'lognormal') ? pHalfLife.mean : activeCompound.halfLifeYears;
    return calculateExceedanceRangeStats(results, activeCompound, meanBW, meanBio, meanHalfLife, parameters);
  }, [results, activeCompound, parameters]);

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
            <Link
              to="/guide"
              title="Read scientific guide on Health Risk Assessment & HQ"
              className="text-slate-400 hover:text-blue-600 transition-colors p-0.5"
            >
              <Info className="w-3.5 h-3.5" />
            </Link>
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

      {/* Critical Exceedance Range Card */}
      {exceedanceStats && (
        <div className="card-panel p-4 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-slate-700" />
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Critical Burden &amp; Exceedance
              </span>
            </div>
            {onOpenExceedanceAnalyzer && (
              <button
                onClick={onOpenExceedanceAnalyzer}
                className="flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                <span>Analyzer</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-1.5 text-[11px]">
            {exceedanceStats.detailedAnalysis && (
              <div className="flex justify-between bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="text-slate-600">Avg Body Burden (<MathView math="B(t)" />):</span>
                <span className={`font-bold font-mono ${exceedanceStats.detailedAnalysis.isBurdenExceeded ? 'text-red-700' : 'text-slate-900'}`}>
                  {exceedanceStats.detailedAnalysis.baselineBodyBurden.toFixed(3)} µg
                </span>
              </div>
            )}

            <div className="flex justify-between bg-slate-50 p-1.5 rounded border border-slate-200">
              <span className="text-slate-600">Critical Body Burden Limit:</span>
              <span className="text-slate-900 font-bold font-mono">
                {exceedanceStats.thresholds.criticalBodyBurden.toFixed(3)} µg
              </span>
            </div>

            <div className="flex justify-between bg-slate-50 p-1.5 rounded border border-slate-200">
              <span className="text-slate-600">Critical Intake Cutoff:</span>
              <span className="text-red-700 font-bold font-mono">
                &gt; {exceedanceStats.thresholds.criticalDailyIntake.toFixed(5)} µg/d
              </span>
            </div>

            {exceedanceStats.exceedanceCount > 0 ? (
              <>
                <div className="flex justify-between bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-slate-600">Exceeding Intake Span:</span>
                  <span className="text-slate-900 font-bold font-mono">
                    [{exceedanceStats.exceedingDailyIntake.min.toFixed(4)} – {exceedanceStats.exceedingDailyIntake.max.toFixed(4)}]
                  </span>
                </div>
                <div className="flex justify-between bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-slate-600">Exceeding Serum <MathView math="C_{ss}" />:</span>
                  <span className="text-slate-900 font-bold font-mono">
                    [{exceedanceStats.exceedingSerumCss.min.toFixed(4)} – {exceedanceStats.exceedingSerumCss.max.toFixed(4)}] µg/L
                  </span>
                </div>
              </>
            ) : (
              <div className="text-emerald-700 text-[10px] p-1.5 bg-emerald-50 rounded text-center font-sans">
                No simulated iterations exceeded the safety benchmark.
              </div>
            )}
          </div>
        </div>
      )}



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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-amber-900 uppercase tracking-wider text-[11px]">
                Top Exposure Driver
              </span>
            </div>
            <Link
              to="/guide"
              title="Read scientific guide on Sensitivity Analysis & Spearman Rank"
              className="text-amber-700 hover:text-amber-950 transition-colors p-0.5"
            >
              <Info className="w-3.5 h-3.5" />
            </Link>
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
