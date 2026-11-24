import { BookOpen, Cpu, GitMerge, Layers, Play, RefreshCw, Users } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { MathView } from '../../components/ui/MathView';
import { Tooltip } from '../../components/ui/Tooltip';
import { PARAMETER_KEYS } from '../../simulation/parameters';
import { PFAS_COMPOUNDS } from '../../simulation/pfasCompounds';
import { calculateDetailedCriticalAnalysis } from '../../simulation/toxicokinetics';
import { useSimulationStore } from '../../stores/useSimulationStore';
import type { DistributionParams, DistributionType, ParameterCriticalThreshold } from '../../types';
import { DEMOGRAPHIC_PRESETS } from '../scenarios/presets';
import { DistributionSelector } from './DistributionSelector';

interface ParameterSidebarProps {
  onRunSimulation: () => void;
  onOpenGuide?: () => void;
}

export const ParameterSidebar: React.FC<ParameterSidebarProps> = ({
  onRunSimulation,
  onOpenGuide,
}) => {
  const {
    parameters,
    samplingConfig,
    activeScenarioId,
    isSimulating,
    setParameterDistribution,
    updateParameterValue,
    setSamplingConfig,
    setCompoundId,
    loadScenario,
    resetToDefault,
  } = useSimulationStore();

  const activeCompound =
    PFAS_COMPOUNDS.find((c) => c.id === samplingConfig.compoundId) || PFAS_COMPOUNDS[0];

  const criticalAnalysis = useMemo(() => {
    return calculateDetailedCriticalAnalysis(activeCompound, parameters);
  }, [activeCompound, parameters]);

  const getMethodName = () => {
    switch (samplingConfig.method) {
      case 'monte-carlo':
        return 'Monte Carlo';
      case 'latin-hypercube':
        return 'Latin Hypercube';
      case 'monte-carlo-lhs':
        return 'MC + LHS';
    }
  };

  const createDefaultDistribution = (type: DistributionType): DistributionParams => {
    switch (type) {
      case 'fixed':
        return { type: 'fixed', value: 1.0 };
      case 'uniform':
        return { type: 'uniform', min: 0.5, max: 2.0 };
      case 'normal':
        return { type: 'normal', mean: 1.0, sd: 0.2 };
      case 'lognormal':
        return { type: 'lognormal', mean: 1.0, sd: 0.3 };
      case 'triangular':
        return { type: 'triangular', min: 0.5, mode: 1.0, max: 2.0 };
    }
  };

  return (
    <div className="w-full space-y-4 text-xs font-sans">
      {/* Demographic Presets & Reset Toolbar */}
      <div className="space-y-1.5 px-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-bold text-slate-700 uppercase font-mono tracking-wider text-[11px]">
              Demographic Presets
            </span>
          </div>
          <button
            type="button"
            onClick={resetToDefault}
            className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="Reset to Baseline Defaults"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
          {DEMOGRAPHIC_PRESETS.map((preset) => {
            const isActive = activeScenarioId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => loadScenario(preset.id)}
                className={`px-2 py-1 rounded text-[11px] font-mono whitespace-nowrap transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title={preset.description}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chemical Compound Selection */}
      <div className="card-panel p-3 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-700 uppercase font-mono tracking-wider text-[11px]">
            PFAS Chemical
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold border border-blue-200">
            EPA MCL: {activeCompound.epaMCL} ng/L
          </span>
        </div>

        <select
          value={samplingConfig.compoundId}
          onChange={(e) => setCompoundId(e.target.value)}
          className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2 text-xs font-mono font-bold focus:outline-none focus:border-slate-900"
        >
          {PFAS_COMPOUNDS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.id.toUpperCase()}), T½: {c.halfLifeYears}y
            </option>
          ))}
        </select>

        <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
          Formula: {activeCompound.chemicalFormula} &bull; CAS: {activeCompound.casNumber}
        </p>
      </div>

      {/* Sampling Engine & Iterations Controls */}
      <div className="card-panel p-3.5 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-700 uppercase font-mono tracking-wider text-[11px]">
            Sampling Engine
          </span>
          <span className="text-slate-500 font-mono text-[10px]">{getMethodName()}</span>
        </div>

        {/* Sampling Method Selector */}
        <div className="grid grid-cols-3 gap-1 font-mono">
          <button
            type="button"
            onClick={() => setSamplingConfig({ method: 'monte-carlo' })}
            className={`flex flex-col items-center justify-center p-2 rounded-md border transition-all font-semibold text-[11px] leading-tight cursor-pointer ${
              samplingConfig.method === 'monte-carlo'
                ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title="Standard Monte Carlo Simulation"
          >
            <Cpu className="w-3.5 h-3.5 mb-1" />
            <span className="text-center">Monte Carlo</span>
          </button>

          <button
            type="button"
            onClick={() => setSamplingConfig({ method: 'latin-hypercube' })}
            className={`flex flex-col items-center justify-center p-2 rounded-md border transition-all font-semibold text-[11px] leading-tight cursor-pointer ${
              samplingConfig.method === 'latin-hypercube'
                ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title="Latin Hypercube Sampling"
          >
            <Layers className="w-3.5 h-3.5 mb-1" />
            <span className="text-center">Latin Hypercube</span>
          </button>

          <button
            type="button"
            onClick={() => setSamplingConfig({ method: 'monte-carlo-lhs' })}
            className={`flex flex-col items-center justify-center p-2 rounded-md border transition-all font-semibold text-[11px] leading-tight cursor-pointer ${
              samplingConfig.method === 'monte-carlo-lhs'
                ? 'bg-teal-900 text-white border-teal-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title="Combined Monte Carlo + Latin Hypercube Hybrid"
          >
            <GitMerge className="w-3.5 h-3.5 mb-1" />
            <span className="text-center">MC + LHS</span>
          </button>
        </div>

        <div className="space-y-2 font-mono">
          <div className="flex items-center justify-between text-slate-700">
            <span>
              Iterations (<MathView math="N" />)
            </span>
            <span className="text-slate-900 font-bold">
              {samplingConfig.iterations.toLocaleString()}
            </span>
          </div>

          <input
            type="range"
            min="1000"
            max="50000"
            step="1000"
            value={samplingConfig.iterations}
            onChange={(e) => setSamplingConfig({ iterations: parseInt(e.target.value, 10) })}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
          />
        </div>

        <div className="flex items-center justify-between gap-3 font-mono">
          <span className="text-slate-600 text-[11px]">PRNG Seed</span>
          <input
            type="number"
            value={samplingConfig.seed || 42}
            onChange={(e) => setSamplingConfig({ seed: parseInt(e.target.value, 10) || 42 })}
            className="w-24 bg-white border border-slate-300 text-slate-900 rounded-md px-2 py-1 text-center text-xs focus:outline-none focus:border-slate-900"
          />
        </div>

        <Button
          onClick={onRunSimulation}
          loading={isSimulating}
          variant="primary"
          size="lg"
          className="w-full mt-1 font-mono uppercase tracking-wider text-xs"
          icon={<Play className="w-4 h-4 fill-current" />}
        >
          {isSimulating ? 'Simulating...' : `Execute ${getMethodName()}`}
        </Button>
      </div>

      {/* Physiological & Exposure Input Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="font-bold text-slate-700 uppercase font-mono tracking-wider text-[11px]">
            Physiological &amp; Exposure Inputs
          </span>
          {onOpenGuide ? (
            <button
              type="button"
              onClick={onOpenGuide}
              className="text-[11px] font-sans font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
              title="Open Parameter & Range Guide"
            >
              <span>Range Guide</span>
              <BookOpen className="w-3 h-3" />
            </button>
          ) : (
            <span className="text-slate-500 font-mono text-[10px]">7 Parameters</span>
          )}
        </div>

        {PARAMETER_KEYS.map((key) => {
          const param = parameters[key];
          const thresholdInfo = criticalAnalysis.parameterThresholds.find(
            (p: ParameterCriticalThreshold) => p.id === key,
          );

          return (
            <div
              key={key}
              className={`card-panel p-3 rounded-xl space-y-2 hover:border-slate-300 transition-colors ${
                thresholdInfo?.isExceeded ? 'border-red-200/80' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-xs">{param.name}</span>
                  <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                    {param.unit}
                  </span>
                </div>
                <Tooltip content={param.scientificContext} />
              </div>

              {/* Critical Threshold Reference Indicator */}
              {thresholdInfo && (
                <div className="flex items-center justify-between text-[10px] font-mono pt-0.5">
                  <span className="text-slate-500">
                    Critical cutoff:{' '}
                    <span className="font-semibold text-slate-700">
                      {thresholdInfo.criticalRangeDisplay}
                    </span>
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${
                      thresholdInfo.isExceeded
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : thresholdInfo.status === 'borderline'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {thresholdInfo.isExceeded
                      ? 'Exceeds cutoff'
                      : thresholdInfo.status === 'borderline'
                        ? 'Elevated'
                        : 'Within cutoff'}
                  </span>
                </div>
              )}

              <p className="text-[11px] text-slate-500 leading-relaxed">{param.description}</p>

              <DistributionSelector
                distribution={param.distribution}
                onChangeDistributionType={(type) =>
                  setParameterDistribution(key, createDefaultDistribution(type))
                }
                onChangeValue={(valKey, val) => updateParameterValue(key, valKey, val)}
                unit={param.unit}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
