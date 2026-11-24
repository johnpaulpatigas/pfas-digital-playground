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
  const { compoundSummaries: storeCompoundSummaries } = useSimulationStore();

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
      {/* Compound Summaries: Average Css & Body Burden per PFAS */}
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
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-slate-500">Median HQ:</span>
                    <span
                      className={`font-mono font-bold ${
                        (summary.medianHazardQuotient ?? 0) > 1.0
                          ? 'text-red-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {(summary.medianHazardQuotient ?? summary.meanHazardQuotient).toFixed(2)}
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
                    <div className="pt-1 border-t border-slate-100 text-[10px]">
                      <span className="text-slate-500 block">Critical Burden Limit:</span>
                      <span className="text-slate-800 font-semibold font-mono block">
                        {summary.criticalBodyBurden.toFixed(3)} µg
                      </span>
                    </div>
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
        <div className="flex flex-wrap items-center justify-between gap-x-2.5 gap-y-1.5 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-1.5">
            {isHighRisk ? (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
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
                'Hypothesis 4 (H₀ 4): One-sided one-sample Wilcoxon signed-rank test evaluates whether the population median HQ or median HI exceeds 1.0 based on the EPA oral RfD (tested at α = 0.05).',
              ]}
              align="right"
            />
          </div>
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap shrink-0 ${
                isHighRisk
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              Median HQ ={' '}
              {(summaryStats.medianHazardQuotient ?? summaryStats.meanHazardQuotient).toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap shrink-0">
              (Mean {summaryStats.meanHazardQuotient.toFixed(2)})
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-700">
          <span>Target ({compoundId.toUpperCase()}) HQ &gt; 1.0:</span>
          <span
            className={`font-bold font-mono shrink-0 whitespace-nowrap ${isHighRisk ? 'text-red-700' : 'text-blue-700'}`}
          >
            {summaryStats.riskExceedancePercent.toFixed(1)}%
          </span>
        </div>

        {/* H0 4 Wilcoxon Signed-Rank Test Evaluation for Target Compound */}
        {summaryStats.wilcoxonHQ && (
          <div className="pt-1.5 border-t border-slate-200/60 text-[10px] space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 font-medium">H₀ 4 Test (Median HQ ≤ 1.0):</span>
              <span
                className={`font-bold px-1.5 py-0.5 rounded text-[9px] shrink-0 whitespace-nowrap border ${
                  summaryStats.wilcoxonHQ.isSignificantRisk
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {summaryStats.wilcoxonHQ.isSignificantRisk
                  ? 'Reject H₀ 4 (Significant)'
                  : 'Fail to Reject H₀ 4'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
              <span className="whitespace-nowrap">
                Wilcoxon{' '}
                {summaryStats.wilcoxonHQ.pValue < 0.001
                  ? 'p < 0.001'
                  : `p = ${summaryStats.wilcoxonHQ.pValue.toFixed(4)}`}
              </span>
              <span className="whitespace-nowrap">
                Z = {summaryStats.wilcoxonHQ.zScore.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {summaryStats.meanHazardIndex !== undefined && (
          <div className="pt-2 border-t border-slate-200/60 space-y-1">
            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-700">
              <span className="text-slate-600">PFAS Mixture Hazard Index:</span>
              <span className="font-mono font-bold text-slate-800 shrink-0 whitespace-nowrap">
                Median ={' '}
                {(summaryStats.medianHazardIndex ?? summaryStats.meanHazardIndex).toFixed(2)}{' '}
                <span
                  className={`text-[10px] ${(summaryStats.mixtureExceedancePercent || 0) > 5 ? 'text-red-700' : 'text-emerald-700'}`}
                >
                  ({(summaryStats.mixtureExceedancePercent || 0).toFixed(1)}% &gt; 1.0)
                </span>
              </span>
            </div>
            {summaryStats.wilcoxonHI && (
              <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 pt-0.5">
                <span>Mixture HI Test (Median ≤ 1.0):</span>
                <span
                  className={`font-semibold text-[9px] px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap border ${
                    summaryStats.wilcoxonHI.isSignificantRisk
                      ? 'text-red-700 bg-red-50 border-red-200'
                      : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  }`}
                >
                  {summaryStats.wilcoxonHI.isSignificantRisk
                    ? 'Reject H₀ 4'
                    : 'Fail to Reject H₀ 4'}{' '}
                  (
                  {summaryStats.wilcoxonHI.pValue < 0.001
                    ? 'p < 0.001'
                    : `p = ${summaryStats.wilcoxonHI.pValue.toFixed(4)}`}
                  )
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Single Compound Critical Exceedance Range Card */}
      {exceedanceStats && (
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

      {/* Population Quantiles Table */}
      <div className="card-panel p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-teal-600" />
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Population quantiles
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">
              N = {summaryStats.count.toLocaleString()}
            </span>
            <GuidanceTooltip
              title="Population Quantiles and Percentile Exposure"
              summary="Percentiles of steady-state blood serum concentrations across the simulated cohort."
              items={[
                'P5 (5th Percentile): Lower exposure baseline. 95% of simulated individuals have higher serum concentrations.',
                'P25 (First Quartile, Q1): Lower cutoff of the middle 50% of the cohort.',
                'P50 (Median): The middle exposure value. Unlike the mean, it is not pulled upward by a few high-exposure individuals.',
                'P75 (Third Quartile, Q3): Upper cutoff of the middle 50% of the cohort. 25% of individuals have higher concentrations.',
                'P95 (95th Percentile): Common regulatory benchmark used by the US EPA and EFSA for higher-exposure groups, such as heavy water drinkers.',
                'P99 (Extreme Tail): The top 1% of exposure, where multiple risk factors like low body weight and high water intake coincide.',
              ]}
              align="right"
            />
          </div>
        </div>

        <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
          Percentiles of predicted steady-state serum PFAS concentrations (
          <MathView math="C_{ss}" />) across the simulated cohort, showing typical exposure (
          <MathView math="P_{50}" />) and higher-exposure percentiles (
          <MathView math="P_{95}, P_{99}" />
          ).
        </p>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200">
            <div>
              <span className="text-slate-700 font-medium block">P5 (5th Percentile)</span>
              <span className="text-[10px] text-slate-400 font-sans">
                Lower baseline (5% of cohort below)
              </span>
            </div>
            <span className="text-slate-900 font-bold">{summaryStats.p5.toFixed(4)} µg/L</span>
          </div>
          <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200">
            <div>
              <span className="text-slate-700 font-medium block">P25 (First Quartile)</span>
              <span className="text-[10px] text-slate-400 font-sans">25% of cohort below</span>
            </div>
            <span className="text-slate-900 font-bold">{summaryStats.p25.toFixed(4)} µg/L</span>
          </div>
          <div className="flex justify-between items-center bg-blue-50/70 p-2 rounded border border-blue-200">
            <div>
              <span className="text-blue-900 font-semibold block">P50 (Median)</span>
              <span className="text-[10px] text-blue-700/80 font-sans">
                Typical exposure (50% of cohort below)
              </span>
            </div>
            <span className="text-blue-950 font-bold">{summaryStats.median.toFixed(4)} µg/L</span>
          </div>
          <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200">
            <div>
              <span className="text-slate-700 font-medium block">P75 (Third Quartile)</span>
              <span className="text-[10px] text-slate-400 font-sans">75% of cohort below</span>
            </div>
            <span className="text-slate-900 font-bold">{summaryStats.p75.toFixed(4)} µg/L</span>
          </div>
          <div className="flex justify-between items-center bg-amber-50 p-2 rounded border border-amber-200">
            <div>
              <span className="text-amber-900 font-semibold block">P95 (High Exposure)</span>
              <span className="text-[10px] text-amber-700/80 font-sans">Top 5% exposure tier</span>
            </div>
            <span className="text-amber-950 font-bold">{summaryStats.p95.toFixed(4)} µg/L</span>
          </div>
          <div className="flex justify-between items-center bg-red-50 p-2 rounded border border-red-200">
            <div>
              <span className="text-red-900 font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-red-600" />
                P99 (Extreme Tail)
              </span>
              <span className="text-[10px] text-red-700/80 font-sans">Top 1% exposure tier</span>
            </div>
            <span className="text-red-950 font-bold">{summaryStats.p99.toFixed(4)} µg/L</span>
          </div>
        </div>
      </div>

      {/* Variance & Deviation Metrics */}
      <div className="card-panel p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Variance metrics
            </span>
          </div>
          <GuidanceTooltip
            title="Variance and Dispersion Metrics"
            summary="Measures how widely individual serum concentrations spread around the cohort mean."
            items={[
              'Standard Deviation (σ): Average distance of individual serum concentrations from the mean, in µg/L.',
              'Variance (σ²): Squared spread of the values (µg²/L²), showing total variability from differences in physiology and intake.',
              'Coefficient of Variation (CV = σ / μ): Standard deviation as a percentage of the mean, useful for comparing relative spread across compounds.',
              '95% Confidence Interval (CI): The range expected to contain the true population mean 95% of the time.',
            ]}
            align="right"
          />
        </div>

        <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
          Measures how biological differences in water consumption, body weight, and elimination
          rate spread serum levels across the cohort.
        </p>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-0.5">
            <div className="text-slate-500 text-[10px] flex items-center justify-between">
              <span>
                Std Dev (<MathView math="\sigma" />)
              </span>
              <span className="text-[9px] text-slate-400">µg/L</span>
            </div>
            <div className="text-slate-900 font-bold">{summaryStats.stdDev.toFixed(4)}</div>
            <p className="text-[9px] text-slate-400 font-sans leading-tight">Spread around mean</p>
          </div>
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-0.5">
            <div className="text-slate-500 text-[10px] flex items-center justify-between">
              <span>
                Variance (<MathView math="\sigma^2" />)
              </span>
              <span className="text-[9px] text-slate-400">µg²/L²</span>
            </div>
            <div className="text-slate-900 font-bold">{summaryStats.variance.toFixed(4)}</div>
            <p className="text-[9px] text-slate-400 font-sans leading-tight">Squared variance</p>
          </div>
        </div>

        {/* Additional Variance Context: CV & 95% CI */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
          <div className="bg-purple-50/60 p-2 rounded border border-purple-200/80 space-y-0.5">
            <div className="text-purple-800 text-[10px] font-medium">
              Coefficient of Variation (CV)
            </div>
            <div className="text-purple-950 font-bold">
              {summaryStats.mean > 0
                ? `${((summaryStats.stdDev / summaryStats.mean) * 100).toFixed(1)}%`
                : '0.0%'}
            </div>
            <p className="text-[9px] text-purple-700/80 font-sans leading-tight">
              Relative spread (σ / μ)
            </p>
          </div>
          <div className="bg-purple-50/60 p-2 rounded border border-purple-200/80 space-y-0.5">
            <div className="text-purple-800 text-[10px] font-medium">95% Mean CI</div>
            <div className="text-purple-950 font-bold font-mono text-[10px]">
              [{summaryStats.ci95Lower.toFixed(3)}, {summaryStats.ci95Upper.toFixed(3)}]
            </div>
            <p className="text-[9px] text-purple-700/80 font-sans leading-tight">
              Range for cohort mean
            </p>
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
