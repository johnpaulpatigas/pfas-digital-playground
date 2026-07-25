import React from 'react';
import { useSimulationStore } from '../../stores/useSimulationStore';
import { DEMOGRAPHIC_PRESETS } from '../scenarios/presets';
import { PFAS_COMPOUNDS } from '../../simulation/pfasCompounds';
import { DistributionSelector } from './DistributionSelector';
import { Tooltip } from '../../components/ui/Tooltip';
import { Button } from '../../components/ui/Button';
import type { DistributionType, SimulationParameters } from '../../types';
import { Play, Sliders, RefreshCw, Cpu, Layers, Bookmark, FlaskConical, GitMerge } from 'lucide-react';
import { MathView } from '../../components/ui/MathView';

interface ParameterSidebarProps {
  onRunSimulation: () => void;
}

export const ParameterSidebar: React.FC<ParameterSidebarProps> = ({ onRunSimulation }) => {
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

  const getMethodName = () => {
    switch (samplingConfig.method) {
      case 'monte-carlo':
        return 'Monte Carlo';
      case 'latin-hypercube':
        return 'Latin Hypercube';
      case 'monte-carlo-lhs':
        return 'Monte Carlo + LHS';
    }
  };

  const createDefaultDistribution = (type: DistributionType): any => {
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
      {/* Target PFAS Compound Selection Card */}
      <div className="card-panel p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-800 uppercase font-mono tracking-wider text-[11px]">
              PFAS Compound &amp; Bio-Kinetics
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-medium">
            EPA MCL: {activeCompound.epaMCL} ng/L
          </span>
        </div>

        <select
          value={samplingConfig.compoundId}
          onChange={(e) => setCompoundId(e.target.value)}
          className="w-full bg-white border border-slate-300 text-slate-900 rounded-md px-3 py-1.5 text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {PFAS_COMPOUNDS.map((compound) => (
            <option key={compound.id} value={compound.id}>
              {compound.name} (T1/2 = {compound.halfLifeYears} yrs)
            </option>
          ))}
        </select>

        <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between font-mono">
          <span>Formula: <MathView math={activeCompound.chemicalFormula} /></span>
          <span className="text-slate-500">CAS: {activeCompound.casNumber}</span>
        </div>
      </div>

      {/* Scenario Presets Bar */}
      <div className="card-panel p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-teal-600" />
            <span className="font-bold text-slate-800 uppercase font-mono tracking-wider text-[11px]">
              Demographic Presets
            </span>
          </div>
          <button
            onClick={resetToDefault}
            className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors font-mono"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        <select
          value={activeScenarioId}
          onChange={(e) => loadScenario(e.target.value)}
          className="w-full bg-white border border-slate-300 text-slate-900 rounded-md px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          {DEMOGRAPHIC_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name} ({preset.targetGroup})
            </option>
          ))}
        </select>
      </div>

      {/* Sampling Engine Setup */}
      <div className="card-panel p-4 rounded-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <Sliders className="w-4 h-4 text-purple-600" />
          <span className="font-bold text-slate-800 uppercase font-mono tracking-wider text-[11px]">
            Sampling Method &amp; Iterations
          </span>
        </div>

        {/* Method Toggle Buttons */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setSamplingConfig({ method: 'monte-carlo' })}
            className={`flex flex-col items-center justify-center p-2 rounded-md border transition-all font-semibold text-[11px] leading-tight ${
              samplingConfig.method === 'monte-carlo'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title="Monte Carlo Sampling"
          >
            <Cpu className="w-3.5 h-3.5 mb-1" />
            <span className="text-center">Monte Carlo</span>
          </button>

          <button
            type="button"
            onClick={() => setSamplingConfig({ method: 'latin-hypercube' })}
            className={`flex flex-col items-center justify-center p-2 rounded-md border transition-all font-semibold text-[11px] leading-tight ${
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
            className={`flex flex-col items-center justify-center p-2 rounded-md border transition-all font-semibold text-[11px] leading-tight ${
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

        {/* Iterations Slider */}
        <div className="space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-slate-700">
            <span>Iterations (N)</span>
            <span className="text-slate-900 font-bold">{samplingConfig.iterations.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="500"
            max="20000"
            step="500"
            value={samplingConfig.iterations}
            onChange={(e) => setSamplingConfig({ iterations: parseInt(e.target.value, 10) })}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
          />
        </div>

        {/* Random Seed Input */}
        <div className="flex items-center justify-between gap-3 font-mono">
          <span className="text-slate-600 text-[11px]">PRNG Seed</span>
          <input
            type="number"
            value={samplingConfig.seed || 42}
            onChange={(e) => setSamplingConfig({ seed: parseInt(e.target.value, 10) || 42 })}
            className="w-24 bg-white border border-slate-300 text-slate-900 rounded-md px-2 py-1 text-center text-xs focus:outline-none focus:border-slate-900"
          />
        </div>

        {/* Run Simulation Trigger */}
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

      {/* Exposure Parameter Accordion Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="font-bold text-slate-700 uppercase font-mono tracking-wider text-[11px]">
            Physiological &amp; Exposure Inputs
          </span>
          <span className="text-slate-500 font-mono text-[10px]">7 Parameters</span>
        </div>

        {parameterKeys.map((key) => {
          const param = parameters[key];
          return (
            <div
              key={key}
              className="card-panel p-3 rounded-xl space-y-2 hover:border-slate-300 transition-colors"
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
    </div>
  );
};
