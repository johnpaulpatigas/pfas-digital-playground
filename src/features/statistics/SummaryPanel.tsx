import {
  Activity,
  AlertTriangle,
  Award,
  Cpu,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { GuidanceTooltip } from '../../components/ui/GuidanceTooltip';
import { MathView } from '../../components/ui/MathView';
import { getDistributionMean } from '../../simulation/distributions';
import { PFAS_COMPOUNDS } from '../../simulation/pfasCompounds';
import {
  calculateCompoundSummaries,
  calculateExceedanceRangeStats,
} from '../../simulation/toxicokinetics';
import { useSimulationStore } from '../../stores/useSimulationStore';
import type {
  IterationResult,
  SensitivityRank,
  SimulationParameters,
  SummaryStatistics,
} from '../../types';

interface SummaryPanelProps {
  summaryStats: SummaryStatistics | null;
  sensitivityRanks: SensitivityRank[];
  samplingMethod?: string;
  compoundId?: string;
  results?: IterationResult[] | null;
  parameters?: SimulationParameters;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({
  summaryStats,
  sensitivityRanks,
  compoundId = 'pfoa',
  results,
  parameters,
}) => {
  const { mode, compoundSummaries: storeCompoundSummaries } = useSimulationStore();
  const isSimpleMode = mode === 'simple';

  const activeCompound = useMemo(() => {
    return PFAS_COMPOUNDS.find((c) => c.id === compoundId) || PFAS_COMPOUNDS[0];
  }, [compoundId]);

  const multiCompoundSummaries = useMemo(() => {
    if (storeCompoundSummaries && storeCompoundSummaries.length > 0) {
      return storeCompoundSummaries;
    }
    if (results && results.length > 0 && parameters) {
      return calculateCompoundSummaries(results, parameters);
    }
    return [];
  }, [storeCompoundSummaries, results, parameters]);

  const exceedanceStats = useMemo(() => {
    if (!results || results.length === 0 || !parameters) return null;
    const meanBW = getDistributionMean(parameters.bodyWeight.distribution, 55);
    const meanBio = getDistributionMean(parameters.bioavailability.distribution, 0.9);
    const meanHalfLife = getDistributionMean(
      parameters.eliminationHalfLife.distribution,
      activeCompound.halfLifeYears,
    );
    return calculateExceedanceRangeStats(
      results,
      activeCompound,
      meanBW,
      meanBio,
      meanHalfLife,
      parameters,
    );
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

  return (
    <div className="w-full space-y-4 font-mono text-xs">
      {/* Compound Summaries: Average Css & Body Burden per PFAS (Simple & Advanced) */}
      {multiCompoundSummaries.length > 0 && (
        <div className="card-panel p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-slate-700" />
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Average <MathView math="C_{ss}" /> and body burden per PFAS
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {multiCompoundSummaries.map((summary) => (
              <div
                key={summary.compoundId}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-[11px] space-y-2"
              >
                {/* Compound Header */}
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="font-bold text-slate-900 font-sans"
                      title={summary.compoundName}
                    >
                      {summary.compoundName.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      (T1/2 = {summary.halfLifeYears} yrs)
                    </span>
                  </div>
                </div>

                {/* 2-Column Side-by-Side: Average Css beside Average Body Burden */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  {/* Left Column: Average Css */}
                  <div className="space-y-1 bg-white/70 p-2 rounded border border-slate-200/70">
                    <div className="text-[10px] text-slate-500">
                      Average Serum <MathView math="C_{ss}" />:
                    </div>
                    <div className="font-bold text-blue-900 font-mono text-xs">
                      {summary.meanCss.toFixed(4)}{' '}
                      <span className="text-[10px] text-slate-500 font-normal">µg/L</span>
                    </div>
                    {!isSimpleMode && (
                      <div className="pt-1 border-t border-slate-100 text-[10px]">
                        <span className="text-slate-500 block">
                          Exceeding Serum <MathView math="C_{ss}" />:
                        </span>
                        <span
                          className={`font-semibold font-mono break-words leading-tight block ${summary.exceedingSerumMax > 0 ? 'text-red-700' : 'text-emerald-700'}`}
                        >
                          {summary.exceedingSerumMax > 0
                            ? `[${summary.exceedingSerumMin.toFixed(4)} to ${summary.exceedingSerumMax.toFixed(4)}] µg/L`
                            : 'None'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Average Body Burden */}
                  <div className="space-y-1 bg-white/70 p-2 rounded border border-slate-200/70">
                    <div className="text-[10px] text-slate-500">
                      Average Body Burden <MathView math="B(t)" />:
                    </div>
                    <div className="font-bold font-mono text-xs text-slate-900">
                      {summary.meanBodyBurden.toFixed(3)}{' '}
                      <span className="text-[10px] text-slate-500 font-normal">µg</span>
                    </div>
                    {!isSimpleMode && (
                      <div className="pt-1 border-t border-slate-100 text-[10px]">
                        <span className="text-slate-500 block">Critical Burden Limit:</span>
                        <span className="text-slate-800 font-semibold font-mono block">
                          {summary.criticalBodyBurden.toFixed(3)} µg
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Risk & Hazard Quotient Card */}
      <div
        className={`p-4 rounded-xl ${isHighRisk ? 'card-panel-rose' : 'card-panel-accent'} space-y-2`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-1.5">
            {isHighRisk ? (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            )}
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Health risk quotient (HQ)
            </span>
            <GuidanceTooltip
              title="Health Risk Quotient (HQ) & Mixture Risk"
              summary="Toxicological comparison of simulated daily intake against EPA reference doses."
              items={[
                'Hazard Quotient (HQ): Ratio of daily intake to the compound Reference Dose (RfD). HQ ≤ 1.0 is within benchmark limits; HQ > 1.0 indicates the RfD is exceeded.',
                'Target HQ > 1.0 %: Percentage of simulated iterations where daily intake per kg body weight exceeds the RfD for this compound.',
                'Mixture Hazard Index (HI): Sum of Hazard Quotients across all 5 PFAS compounds (∑ HQ_i). HI > 1.0 indicates combined exposure exceeds the cumulative threshold even if individual compounds are below 1.0.',
              ]}
              align="right"
            />
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              isHighRisk
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            Mean HQ = {summaryStats.meanHazardQuotient.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-700">
          <span>Target ({compoundId.toUpperCase()}) HQ &gt; 1.0:</span>
          <span className={`font-bold ${isHighRisk ? 'text-red-700' : 'text-blue-700'}`}>
            {summaryStats.riskExceedancePercent.toFixed(1)}%
          </span>
        </div>

        {summaryStats.meanHazardIndex !== undefined && (
          <div className="flex items-center justify-between text-[11px] text-slate-700 pt-1.5 border-t border-slate-200/60">
            <span className="text-slate-600">PFAS Mixture Hazard Index (HI):</span>
            <span className="font-mono font-bold text-slate-800">
              Mean HI = {summaryStats.meanHazardIndex.toFixed(2)}{' '}
              <span
                className={`text-[10px] ${(summaryStats.mixtureExceedancePercent || 0) > 5 ? 'text-red-700' : 'text-emerald-700'}`}
              >
                ({(summaryStats.mixtureExceedancePercent || 0).toFixed(1)}% &gt; 1.0)
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Advanced Mode: Single Compound Critical Exceedance Range Card */}
      {!isSimpleMode && exceedanceStats && (
        <div className="card-panel p-4 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-slate-700" />
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Critical burden and exceedance ({activeCompound.name.split(' ')[0]})
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-[11px]">
            {exceedanceStats.detailedAnalysis && (
              <div className="flex justify-between bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="text-slate-600">
                  Avg Body Burden (<MathView math="B(t)" />
                  ):
                </span>
                <span
                  className={`font-bold font-mono ${exceedanceStats.detailedAnalysis.isBurdenExceeded ? 'text-red-700' : 'text-slate-900'}`}
                >
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
                    [{exceedanceStats.exceedingDailyIntake.min.toFixed(4)} to{' '}
                    {exceedanceStats.exceedingDailyIntake.max.toFixed(4)}]
                  </span>
                </div>
                <div className="flex justify-between bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-slate-600">
                    Exceeding Serum <MathView math="C_{ss}" />:
                  </span>
                  <span className="text-slate-900 font-bold font-mono">
                    [{exceedanceStats.exceedingSerumCss.min.toFixed(4)} to{' '}
                    {exceedanceStats.exceedingSerumCss.max.toFixed(4)}] µg/L
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

      {/* Population Quantiles Table (Advanced Mode Only) */}
      {!isSimpleMode && (
        <div className="card-panel p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-600" />
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Population quantiles
              </span>
            </div>
            <span className="text-[10px] text-slate-500">
              N = {summaryStats.count.toLocaleString()}
            </span>
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
      )}

      {/* Variance & Deviation Metrics (Advanced Mode Only) */}
      {!isSimpleMode && (
        <div className="card-panel p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Variance metrics
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <div className="text-slate-500 text-[10px]">
                Std Dev (<MathView math="\sigma" />)
              </div>
              <div className="text-slate-900 font-bold">{summaryStats.stdDev.toFixed(4)}</div>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <div className="text-slate-500 text-[10px]">
                Variance (<MathView math="\sigma^2" />)
              </div>
              <div className="text-slate-900 font-bold">{summaryStats.variance.toFixed(4)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Sensitivity Driver */}
      {sensitivityRanks.length > 0 && (
        <div className="card-panel-amber p-4 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-amber-900 uppercase tracking-wider text-[11px]">
                Top exposure driver
              </span>
            </div>
            <GuidanceTooltip
              title="Top Exposure Driver & Sensitivity Ranking"
              summary="Spearman rank correlation measures which input variables drive variance in steady-state serum concentration."
              items={[
                'Top Parameter: The input variable with the strongest correlation to predicted steady-state serum concentration.',
                'Spearman Rank (ρ): Values near +1.0 indicate positive drivers (e.g. higher water intake increases serum concentration); values near -1.0 indicate inverse relationships (e.g. higher body weight dilutes dose across volume).',
                'Application: Shows which parameter change produces the largest reduction in serum concentration.',
              ]}
              align="right"
            />
          </div>
          <div className="text-slate-900 font-bold text-xs font-sans">
            {sensitivityRanks[0].parameterName}
          </div>
          <div className="text-slate-600 text-[10px]">
            Spearman Rank (<MathView math="\rho" />
            ):{' '}
            <span className="text-amber-800 font-bold">
              {sensitivityRanks[0].correlationCoefficient.toFixed(3)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
