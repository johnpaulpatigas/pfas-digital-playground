import React, { useState, useMemo } from 'react';
import { PFAS_COMPOUNDS } from '../../simulation/pfasCompounds';
import {
  calculateCriticalThresholds,
  calculateDetailedCriticalAnalysis,
  calculateExceedanceRangeStats,
} from '../../simulation/toxicokinetics';
import type { IterationResult, SimulationParameters, ParameterCriticalThreshold } from '../../types';
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
import {
  ShieldAlert,
  ShieldCheck,
  Scale,
  Layers,
} from 'lucide-react';

interface ExceedanceAnalyzerProps {
  results: IterationResult[] | null;
  parameters: SimulationParameters;
  compoundId: string;
  samplingMethod?: string;
}

export const ExceedanceAnalyzer: React.FC<ExceedanceAnalyzerProps> = ({
  results,
  parameters,
  compoundId: defaultCompoundId,
  samplingMethod = 'monte-carlo-lhs',
}) => {
  const [selectedCompoundId, setSelectedCompoundId] = useState<string>(defaultCompoundId);
  const compound = PFAS_COMPOUNDS.find((c) => c.id === selectedCompoundId) || PFAS_COMPOUNDS[0];
  const [metricView, setMetricView] = useState<'bodyBurden' | 'serum'>('bodyBurden');

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

  const paramMeanDuration = useMemo(() => {
    const p = parameters.exposureDuration.distribution;
    if (p.type === 'fixed') return p.value;
    if (p.type === 'uniform') return (p.min + p.max) / 2;
    if (p.type === 'normal' || p.type === 'lognormal') return p.mean;
    if (p.type === 'triangular') return (p.min + p.mode + p.max) / 3;
    return 20;
  }, [parameters.exposureDuration]);

  const analyticalThresholds = useMemo(() => {
    return calculateCriticalThresholds(
      compound,
      paramMeanBW,
      paramMeanBioavail,
      paramMeanHalfLife
    );
  }, [compound, paramMeanBW, paramMeanBioavail, paramMeanHalfLife]);

  const criticalAnalysis = useMemo(() => {
    return calculateDetailedCriticalAnalysis(compound, parameters);
  }, [compound, parameters]);

  const exceedanceStats = useMemo(() => {
    if (!results || results.length === 0) return null;
    return calculateExceedanceRangeStats(
      results,
      compound,
      paramMeanBW,
      paramMeanBioavail,
      paramMeanHalfLife,
      parameters
    );
  }, [results, compound, paramMeanBW, paramMeanBioavail, paramMeanHalfLife, parameters]);

  const activeThreshold =
    metricView === 'bodyBurden'
      ? analyticalThresholds.criticalBodyBurden
      : analyticalThresholds.criticalSerumConcentration;

  const { chartData, domainMin, domainMax } = useMemo(() => {
    if (!results || results.length === 0) {
      return { chartData: [], domainMin: 0, domainMax: 1 };
    }

    const rawValues = results.map((r) =>
      metricView === 'bodyBurden' ? r.peakBodyBurden : r.steadyStateConcentration
    );

    const values = rawValues.filter((v) => typeof v === 'number' && Number.isFinite(v));
    if (values.length === 0) {
      return { chartData: [], domainMin: 0, domainMax: 1 };
    }

    let min = values[0];
    let max = values[0];
    for (let i = 1; i < values.length; i++) {
      if (values[i] < min) min = values[i];
      if (values[i] > max) max = values[i];
    }

    const binCount = 40;
    const span = max - min;
    const binWidth = span > 1e-9 ? span / binCount : (min > 0 ? min * 0.05 : 0.01);

    const bins = Array.from({ length: binCount }, (_, i) => {
      const mid = min + (i + 0.5) * binWidth;
      return {
        binMid: parseFloat(mid.toFixed(4)),
        safeCount: 0,
        exceedCount: 0,
      };
    });

    values.forEach((v) => {
      let idx = Math.floor((v - min) / binWidth);
      if (Number.isNaN(idx) || idx < 0) idx = 0;
      if (idx >= binCount) idx = binCount - 1;
      if (bins[idx]) {
        if (v >= activeThreshold) {
          bins[idx].exceedCount++;
        } else {
          bins[idx].safeCount++;
        }
      }
    });

    const total = values.length;
    const data = bins.map((b) => ({
      value: b.binMid,
      safeFrequency: total > 0 ? parseFloat(((b.safeCount / total) * 100).toFixed(2)) : 0,
      exceedFrequency: total > 0 ? parseFloat(((b.exceedCount / total) * 100).toFixed(2)) : 0,
    }));

    const dMin = Math.max(0, Math.min(min, Number.isFinite(activeThreshold) ? activeThreshold * 0.9 : min));
    const dMax = Math.max(max, Number.isFinite(activeThreshold) ? activeThreshold * 1.1 : max);

    return { chartData: data, domainMin: dMin, domainMax: dMax };
  }, [results, metricView, activeThreshold]);

  const isExceeded = criticalAnalysis.isBurdenExceeded;

  return (
    <div className="space-y-5 font-sans text-xs">
      {/* 0. Compound Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 font-mono text-[11px]">
        {PFAS_COMPOUNDS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedCompoundId(c.id)}
            className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer whitespace-nowrap ${
              selectedCompoundId === c.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {c.name.split(' ')[0]} (T1/2 = {c.halfLifeYears}y)
          </button>
        ))}
      </div>

      {/* 1. Executive Toxicokinetic Baseline & Exceedance Summary */}
      <div className="card-panel p-5 rounded-xl space-y-4 bg-white border border-slate-200">
        <div className="border-b border-slate-200 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 font-heading">
                Toxicokinetic Exceedance &amp; Critical Threshold Analysis
              </h2>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-mono font-semibold">
                {compound.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-sans">
              Evaluates whether baseline physiological inputs exceed toxicological reference thresholds (<MathView math="\text{RfD}" />, <MathView math="\text{EPA MCL}" />).
            </p>
          </div>
        </div>

        {/* Status Indicator Banner */}
        <div
          className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isExceeded
              ? 'bg-red-50/60 border-red-200 text-red-950'
              : criticalAnalysis.overallStatus === 'borderline'
              ? 'bg-amber-50/60 border-amber-200 text-amber-950'
              : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                isExceeded
                  ? 'bg-red-100 text-red-700'
                  : criticalAnalysis.overallStatus === 'borderline'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isExceeded ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wide font-mono">
                  {isExceeded
                    ? 'Exceeds Toxicological Reference Threshold'
                    : criticalAnalysis.overallStatus === 'borderline'
                    ? 'Elevated Exposure Level'
                    : 'Within Toxicological Safety Limit'}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border ${
                    isExceeded
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  HQ = {criticalAnalysis.hazardQuotient.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] font-sans text-slate-700">
                {isExceeded
                  ? `Mean internal body burden (${criticalAnalysis.baselineBodyBurden.toFixed(3)} µg) exceeds the critical boundary (${criticalAnalysis.criticalBodyBurden.toFixed(3)} µg) by ${criticalAnalysis.burdenExceedanceRatio.toFixed(2)}×.`
                  : `Mean internal body burden (${criticalAnalysis.baselineBodyBurden.toFixed(3)} µg) remains below the critical boundary (${criticalAnalysis.criticalBodyBurden.toFixed(3)} µg).`}
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4 self-end sm:self-center font-mono text-[11px] shrink-0">
            <div className="text-slate-500 text-[10px]">Equilibrium Progress</div>
            <div className="font-bold text-slate-900">
              {criticalAnalysis.steadyStateFractionAtExposureDuration}% at {paramMeanDuration.toFixed(1)} yr
            </div>
          </div>
        </div>

        {/* 4 Core Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-slate-500 text-[10px]">Simulated Body Burden <MathView math="B(t)" /></div>
            <div className="text-base font-bold text-slate-900 font-mono">
              {criticalAnalysis.baselineBodyBurden.toFixed(3)} <span className="text-xs font-normal text-slate-500">µg</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Css: {criticalAnalysis.currentSerumCss.toFixed(4)} µg/L
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-slate-500 text-[10px]">Critical Threshold <MathView math="B_{\text{crit}}" /></div>
            <div className="text-base font-bold text-slate-900 font-mono">
              {criticalAnalysis.criticalBodyBurden.toFixed(3)} <span className="text-xs font-normal text-slate-500">µg</span>
            </div>
            <div className="text-[10px] text-slate-500 font-sans">
              Boundary where HQ = 1.0
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-slate-500 text-[10px]">Critical Daily Intake <MathView math="I_{\text{crit}}" /></div>
            <div className="text-base font-bold text-slate-900 font-mono">
              {analyticalThresholds.criticalDailyIntake < 0.001
                ? `${(analyticalThresholds.criticalDailyIntake * 1000).toFixed(3)} ng/d`
                : `${analyticalThresholds.criticalDailyIntake.toFixed(5)} µg/d`}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              <MathView math="BW \times \text{RfD}" />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-slate-500 text-[10px]">Cohort Exceedance Rate</div>
            <div
              className={`text-base font-bold font-mono ${
                exceedanceStats && exceedanceStats.exceedancePercent > 5 ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              {exceedanceStats ? `${exceedanceStats.exceedancePercent.toFixed(1)}%` : '—'}
            </div>
            <div className="text-[10px] text-slate-500 font-sans">
              {exceedanceStats ? `${exceedanceStats.exceedanceCount} / ${exceedanceStats.totalCount} samples` : 'Run simulation'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Critical Parameter Threshold Matrix */}
      <div className="card-panel p-5 rounded-xl space-y-3 bg-white border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-slate-900 text-xs font-heading">
              Analytical Parameter Threshold Matrix
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-sans">
            Individual parameter limits calculated using closed-form 1-compartment toxicokinetics
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 bg-slate-50 font-mono">
                <th className="p-2.5 font-semibold">Parameter</th>
                <th className="p-2.5 font-semibold">Current Input</th>
                <th className="p-2.5 font-semibold">Critical Limit (<MathView math="HQ = 1.0" />)</th>
                <th className="p-2.5 font-semibold">Analytical Derivation</th>
                <th className="p-2.5 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {criticalAnalysis.parameterThresholds.map((param: ParameterCriticalThreshold) => {
                return (
                  <tr key={param.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-2.5">
                      <div className="font-semibold text-slate-900">{param.name}</div>
                      <div className="text-[10px] text-slate-500">{param.explanation}</div>
                    </td>
                    <td className="p-2.5 font-mono text-slate-900 font-medium">
                      {param.currentRangeDisplay} <span className="text-slate-500 font-normal">{param.unit}</span>
                    </td>
                    <td className="p-2.5 font-mono font-bold text-slate-900">
                      {param.criticalRangeDisplay}
                    </td>
                    <td className="p-2.5 font-mono text-slate-600">
                      <MathView math={param.formula} />
                    </td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                          param.isExceeded
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : param.status === 'borderline'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {param.isExceeded ? 'Exceeds Limit' : param.status === 'borderline' ? 'Elevated' : 'Within Limit'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Population Distribution & Exceedance Area Plot */}
      <div className="card-panel p-5 rounded-xl space-y-3 bg-white border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
          <div>
            <h3 className="font-bold text-slate-900 text-xs font-heading">
              Population Distribution vs Critical Safety Benchmark
            </h3>
            <p className="text-[11px] text-slate-500 font-sans">
              Area to the right of the reference threshold illustrates the proportion of simulated individuals with <MathView math="HQ > 1.0" />.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-[10px] font-mono">
            <button
              onClick={() => setMetricView('bodyBurden')}
              className={`px-2.5 py-1 rounded font-semibold cursor-pointer transition-colors ${
                metricView === 'bodyBurden' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Body Burden (µg)
            </button>
            <button
              onClick={() => setMetricView('serum')}
              className={`px-2.5 py-1 rounded font-semibold cursor-pointer transition-colors ${
                metricView === 'serum' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Serum Concentration (µg/L)
            </button>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="w-full h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="safeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="exceedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b91c1c" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#b91c1c" stopOpacity={0.05} />
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
                    value: metricView === 'bodyBurden' ? 'Internal Body Burden (µg)' : 'Blood Serum Concentration (µg/L)',
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
                  stroke="#0f766e"
                  strokeWidth={1.5}
                  fill="url(#safeAreaGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="exceedFrequency"
                  name="exceedFrequency"
                  stroke="#b91c1c"
                  strokeWidth={1.5}
                  fill="url(#exceedAreaGrad)"
                />
                <ReferenceLine
                  x={activeThreshold}
                  stroke="#b91c1c"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  label={{
                    value: `Threshold (${activeThreshold.toFixed(3)} ${metricView === 'bodyBurden' ? 'µg' : 'µg/L'})`,
                    fill: '#b91c1c',
                    fontSize: 9,
                    position: 'insideTopRight',
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
            Execute simulation to generate empirical risk distribution.
          </div>
        )}
      </div>

      {/* 4. Cohort Stratification Matrix Table */}
      {exceedanceStats && (
        <div className="card-panel p-5 rounded-xl space-y-3 bg-white border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-700" />
              <h3 className="font-bold text-slate-900 text-xs font-heading">
                Toxicokinetic Population Stratification
              </h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Sampling: {samplingMethod.toUpperCase()} (N = {exceedanceStats.totalCount.toLocaleString()})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 bg-slate-50 font-mono">
                  <th className="p-2.5 font-semibold">Parameter / Output</th>
                  <th className="p-2.5 font-semibold text-emerald-800 bg-emerald-50/50">
                    Safe Cohort (HQ &le; 1.0) [{exceedanceStats.safePercent.toFixed(1)}%]
                  </th>
                  <th className="p-2.5 font-semibold text-red-800 bg-red-50/50">
                    Exceeding Cohort (HQ &gt; 1.0) [{exceedanceStats.exceedancePercent.toFixed(1)}%]
                  </th>
                  <th className="p-2.5 font-semibold text-slate-600">Analytical Safety Threshold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr className="hover:bg-slate-50/50">
                  <td className="p-2.5 font-medium text-slate-600">Daily Intake (µg/day)</td>
                  <td className="p-2.5 font-mono text-emerald-800">
                    {exceedanceStats.safeCount > 0
                      ? `${exceedanceStats.safeDailyIntake.median.toFixed(4)} [${exceedanceStats.safeDailyIntake.min.toFixed(4)} – ${exceedanceStats.safeDailyIntake.max.toFixed(4)}]`
                      : '—'}
                  </td>
                  <td className="p-2.5 font-mono text-red-700 font-bold">
                    {exceedanceStats.exceedanceCount > 0
                      ? `${exceedanceStats.exceedingDailyIntake.median.toFixed(4)} [${exceedanceStats.exceedingDailyIntake.min.toFixed(4)} – ${exceedanceStats.exceedingDailyIntake.max.toFixed(4)}]`
                      : '—'}
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
                      : '—'}
                  </td>
                  <td className="p-2.5 font-mono text-red-700 font-bold">
                    {exceedanceStats.exceedanceCount > 0
                      ? `${exceedanceStats.exceedingPeakBodyBurden.median.toFixed(3)} [${exceedanceStats.exceedingPeakBodyBurden.min.toFixed(3)} – ${exceedanceStats.exceedingPeakBodyBurden.max.toFixed(3)}]`
                      : '—'}
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
                      : '—'}
                  </td>
                  <td className="p-2.5 font-mono text-red-700 font-bold">
                    {exceedanceStats.exceedanceCount > 0
                      ? `${exceedanceStats.exceedingSerumCss.median.toFixed(4)} [${exceedanceStats.exceedingSerumCss.min.toFixed(4)} – ${exceedanceStats.exceedingSerumCss.max.toFixed(4)}]`
                      : '—'}
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
                      : '—'}
                  </td>
                  <td className="p-2.5 font-mono text-red-700 font-bold">
                    {exceedanceStats.exceedanceCount > 0
                      ? `${exceedanceStats.exceedingBodyWeight.median.toFixed(1)} [${exceedanceStats.exceedingBodyWeight.min.toFixed(1)} – ${exceedanceStats.exceedingBodyWeight.max.toFixed(1)}]`
                      : '—'}
                  </td>
                  <td className="p-2.5 text-[10px] text-slate-500 font-sans">
                    Dose scales inversely with body mass
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


