import React, { useMemo } from 'react';
import { useSimulationStore } from '../../stores/useSimulationStore';
import { DEMOGRAPHIC_PRESETS } from '../scenarios/presets';
import { PFAS_COMPOUNDS } from '../../simulation/pfasCompounds';
import { calculateDetailedCriticalAnalysis, deriveAutomatedParameters } from '../../simulation/toxicokinetics';
import { DistributionSelector } from './DistributionSelector';
import { Tooltip } from '../../components/ui/Tooltip';
import { Button } from '../../components/ui/Button';
import type { DistributionType, DistributionParams, SimulationParameters, ParameterCriticalThreshold } from '../../types';
import {
  Play,
  Sliders,
  RefreshCw,
  Cpu,
  Layers,
  GitMerge,
  BookOpen,
  Sparkles,
  Scale,
  Calendar,
  Droplets,
  Calculator,
  Users,
} from 'lucide-react';
import { MathView } from '../../components/ui/MathView';

interface ParameterSidebarProps {
  onRunSimulation: () => void;
  onOpenGuide?: () => void;
}

export const ParameterSidebar: React.FC<ParameterSidebarProps> = ({ onRunSimulation, onOpenGuide }) => {
  const {
    mode,
    simpleProfile,
    parameters,
    samplingConfig,
    activeScenarioId,
    isSimulating,
    setPlaygroundMode,
    updateSimpleProfile,
    setParameterDistribution,
    updateParameterValue,
    setSamplingConfig,
    setCompoundId,
    loadScenario,
    resetToDefault,
  } = useSimulationStore();

  const parameterKeys: Array<keyof SimulationParameters> = [
    'dailyIntake',
    'bodyWeight',
    'age',
    'waterConsumption',
    'bioavailability',
    'eliminationHalfLife',
    'exposureDuration',
  ];

  const activeCompound = PFAS_COMPOUNDS.find((c) => c.id === samplingConfig.compoundId) || PFAS_COMPOUNDS[0];

  const criticalAnalysis = useMemo(() => {
    return calculateDetailedCriticalAnalysis(activeCompound, parameters);
  }, [activeCompound, parameters]);

  const derivedStats = useMemo(() => {
    return deriveAutomatedParameters(simpleProfile);
  }, [simpleProfile]);

  const activeScenario = useMemo(() => {
    return DEMOGRAPHIC_PRESETS.find((s) => s.id === activeScenarioId);
  }, [activeScenarioId]);

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

  const isSimpleMode = mode === 'simple';

  return (
    <div className="w-full space-y-4 text-xs font-sans">
      {/* 1. Mode Switcher: Simple Mode vs Advanced Mode */}
      <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 grid grid-cols-2 gap-1 font-mono text-[11px]">
        <button
          type="button"
          onClick={() => setPlaygroundMode('simple')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
            isSimpleMode
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Simple Mode</span>
        </button>

        <button
          type="button"
          onClick={() => setPlaygroundMode('advanced')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
            !isSimpleMode
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>Advanced Mode</span>
        </button>
      </div>

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

        {/* Demographic Context Indicator in Simple Mode */}
        {isSimpleMode && (
          <div className="flex items-center justify-between text-[10px] font-mono bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 text-slate-600">
            <span className="truncate">
              {activeScenario ? activeScenario.targetGroup : 'Customized Profile'}
            </span>
            {activeScenarioId === 'custom' ? (
              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold text-[9px] shrink-0">
                Customized
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold text-[9px] shrink-0">
                Calibrated Cohort
              </span>
            )}
          </div>
        )}
      </div>

      {/* Chemical Compound Selection */}
      {!isSimpleMode ? (
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
      ) : (
        <div className="card-panel p-3 rounded-xl bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border-blue-100 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-bold text-slate-800 text-xs">Simulating all 5 PFAS types</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
              5k to 50k MC+LHS
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            PFOA, PFOS, PFHxS, PFNA, and GenX are evaluated in parallel with chemical-specific half-lives ($T_{1/2}$) and RfD reference thresholds.
          </p>
        </div>
      )}

      {/* Sampling Engine & Iterations Controls */}
      <div className="card-panel p-3.5 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-700 uppercase font-mono tracking-wider text-[11px]">
            Sampling Engine
          </span>
          <span className="text-slate-500 font-mono text-[10px]">
            {isSimpleMode ? 'MC + LHS Locked' : getMethodName()}
          </span>
        </div>

        {/* Sampling Method Selector (Advanced Mode Only) */}
        {!isSimpleMode && (
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
        )}

        <div className="space-y-2 font-mono">
          <div className="flex items-center justify-between text-slate-700">
            <span>Iterations (<MathView math="N" />)</span>
            <span className="text-slate-900 font-bold">{samplingConfig.iterations.toLocaleString()}</span>
          </div>

          <input
            type="range"
            min={isSimpleMode ? "5000" : "1000"}
            max="50000"
            step={isSimpleMode ? "2500" : "1000"}
            value={samplingConfig.iterations}
            onChange={(e) => setSamplingConfig({ iterations: parseInt(e.target.value, 10) })}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
          />

          {isSimpleMode && (
            <div className="flex items-center justify-between gap-1 pt-0.5">
              {[5000, 10000, 25000, 50000].map((presetVal) => (
                <button
                  key={presetVal}
                  type="button"
                  onClick={() => setSamplingConfig({ iterations: presetVal })}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                    samplingConfig.iterations === presetVal
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {(presetVal / 1000)}k
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Random Seed Input (Advanced Mode Only) */}
        {!isSimpleMode && (
          <div className="flex items-center justify-between gap-3 font-mono">
            <span className="text-slate-600 text-[11px]">PRNG Seed</span>
            <input
              type="number"
              value={samplingConfig.seed || 42}
              onChange={(e) => setSamplingConfig({ seed: parseInt(e.target.value, 10) || 42 })}
              className="w-24 bg-white border border-slate-300 text-slate-900 rounded-md px-2 py-1 text-center text-xs focus:outline-none focus:border-slate-900"
            />
          </div>
        )}

        <Button
          onClick={onRunSimulation}
          loading={isSimulating}
          variant="primary"
          size="lg"
          className="w-full mt-1 font-mono uppercase tracking-wider text-xs"
          icon={<Play className="w-4 h-4 fill-current" />}
        >
          {isSimulating
            ? 'Simulating...'
            : isSimpleMode
            ? `Execute Simulation (${(samplingConfig.iterations / 1000)}k Samples)`
            : `Execute ${getMethodName()}`}
        </Button>
      </div>

      {/* Physiological & Exposure Input Section */}
      {isSimpleMode ? (
        <div className="space-y-3">
          {/* Section Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700 uppercase font-mono tracking-wider text-[11px]">
                Your Personal Profile
              </span>
              <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-mono font-bold">
                3 Inputs
              </span>
            </div>
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
              <span className="text-slate-500 font-mono text-[10px]">Automated</span>
            )}
          </div>

          {/* Input 1: Body Weight */}
          <div className="card-panel p-3 rounded-xl space-y-2 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-bold text-slate-800 text-xs">Body Weight</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                  kg
                </span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="25"
                  max="140"
                  step="0.5"
                  value={simpleProfile.bodyWeight}
                  onChange={(e) => updateSimpleProfile({ bodyWeight: parseFloat(e.target.value) || 55.4 })}
                  className="w-16 bg-white border border-slate-300 text-slate-900 rounded-md px-1.5 py-0.5 text-right font-mono text-xs font-bold focus:outline-none focus:border-slate-900"
                />
                <span className="text-[10px] text-slate-500 font-mono">kg</span>
              </div>
            </div>

            <input
              type="range"
              min="30"
              max="120"
              step="0.5"
              value={simpleProfile.bodyWeight}
              onChange={(e) => updateSimpleProfile({ bodyWeight: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            <div className="flex items-center justify-between gap-1 pt-0.5">
              {[
                { label: '45kg (Petite)', val: 45 },
                { label: '55.4kg (Avg F)', val: 55.4 },
                { label: '65.2kg (Preg)', val: 65.2 },
                { label: '68kg (Avg M)', val: 68 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => updateSimpleProfile({ bodyWeight: preset.val })}
                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono transition-all cursor-pointer border ${
                    Math.abs(simpleProfile.bodyWeight - preset.val) < 0.1
                      ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input 2: Age */}
          <div className="card-panel p-3 rounded-xl space-y-2 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-bold text-slate-800 text-xs">Age</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                  years
                </span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="95"
                  step="1"
                  value={simpleProfile.age}
                  onChange={(e) => updateSimpleProfile({ age: parseInt(e.target.value, 10) || 30 })}
                  className="w-16 bg-white border border-slate-300 text-slate-900 rounded-md px-1.5 py-0.5 text-right font-mono text-xs font-bold focus:outline-none focus:border-slate-900"
                />
                <span className="text-[10px] text-slate-500 font-mono">yrs</span>
              </div>
            </div>

            <input
              type="range"
              min="18"
              max="80"
              step="1"
              value={simpleProfile.age}
              onChange={(e) => updateSimpleProfile({ age: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />

            <div className="flex items-center justify-between gap-1 pt-0.5">
              {[18, 30, 45, 65].map((presetVal) => (
                <button
                  key={presetVal}
                  type="button"
                  onClick={() => updateSimpleProfile({ age: presetVal })}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer border ${
                    simpleProfile.age === presetVal
                      ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {presetVal} yrs
                </button>
              ))}
            </div>
          </div>

          {/* Input 3: Daily Drinking Water Intake */}
          <div className="card-panel p-3 rounded-xl space-y-2 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-teal-600" />
                <span className="font-bold text-slate-800 text-xs">Daily Drinking Water</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                  L/day
                </span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0.5"
                  max="6.0"
                  step="0.1"
                  value={simpleProfile.waterConsumption}
                  onChange={(e) => updateSimpleProfile({ waterConsumption: parseFloat(e.target.value) || 2.0 })}
                  className="w-16 bg-white border border-slate-300 text-slate-900 rounded-md px-1.5 py-0.5 text-right font-mono text-xs font-bold focus:outline-none focus:border-slate-900"
                />
                <span className="text-[10px] text-slate-500 font-mono">L/d</span>
              </div>
            </div>

            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.1"
              value={simpleProfile.waterConsumption}
              onChange={(e) => updateSimpleProfile({ waterConsumption: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />

            <div className="flex items-center justify-between gap-1 pt-0.5">
              {[
                { label: '1.0 L', val: 1.0 },
                { label: '1.5 L', val: 1.5 },
                { label: '2.0 L (Avg)', val: 2.0 },
                { label: '2.8 L (Preg)', val: 2.8 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => updateSimpleProfile({ waterConsumption: preset.val })}
                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono transition-all cursor-pointer border ${
                    Math.abs(simpleProfile.waterConsumption - preset.val) < 0.05
                      ? 'bg-teal-600 text-white border-teal-600 font-bold shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-Derived Toxicological & Pharmacokinetic Parameters Card */}
          <div className="card-panel p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50/40 border-indigo-100/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-bold text-indigo-950 text-xs">Automated Parameters</span>
              </div>
              <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                EPA/EFSA Standard
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              {/* Daily Intake */}
              <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-0.5">
                <span className="text-slate-500 text-[10px]">Est. Daily Intake</span>
                <p className="font-bold text-slate-900 text-xs">
                  {derivedStats.derivedTotalIntakeUg.toFixed(4)} <span className="text-[10px] text-slate-500">µg/d</span>
                </p>
                <p className="text-[9px] text-slate-400">
                  Water: {derivedStats.derivedIntakeWaterUg.toFixed(4)} + Diet: {derivedStats.derivedIntakeDietaryUg.toFixed(4)}
                </p>
              </div>

              {/* Chronic Exposure Duration */}
              <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-0.5">
                <span className="text-slate-500 text-[10px]">Exposure Horizon</span>
                <p className="font-bold text-slate-900 text-xs">
                  {derivedStats.derivedExposureYears} <span className="text-[10px] text-slate-500">years</span>
                </p>
                <p className="text-[9px] text-slate-400">
                  Estimated from age {simpleProfile.age}
                </p>
              </div>

              {/* Bioavailability */}
              <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-0.5">
                <span className="text-slate-500 text-[10px]">GI Bioavailability</span>
                <p className="font-bold text-slate-900 text-xs">
                  92% <span className="text-[10px] text-emerald-600 font-semibold">(0.92)</span>
                </p>
                <p className="text-[9px] text-slate-400">
                  EFSA Contam standard
                </p>
              </div>

              {/* Compound Half-Lives */}
              <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-0.5">
                <span className="text-slate-500 text-[10px]">Compound T1/2</span>
                <p className="font-bold text-slate-900 text-xs">
                  0.2y to 8.5y
                </p>
                <p className="text-[9px] text-slate-400">
                  5 PFAS types evaluated
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Advanced Mode 7 Parameters Accordion */
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

          {parameterKeys.map((key) => {
            const param = parameters[key];
            const thresholdInfo = criticalAnalysis.parameterThresholds.find((p: ParameterCriticalThreshold) => p.id === key);

            return (
              <div
                key={key}
                className={`card-panel p-3 rounded-xl space-y-2 hover:border-slate-300 transition-colors ${
                  thresholdInfo && thresholdInfo.isExceeded ? 'border-red-200/80' : ''
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
                      Critical cutoff: <span className="font-semibold text-slate-700">{thresholdInfo.criticalRangeDisplay}</span>
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
                      {thresholdInfo.isExceeded ? 'Exceeds cutoff' : thresholdInfo.status === 'borderline' ? 'Elevated' : 'Within cutoff'}
                    </span>
                  </div>
                )}

                <p className="text-[11px] text-slate-500 leading-relaxed">{param.description}</p>

                <DistributionSelector
                  distribution={param.distribution}
                  onChangeDistributionType={(type) => setParameterDistribution(key, createDefaultDistribution(type))}
                  onChangeValue={(valKey, val) => updateParameterValue(key, valKey, val)}
                  unit={param.unit}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
