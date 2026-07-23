import { create } from 'zustand';
import type {
  SimulationParameters,
  SamplingConfig,
  IterationResult,
  SummaryStatistics,
  SensitivityRank,
  ComparisonResult,
  DistributionParams,
} from '../types';
import { DEMOGRAPHIC_PRESETS } from '../features/scenarios/presets';
import { PFAS_COMPOUNDS } from '../simulation/pfasCompounds';

interface SimulationState {
  // Config state
  parameters: SimulationParameters;
  samplingConfig: SamplingConfig;
  activeScenarioId: string;

  // Simulation execution state
  isSimulating: boolean;
  results: IterationResult[] | null;
  summaryStats: SummaryStatistics | null;
  sensitivityRanks: SensitivityRank[];
  comparison: ComparisonResult | null;

  // Console execution log
  logs: string[];

  // Actions
  setParameterDistribution: (paramId: keyof SimulationParameters, distribution: DistributionParams) => void;
  updateParameterValue: (paramId: keyof SimulationParameters, key: string, value: number) => void;
  setSamplingConfig: (config: Partial<SamplingConfig>) => void;
  setCompoundId: (compoundId: string) => void;
  loadScenario: (scenarioId: string) => void;
  setSimulationResults: (
    results: IterationResult[],
    summaryStats: SummaryStatistics,
    sensitivityRanks: SensitivityRank[]
  ) => void;
  setComparisonResults: (comparison: ComparisonResult) => void;
  setIsSimulating: (isSimulating: boolean) => void;
  addLog: (message: string) => void;
  clearLogs: () => void;
  resetToDefault: () => void;
}

const defaultScenario = DEMOGRAPHIC_PRESETS[0];

export const useSimulationStore = create<SimulationState>((set, get) => ({
  parameters: defaultScenario.parameters,
  samplingConfig: {
    method: 'monte-carlo',
    iterations: 5000,
    seed: 42,
    compoundId: 'pfoa',
  },
  activeScenarioId: defaultScenario.id,

  isSimulating: false,
  results: null,
  summaryStats: null,
  sensitivityRanks: [],
  comparison: null,

  logs: [`[System] Initialized PFAS Toxicokinetic Playground with '${defaultScenario.name}' scenario preset and PFOA target.`],

  setParameterDistribution: (paramId, distribution) => {
    set((state) => ({
      parameters: {
        ...state.parameters,
        [paramId]: {
          ...state.parameters[paramId],
          distribution,
        },
      },
    }));
    get().addLog(`[Config] Changed parameter '${paramId}' distribution type to '${distribution.type}'.`);
  },

  updateParameterValue: (paramId, key, value) => {
    set((state) => {
      const currentParam = state.parameters[paramId];
      return {
        parameters: {
          ...state.parameters,
          [paramId]: {
            ...currentParam,
            distribution: {
              ...currentParam.distribution,
              [key]: value,
            } as DistributionParams,
          },
        },
      };
    });
  },

  setSamplingConfig: (config) => {
    set((state) => ({
      samplingConfig: { ...state.samplingConfig, ...config },
    }));
    get().addLog(`[Config] Updated sampling settings (${config.method ? `Method: ${config.method}` : ''} ${config.iterations ? `Iterations: ${config.iterations}` : ''}).`);
  },

  setCompoundId: (compoundId) => {
    const compound = PFAS_COMPOUNDS.find((c) => c.id === compoundId);
    if (compound) {
      set((state) => ({
        samplingConfig: { ...state.samplingConfig, compoundId: compound.id },
        parameters: {
          ...state.parameters,
          eliminationHalfLife: {
            ...state.parameters.eliminationHalfLife,
            distribution: {
              ...state.parameters.eliminationHalfLife.distribution,
              mean: compound.halfLifeYears,
            } as DistributionParams,
          },
        },
      }));
      get().addLog(`[Compound] Selected chemical compound '${compound.name}' (Half-Life T1/2 = ${compound.halfLifeYears} yrs).`);
    }
  },

  loadScenario: (scenarioId) => {
    const scenario = DEMOGRAPHIC_PRESETS.find((s) => s.id === scenarioId);
    if (scenario) {
      set({
        parameters: JSON.parse(JSON.stringify(scenario.parameters)),
        activeScenarioId: scenario.id,
      });
      get().addLog(`[Preset] Loaded scenario profile '${scenario.name}'.`);
    }
  },

  setSimulationResults: (results, summaryStats, sensitivityRanks) => {
    set({
      results,
      summaryStats,
      sensitivityRanks,
      isSimulating: false,
    });
    get().addLog(`[Simulation] Completed ${results.length} iterations. Mean Serum Css: ${summaryStats.mean.toFixed(4)} µg/L. Risk Exceedance (HQ > 1.0): ${summaryStats.riskExceedancePercent.toFixed(1)}%.`);
  },

  setComparisonResults: (comparison) => {
    set({
      comparison,
      isSimulating: false,
    });
    get().addLog(`[Compare] Completed Monte Carlo vs Latin Hypercube benchmarking.`);
  },

  setIsSimulating: (isSimulating) => set({ isSimulating }),

  addLog: (message) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    set((state) => ({
      logs: [...state.logs.slice(-99), `[${timestamp}] ${message}`],
    }));
  },

  clearLogs: () => set({ logs: [] }),

  resetToDefault: () => {
    set({
      parameters: JSON.parse(JSON.stringify(defaultScenario.parameters)),
      activeScenarioId: defaultScenario.id,
      results: null,
      summaryStats: null,
      sensitivityRanks: [],
      comparison: null,
    });
    get().addLog(`[System] Reset parameters to default baseline.`);
  },
}));
