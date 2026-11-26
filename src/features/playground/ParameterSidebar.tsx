import {
  BookOpen,
  Cpu,
  GitMerge,
  Layers,
  Lock,
  Play,
  RefreshCw,
  Terminal,
  Users,
} from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { DualRangeSlider } from '../../components/ui/DualRangeSlider';
import { MathView } from '../../components/ui/MathView';
import { Tooltip } from '../../components/ui/Tooltip';
import { getSimulationParameter, getVisibleParameterKeys } from '../../simulation/parameters';
import { PFAS_COMPOUNDS } from '../../simulation/pfasCompounds';
import { calculateDetailedCriticalAnalysis } from '../../simulation/toxicokinetics';
import { useSimulationStore } from '../../stores/useSimulationStore';
import type {
  DistributionParams,
  ParameterCriticalThreshold,
  SimulationParameters,
} from '../../types';

interface ParameterSidebarProps {
  onRunSimulation: () => void;
  onOpenGuide?: () => void;
}

const ITERATION_PRESETS = [1000, 5000, 10000, 25000];

const getParamBounds = (
  key: keyof SimulationParameters,
  dist: DistributionParams,
): { minBound: number; maxBound: number; step: number } => {
  switch (key) {
    case 'bodyWeight':
      return { minBound: 30, maxBound: 120, step: 0.5 };
    case 'age':
      return { minBound: 10, maxBound: 80, step: 1 };
    case 'waterConsumption':
      return { minBound: 0.2, maxBound: 6.0, step: 0.1 };
    case 'bioavailability':
      return { minBound: 0.1, maxBound: 1.0, step: 0.01 };
    case 'eliminationHalfLife':
      return { minBound: 0.05, maxBound: 15.0, step: 0.05 };
    case 'exposureDuration':
      return { minBound: 1, maxBound: 60, step: 1 };
    default: {
      // Intake or water concentration
      const currentHigh =
        dist.type === 'fixed'
          ? dist.value
          : dist.type === 'uniform' || dist.type === 'triangular'
            ? dist.max
            : dist.mean + 2 * dist.sd;
      const maxBound = Math.max(currentHigh * 3, key.startsWith('waterConcentration') ? 20 : 0.05);
      const step = maxBound / 100;
      return { minBound: 0, maxBound, step };
    }
  }
};

const getRangeFromDistribution = (dist: DistributionParams): [number, number] => {
  switch (dist.type) {
    case 'fixed':
      return [dist.value, dist.value];
    case 'uniform':
    case 'triangular':
      return [dist.min, dist.max];
    case 'normal':
    case 'lognormal':
      return [Math.max(0, dist.mean - 2 * dist.sd), dist.mean + 2 * dist.sd];
  }
};

export const ParameterSidebar: React.FC<ParameterSidebarProps> = ({
  onRunSimulation,
  onOpenGuide,
}) => {
  const parameters = useSimulationStore((state) => state.parameters);
  const samplingConfig = useSimulationStore((state) => state.samplingConfig);
  const activeScenarioId = useSimulationStore((state) => state.activeScenarioId);
  const isSimulating = useSimulationStore((state) => state.isSimulating);
  const logs = useSimulationStore((state) => state.logs);
  const setParameterDistribution = useSimulationStore((state) => state.setParameterDistribution);
  const setSamplingConfig = useSimulationStore((state) => state.setSamplingConfig);
  const setCompoundId = useSimulationStore((state) => state.setCompoundId);
  const loadScenario = useSimulationStore((state) => state.loadScenario);
  const resetToDefault = useSimulationStore((state) => state.resetToDefault);

  const isCustomMode = activeScenarioId === 'custom';
  const [compoundScope, setCompoundScope] = useState<'all' | string>('all');
  const [showLog, setShowLog] = useState(false);

  const effectiveScope = isCustomMode ? compoundScope : 'all';
  const activeCompound =
    PFAS_COMPOUNDS.find((c) => c.id === samplingConfig.compoundId) || PFAS_COMPOUNDS[0];

  const criticalAnalysis = useMemo(() => {
    return calculateDetailedCriticalAnalysis(activeCompound, parameters);
  }, [activeCompound, parameters]);

  const visibleParameterKeys = getVisibleParameterKeys(activeCompound.id);

  const getMethodName = () => {
    switch (samplingConfig.method) {
      case 'monte-carlo':
        return 'MCS';
      case 'latin-hypercube':
        return 'LHS';
      case 'monte-carlo-lhs':
        return 'LHS + MCS';
    }
  };

  const handleRangeChange = (
    key: keyof SimulationParameters,
    dist: DistributionParams,
    newLow: number,
    newHigh: number,
  ) => {
    if (!isCustomMode) return;
    let updated: DistributionParams;
    switch (dist.type) {
      case 'fixed':
        updated = { type: 'fixed', value: (newLow + newHigh) / 2 };
        break;
      case 'uniform':
        updated = { type: 'uniform', min: newLow, max: newHigh };
        break;
      case 'triangular': {
        const span = Math.max(dist.max - dist.min, 1e-9);
        const modeRatio = Math.max(0, Math.min(1, (dist.mode - dist.min) / span));
        updated = {
          type: 'triangular',
          min: newLow,
          mode: newLow + modeRatio * (newHigh - newLow),
          max: newHigh,
        };
        break;
      }
      case 'normal':
      case 'lognormal':
        updated = {
          type: dist.type,
          mean: (newLow + newHigh) / 2,
          sd: Math.max((newHigh - newLow) / 4, 1e-6),
        };
        break;
    }
    setParameterDistribution(key, updated);
  };

  return (
    <div className="w-full space-y-4 text-xs font-sans">
      {/* 1. Demographic Presets */}
      <div className="card-panel p-3 rounded-xl space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-bold text-slate-700 uppercase font-mono tracking-wider text-[11px]">
              Demographic Presets
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              resetToDefault();
              setCompoundScope('all');
            }}
            className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="Reset to baseline defaults"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'average-filipino-woman', label: 'Avg. W', title: 'Average Filipino woman' },
            { id: 'pregnant-woman', label: 'P.W.', title: 'Pregnant woman' },
            { id: 'custom', label: 'Custom', title: 'Custom Parameters & Compound Selection' },
          ].map((item) => {
            const isActive = activeScenarioId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  loadScenario(item.id);
                  if (item.id !== 'custom') setCompoundScope('all');
                }}
                title={item.title}
                className={`p-2 rounded-lg text-[11px] font-mono text-center transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. PFAS Compound */}
      <div className="card-panel p-3 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-700 uppercase font-mono tracking-wider text-[11px]">
            PFAS Compound
          </span>
          {!isCustomMode && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
              <Lock className="w-3 h-3" /> All PFAS locked
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1.5 font-mono">
          {PFAS_COMPOUNDS.map((c) => {
            const isSelected = effectiveScope === c.id;
            return (
              <button
                key={c.id}
                type="button"
                disabled={!isCustomMode}
                onClick={() => {
                  setCompoundScope(c.id);
                  setCompoundId(c.id);
                }}
                className={`p-1.5 rounded-md border text-[11px] font-semibold transition-all ${
                  !isCustomMode
                    ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                    : isSelected
                      ? 'bg-slate-900 text-white border-slate-900 cursor-pointer'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                {c.id.toUpperCase()}
              </button>
            );
          })}
          <button
            type="button"
            disabled={!isCustomMode}
            onClick={() => setCompoundScope('all')}
            className={`p-1.5 rounded-md border text-[11px] font-semibold transition-all ${
              effectiveScope === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            } ${!isCustomMode ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
          >
            All
          </button>
        </div>
      </div>

      {/* 3. Sampling Engine */}
      <div className="card-panel p-3 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-700 uppercase font-mono tracking-wider text-[11px]">
            Sampling Engine
          </span>
          <span className="text-slate-500 font-mono text-[10px]">{getMethodName()}</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 font-mono">
          <button
            type="button"
            onClick={() => setSamplingConfig({ method: 'monte-carlo-lhs' })}
            className={`relative flex flex-col items-center justify-center p-2 rounded-md border transition-all font-semibold text-[11px] leading-tight cursor-pointer ${
              samplingConfig.method === 'monte-carlo-lhs'
                ? 'bg-teal-900 text-white border-teal-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className="text-[8px] uppercase tracking-wider px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold mb-1">
              Recommended
            </span>
            <GitMerge className="w-3.5 h-3.5 mb-0.5" />
            <span>LHS+MCS</span>
          </button>

          <button
            type="button"
            onClick={() => setSamplingConfig({ method: 'latin-hypercube' })}
            className={`flex flex-col items-center justify-center p-2 rounded-md border transition-all font-semibold text-[11px] leading-tight cursor-pointer ${
              samplingConfig.method === 'latin-hypercube'
                ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 mb-1" />
            <span>LHS</span>
          </button>

          <button
            type="button"
            onClick={() => setSamplingConfig({ method: 'monte-carlo' })}
            className={`flex flex-col items-center justify-center p-2 rounded-md border transition-all font-semibold text-[11px] leading-tight cursor-pointer ${
              samplingConfig.method === 'monte-carlo'
                ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 mb-1" />
            <span>MCS</span>
          </button>
        </div>
      </div>

      {/* 4. No. of Iteration & PRNG Seed */}
      <div className="card-panel p-3 rounded-xl space-y-2.5 font-mono">
        <div className="flex items-center justify-between text-slate-700">
          <span className="font-bold uppercase tracking-wider text-[11px]">
            No. of Iteration (<MathView math="N" />)
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

        <div className="grid grid-cols-4 gap-1">
          {ITERATION_PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setSamplingConfig({ iterations: n })}
              className={`py-1 rounded text-[10px] border transition-colors cursor-pointer ${
                samplingConfig.iterations === n
                  ? 'bg-slate-900 text-white border-slate-900 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {(n / 1000).toFixed(0)}k
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-slate-600 text-[11px]">PRNG SEED</span>
          <input
            type="number"
            value={samplingConfig.seed || 42}
            onChange={(e) => setSamplingConfig({ seed: parseInt(e.target.value, 10) || 42 })}
            className="w-24 bg-white border border-slate-300 text-slate-900 rounded-md px-2 py-1 text-center text-xs focus:outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {/* 5. Physiological & Exposure Inputs */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="font-bold text-slate-700 uppercase font-mono tracking-wider text-[11px]">
            Physiological &amp; Exposure Inputs
          </span>
          {onOpenGuide && (
            <button
              type="button"
              onClick={onOpenGuide}
              className="text-[11px] font-sans font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Range guide</span>
              <BookOpen className="w-3 h-3" />
            </button>
          )}
        </div>

        {!isCustomMode && (
          <p className="px-1 text-[11px] text-slate-500 leading-relaxed">
            Preset ranges are locked to scientific guide distributions. Switch to{' '}
            <strong>Custom</strong> above to adjust individual parameter ranges.
          </p>
        )}

        {visibleParameterKeys.map((key) => {
          const param = getSimulationParameter(parameters, key);
          const thresholdInfo = criticalAnalysis.parameterThresholds.find(
            (p: ParameterCriticalThreshold) => p.id === key,
          );
          const [low, high] = getRangeFromDistribution(param.distribution);
          const { minBound, maxBound, step } = getParamBounds(key, param.distribution);

          return (
            <div
              key={key}
              className={`card-panel p-3 rounded-xl space-y-2 transition-colors ${
                thresholdInfo?.isExceeded ? 'border-red-200/80' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-xs">{param.name}</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {param.distribution.type}
                  </span>
                </div>
                <Tooltip content={param.scientificContext} />
              </div>

              <DualRangeSlider
                minBound={minBound}
                maxBound={maxBound}
                step={step}
                low={low}
                high={high}
                disabled={!isCustomMode}
                unit={param.unit}
                onChange={(newLow, newHigh) =>
                  handleRangeChange(key, param.distribution, newLow, newHigh)
                }
              />
            </div>
          );
        })}
      </div>

      {/* 6. Sticky Execute Button & Simulation Log */}
      <div className="sticky bottom-3 z-20 space-y-2 pt-2">
        <div className="bg-white/95 backdrop-blur-sm p-2 rounded-xl border border-slate-200 shadow-lg space-y-2">
          <Button
            onClick={onRunSimulation}
            loading={isSimulating}
            variant="primary"
            size="lg"
            className="w-full font-mono uppercase tracking-wider text-xs"
            icon={<Play className="w-4 h-4 fill-current" />}
          >
            {isSimulating ? 'Simulating...' : `Execute ${getMethodName()}`}
          </Button>

          <button
            type="button"
            onClick={() => setShowLog((prev) => !prev)}
            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-mono text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3 h-3" />
              <span>&gt; Simulation Log ({logs.length})</span>
            </span>
            <span>{showLog ? 'Hide' : 'Show'}</span>
          </button>

          {showLog && (
            <div className="max-h-32 overflow-y-auto bg-slate-900 text-slate-100 rounded-lg p-2 font-mono text-[10px] space-y-1">
              {logs.slice(-15).map((log, idx) => (
                <div key={`${idx}-${log.slice(0, 12)}`} className="leading-snug">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
