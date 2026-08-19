import React, { useState, useMemo } from 'react';
import { PFAS_COMPOUNDS } from '../../simulation/pfasCompounds';
import { calculateCriticalThresholds, calculateExceedanceRangeStats } from '../../simulation/toxicokinetics';
import type { IterationResult, SimulationParameters } from '../../types';
import { MathView } from '../../components/ui/MathView';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

interface ExceedanceAnalyzerProps {
  results: IterationResult[] | null;
  parameters: SimulationParameters;
  compoundId: string;
  samplingMethod?: string;
}

export const ExceedanceAnalyzer: React.FC<ExceedanceAnalyzerProps> = ({
  results,
  parameters,
  compoundId,
  samplingMethod = 'monte-carlo',
}) => {
  const compound = PFAS_COMPOUNDS.find((c) => c.id === compoundId) || PFAS_COMPOUNDS[0];
  const [metricView, setMetricView] = useState<'bodyBurden' | 'serum'>('bodyBurden');

  // Baseline parameter means extracted from active simulation configuration
  const paramMeanBW = useMemo(() => {
    const p = parameters.bodyWeight.distribution;
    if (p.type === 'fixed') return p.value;
    if (p.type === 'uniform') return (p.min + p.max) / 2;
    if (p.type === 'normal' || p.type === 'lognormal') return p.mean;
    if (p.type === 'triangular') return (p.min + p.mode + p.max) / 3;
    return 55;
  }, [parameters.bodyWeight]);

  const paramMeanBioavail = useMemo(() => {
    const p = parameters.bioavailability.distribution;
    if (p.type === 'fixed') return p.value;
    if (p.type === 'uniform') return (p.min + p.max) / 2;
    if (p.type === 'normal' || p.type === 'lognormal') return p.mean;
    if (p.type === 'triangular') return (p.min + p.mode + p.max) / 3;
    return 0.9;
  }, [parameters.bioavailability]);

  const paramMeanHalfLife = useMemo(() => {
    const p = parameters.eliminationHalfLife.distribution;
    if (p.type === 'fixed') return p.value;
    if (p.type === 'uniform') return (p.min + p.max) / 2;
    if (p.type === 'normal' || p.type === 'lognormal') return p.mean;
    if (p.type === 'triangular') return (p.min + p.mode + p.max) / 3;
    return compound.halfLifeYears;
  }, [parameters.eliminationHalfLife, compound.halfLifeYears]);

  // Exact closed-form analytical thresholds
  const analyticalThresholds = useMemo(() => {
    return calculateCriticalThresholds(compound, paramMeanBW, paramMeanBioavail, paramMeanHalfLife);
  }, [compound, paramMeanBW, paramMeanBioavail, paramMeanHalfLife]);

  // Empirical simulation cohort exceedance breakdown
  const exceedanceStats = useMemo(() => {
    if (!results || results.length === 0) return null;
    return calculateExceedanceRangeStats(
      results,
      compound,
      paramMeanBW,
      paramMeanBioavail,
      paramMeanHalfLife
    );
  }, [results, compound, paramMeanBW, paramMeanBioavail, paramMeanHalfLife]);

  const activeThreshold =
    metricView === 'bodyBurden'
      ? analyticalThresholds.criticalBodyBurden
      : analyticalThresholds.criticalSerumConcentration;

  // Distribution chart data with continuous numerical domain
  const { chartData, domainMin, domainMax } = useMemo(() => {
    if (!results || results.length === 0) {
      return { chartData: [], domainMin: 0, domainMax: 1 };
    }

    const values = results.map((r) =>
      metricView === 'bodyBurden' ? r.peakBodyBurden : r.steadyStateConcentration
    );

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = 40;
    const binWidth = (max - min) / binCount || 0.001;

    const bins = new Array(binCount).fill(0).map((_, i) => {
      const mid = min + (i + 0.5) * binWidth;
      return {
        binMid: parseFloat(mid.toFixed(4)),
        safeCount: 0,
        exceedCount: 0,
      };
    });

    values.forEach((v) => {
      let idx = Math.floor((v - min) / binWidth);
      if (idx >= binCount) idx = binCount - 1;
      if (idx < 0) idx = 0;
      if (v >= activeThreshold) {
        bins[idx].exceedCount++;
      } else {
        bins[idx].safeCount++;
      }
    });

    const total = values.length;
    const data = bins.map((b) => ({
      value: b.binMid,
      safeFrequency: parseFloat(((b.safeCount / total) * 100).toFixed(2)),
      exceedFrequency: parseFloat(((b.exceedCount / total) * 100).toFixed(2)),
    }));

    const dMin = Math.max(0, Math.min(min, activeThreshold * 0.9));
    const dMax = Math.max(max, activeThreshold * 1.1);

    return { chartData: data, domainMin: dMin, domainMax: dMax };
  }, [results, metricView, activeThreshold]);

  return (
    <div className="space-y-6 font-mono text-xs select-none">
      {/* Header & Toxicological Benchmarks */}
      <div className="card-panel p-5 rounded-xl space-y-3 bg-white border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 font-heading">
                Toxicokinetic Exceedance &amp; Safety Threshold Analysis
              </h2>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold">
                {compound.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              1-Compartment pharmacokinetic risk evaluation based on Reference Dose (<MathView math="\text{RfD}" />) and Maximum Contaminant Levels (<MathView math="\text{MCL}" />).
            </p>
          </div>
          <div className="text-right self-start sm:self-auto font-sans text-[11px] text-slate-500">
            <div>CAS: <span className="font-mono text-slate-800 font-semibold">{compound.casNumber}</span></div>
            <div>RfD: <span className="font-mono text-slate-800 font-semibold">{compound.rfdDose.toExponential(2)} µg/kg/day</span></div>
          </div>
        </div>

        {/* 4 Primary Toxicological Metric Cards */}
        {exceedanceStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[10px]">Population Exceedance Rate</div>
              <div className={`text-lg font-bold font-heading ${exceedanceStats.exceedancePercent > 5 ? 'text-red-700' : 'text-emerald-700'}`}>
                {exceedanceStats.exceedancePercent.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-500 font-sans">
                {exceedanceStats.exceedanceCount.toLocaleString()} of {exceedanceStats.totalCount.toLocaleString()} (<MathView math="HQ > 1.0" />)
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[10px]">Critical Daily Intake (<MathView math="I_{\text{crit}}" />)</div>
              <div className="text-lg font-bold text-slate-900 font-heading">
                {analyticalThresholds.criticalDailyIntake < 0.001
                  ? `${(analyticalThresholds.criticalDailyIntake * 1000).toFixed(3)} ng/d`
                  : `${analyticalThresholds.criticalDailyIntake.toFixed(5)} µg/d`}
              </div>
              <div className="text-[10px] text-slate-500 font-sans">
                <MathView math="I_{\text{crit}} = BW \times \text{RfD}" />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[10px]">Critical Body Burden (<MathView math="B_{\text{crit}}" />)</div>
              <div className="text-lg font-bold text-slate-900 font-heading">
                {analyticalThresholds.criticalBodyBurden.toFixed(3)} <span className="text-xs font-normal text-slate-500">µg</span>
              </div>
              <div className="text-[10px] text-slate-500 font-sans">
                Equilibrium capacity
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[10px]">Critical Serum (<MathView math="C_{\text{ss, crit}}" />)</div>
              <div className="text-lg font-bold text-slate-900 font-heading">
                {analyticalThresholds.criticalSerumConcentration.toFixed(4)} <span className="text-xs font-normal text-slate-500">µg/L</span>
              </div>
              <div className="text-[10px] text-slate-500 font-sans">
                EPA MCL: {(compound.epaMCL / 1000).toFixed(4)} µg/L
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Population Distribution & Exceedance Area Plot */}
      <div className="card-panel p-5 rounded-xl space-y-3 bg-white border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
          <div>
            <h3 className="font-bold text-slate-900 text-xs font-heading">
              Population Risk Distribution &amp; Threshold Reference Cutoff
            </h3>
            <p className="text-[10px] text-slate-500 font-sans">
              Shaded red area indicates the proportion of the population exceeding the critical safety limit.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200 text-[10px]">
            <button
              onClick={() => setMetricView('bodyBurden')}
              className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-colors ${
                metricView === 'bodyBurden' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Body Burden (µg)
            </button>
            <button
              onClick={() => setMetricView('serum')}
              className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-colors ${
                metricView === 'serum' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Serum Css (µg/L)
            </button>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="w-full h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="safeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="exceedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="value"
                  domain={[domainMin, domainMax]}
                  stroke="#64748b"
                  tick={{ fill: '#475569', fontSize: 10 }}
                  tickFormatter={(val: number) => val.toFixed(3)}
                  minTickGap={25}
                  label={{
                    value: metricView === 'bodyBurden' ? 'Peak Body Burden (µg)' : 'Blood Serum Concentration (µg/L)',
                    position: 'bottom',
                    offset: 8,
                    fill: '#0f172a',
                    fontSize: 10,
                  }}
                />
                <YAxis
                  width={40}
                  stroke="#64748b"
                  tick={{ fill: '#475569', fontSize: 10 }}
                  label={{ value: 'Frequency (%)', angle: -90, position: 'insideLeft', offset: 10, fill: '#0f172a', fontSize: 10 }}
                />
                <RechartsTooltip
                  formatter={(val: unknown, name: unknown) => [
                    `${parseFloat(String(val ?? 0)).toFixed(2)}%`,
                    name === 'safeFrequency' ? 'Safe Fraction' : 'Exceedance Fraction',
                  ]}
                  labelFormatter={(lbl: unknown) =>
                    `${metricView === 'bodyBurden' ? 'Burden' : 'Serum'}: ${parseFloat(String(lbl ?? 0)).toFixed(4)} ${metricView === 'bodyBurden' ? 'µg' : 'µg/L'}`
                  }
                />
                <Area
                  type="monotone"
                  dataKey="safeFrequency"
                  name="safeFrequency"
                  stroke="#0d9488"
                  strokeWidth={1.5}
                  fill="url(#safeAreaGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="exceedFrequency"
                  name="exceedFrequency"
                  stroke="#dc2626"
                  strokeWidth={2}
                  fill="url(#exceedAreaGrad)"
                />
                <ReferenceLine
                  x={activeThreshold}
                  stroke="#dc2626"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  label={{
                    value: `Threshold (${activeThreshold.toFixed(3)} ${metricView === 'bodyBurden' ? 'µg' : 'µg/L'})`,
                    fill: '#dc2626',
                    fontSize: 9,
                    position: 'insideTopRight',
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
            Run simulation to generate empirical risk distribution.
          </div>
        )}
      </div>

      {/* Cohort Stratification Table */}
      {exceedanceStats && (
        <div className="card-panel p-5 rounded-xl space-y-3 bg-white border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-bold text-slate-900 text-xs font-heading">
              Population Toxicokinetic Stratification Matrix
            </h3>
            <span className="text-[10px] text-slate-500 font-sans">
              Sampling: {samplingMethod.toUpperCase()} (N = {exceedanceStats.totalCount.toLocaleString()})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-700 bg-slate-50">
                  <th className="p-2.5 font-semibold">Parameter / Output</th>
                  <th className="p-2.5 font-semibold text-emerald-800 bg-emerald-50/50">
                    Safe Cohort (HQ &le; 1.0) [{exceedanceStats.safePercent.toFixed(1)}%]
                  </th>
                  <th className="p-2.5 font-semibold text-red-800 bg-red-50/50">
                    Exceeding Cohort (HQ &gt; 1.0) [{exceedanceStats.exceedancePercent.toFixed(1)}%]
                  </th>
                  <th className="p-2.5 font-semibold text-slate-700">Analytical Safety Threshold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr className="hover:bg-slate-50/50">
                  <td className="p-2.5 font-medium text-slate-600">Daily Intake (µg/day)</td>
                  <td className="p-2.5 font-mono text-emerald-800">
                    {exceedanceStats.safeCount > 0
                      ? `${exceedanceStats.safeDailyIntake.median.toFixed(4)} [${exceedanceStats.safeDailyIntake.min.toFixed(4)} – ${exceedanceStats.safeDailyIntake.max.toFixed(4)}]`
                      : '— (0 in cohort)'}
                  </td>
                  <td className="p-2.5 font-mono text-red-700 font-bold">
                    {exceedanceStats.exceedanceCount > 0
                      ? `${exceedanceStats.exceedingDailyIntake.median.toFixed(4)} [${exceedanceStats.exceedingDailyIntake.min.toFixed(4)} – ${exceedanceStats.exceedingDailyIntake.max.toFixed(4)}]`
                      : '— (0 in cohort)'}
                  </td>
                  <td className="p-2.5 font-mono text-slate-600">
                    &gt; {analyticalThresholds.criticalDailyIntake.toFixed(5)} µg/day
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-2.5 font-medium text-slate-600">Peak Body Burden (µg)</td>
                  <td className="p-2.5 font-mono text-emerald-800">
                    {exceedanceStats.safeCount > 0
                      ? `${exceedanceStats.safePeakBodyBurden.median.toFixed(3)} [${exceedanceStats.safePeakBodyBurden.min.toFixed(3)} – ${exceedanceStats.safePeakBodyBurden.max.toFixed(3)}]`
                      : '— (0 in cohort)'}
                  </td>
                  <td className="p-2.5 font-mono text-red-700 font-bold">
                    {exceedanceStats.exceedanceCount > 0
                      ? `${exceedanceStats.exceedingPeakBodyBurden.median.toFixed(3)} [${exceedanceStats.exceedingPeakBodyBurden.min.toFixed(3)} – ${exceedanceStats.exceedingPeakBodyBurden.max.toFixed(3)}]`
                      : '— (0 in cohort)'}
                  </td>
                  <td className="p-2.5 font-mono text-slate-600">
                    &gt; {analyticalThresholds.criticalBodyBurden.toFixed(3)} µg
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-2.5 font-medium text-slate-600">Steady-State Serum <MathView math="C_{ss}" /> (µg/L)</td>
                  <td className="p-2.5 font-mono text-emerald-800">
                    {exceedanceStats.safeCount > 0
                      ? `${exceedanceStats.safeSerumCss.median.toFixed(4)} [${exceedanceStats.safeSerumCss.min.toFixed(4)} – ${exceedanceStats.safeSerumCss.max.toFixed(4)}]`
                      : '— (0 in cohort)'}
                  </td>
                  <td className="p-2.5 font-mono text-red-700 font-bold">
                    {exceedanceStats.exceedanceCount > 0
                      ? `${exceedanceStats.exceedingSerumCss.median.toFixed(4)} [${exceedanceStats.exceedingSerumCss.min.toFixed(4)} – ${exceedanceStats.exceedingSerumCss.max.toFixed(4)}]`
                      : '— (0 in cohort)'}
                  </td>
                  <td className="p-2.5 font-mono text-slate-600">
                    &gt; {analyticalThresholds.criticalSerumConcentration.toFixed(4)} µg/L
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-2.5 font-medium text-slate-600">Body Weight (kg)</td>
                  <td className="p-2.5 font-mono text-emerald-800">
                    {exceedanceStats.safeCount > 0
                      ? `${exceedanceStats.safeBodyWeight.median.toFixed(1)} [${exceedanceStats.safeBodyWeight.min.toFixed(1)} – ${exceedanceStats.safeBodyWeight.max.toFixed(1)}]`
                      : '— (0 in cohort)'}
                  </td>
                  <td className="p-2.5 font-mono text-red-700 font-bold">
                    {exceedanceStats.exceedanceCount > 0
                      ? `${exceedanceStats.exceedingBodyWeight.median.toFixed(1)} [${exceedanceStats.exceedingBodyWeight.min.toFixed(1)} – ${exceedanceStats.exceedingBodyWeight.max.toFixed(1)}]`
                      : '— (0 in cohort)'}
                  </td>
                  <td className="p-2.5 text-[10px] text-slate-500 font-sans">
                    Dose scaling inverse to mass
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
