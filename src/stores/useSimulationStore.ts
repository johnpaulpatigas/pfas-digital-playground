import { create } from 'zustand';
import { DEMOGRAPHIC_PRESETS } from '../features/scenarios/presets';
import { getSimulationParameter } from '../simulation/parameters';
import { PFAS_COMPOUNDS } from '../simulation/pfasCompounds';
import type {
  ComparisonResult,
  CompoundSummary,
  DistributionParams,
  IterationResult,
  SamplingConfig,
  SensitivityRank,
  SimulationParameters,
  SummaryStatistics,
} from '../types';

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
  compoundSummaries: CompoundSummary[] | null;
  comparison: ComparisonResult | null;

  // Console execution log
  logs: string[];

  // Actions
  setParameterDistribution: (
    paramId: keyof SimulationParameters,
    distribution: DistributionParams,
  ) => void;
  updateParameterValue: (paramId: keyof SimulationParameters, key: string, value: number) => void;
  setSamplingConfig: (config: Partial<SamplingConfig>) => void;
  setCompoundId: (compoundId: string) => void;
  loadScenario: (scenarioId: string) => void;
  setSimulationResults: (
    results: IterationResult[],
    summaryStats: SummaryStatistics,
    sensitivityRanks: SensitivityRank[],
    compoundSummaries?: CompoundSummary[],
  ) => void;
  setComparisonResults: (comparison: ComparisonResult) => void;
  setIsSimulating: (isSimulating: boolean) => void;
  addLog: (message: string) => void;
  clearLogs: () => void;
  resetToDefault: () => void;
}

const defaultScenario = DEMOGRAPHIC_PRESETS[0];

const DEFAULT_SAMPLING_CONFIG: SamplingConfig = {
  method: 'monte-carlo',
  iterations: 5000,
  seed: 42,
  compoundId: 'pfoa',
};

const cloneDefaultParameters = () => JSON.parse(JSON.stringify(defaultScenario.parameters));

export const useSimulationStore = create<SimulationState>((set, get) => ({
  parameters: cloneDefaultParameters(),
  samplingConfig: { ...DEFAULT_SAMPLING_CONFIG },
  activeScenarioId: defaultScenario.id,

  isSimulating: false,
  results: null,
  summaryStats: null,
  sensitivityRanks: [],
  compoundSummaries: null,
  comparison: null,

  logs: [`[System] Initialized PFAS Toxicokinetic Playground with granular parameter controls.`],

  setParameterDistribution: (paramId, distribution) => {
    set((state) => ({
      parameters: {
        ...state.parameters,
        [paramId]: {
          ...getSimulationParameter(state.parameters, paramId),
          distribution,
        },
      },
    }));
    get().addLog(
      `[Config] Changed parameter '${paramId}' distribution type to '${distribution.type}'.`,
    );
  },

  updateParameterValue: (paramId, key, value) => {
    set((state) => {
      const currentParam = getSimulationParameter(state.parameters, paramId);
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
    get().addLog(
      `[Config] Updated sampling settings (${config.method ? `Method: ${config.method}` : ''} ${config.iterations ? `Iterations: ${config.iterations}` : ''}).`,
    );
  },

  setCompoundId: (compoundId) => {
    const compound = PFAS_COMPOUNDS.find((c) => c.id === compoundId);
    if (compound) {
      set((state) => {
        const curDist = state.parameters.eliminationHalfLife.distribution;
        let updatedDist: DistributionParams;

        switch (curDist.type) {
          case 'fixed':
            updatedDist = { type: 'fixed', value: compound.halfLifeYears };
            break;
          case 'normal':
          case 'lognormal': {
            // Preserve the previous distribution's relative spread, limited to 10% to 50%.
            const sdRatio = curDist.mean > 0 ? curDist.sd / curDist.mean : 0.25;
            updatedDist = {
              type: curDist.type,
              mean: compound.halfLifeYears,
              sd: parseFloat(
                (compound.halfLifeYears * Math.min(0.5, Math.max(0.1, sdRatio))).toFixed(2),
              ),
            };
            break;
          }
          case 'triangular': {
            updatedDist = {
              type: 'triangular',
              min: parseFloat((compound.halfLifeYears * 0.7).toFixed(2)),
              mode: compound.halfLifeYears,
              max: parseFloat((compound.halfLifeYears * 1.3).toFixed(2)),
            };
            break;
          }
          case 'uniform': {
            updatedDist = {
              type: 'uniform',
              min: parseFloat((compound.halfLifeYears * 0.8).toFixed(2)),
              max: parseFloat((compound.halfLifeYears * 1.2).toFixed(2)),
            };
            break;
          }
        }

        return {
          samplingConfig: { ...state.samplingConfig, compoundId: compound.id },
          parameters: {
            ...state.parameters,
            eliminationHalfLife: {
              ...state.parameters.eliminationHalfLife,
              distribution: updatedDist,
            },
          },
        };
      });
      get().addLog(
        `[Compound] Selected chemical compound '${compound.name}' (Half-Life T1/2 = ${compound.halfLifeYears} yrs).`,
      );
    }
  },

  loadScenario: (scenarioId) => {
    if (scenarioId === 'custom') {
      set({ activeScenarioId: 'custom' });
      get().addLog(`[Preset] Switched to Custom mode (parameters & compound unlocked).`);
      return;
    }
    const scenario = DEMOGRAPHIC_PRESETS.find((s) => s.id === scenarioId);
    if (scenario) {
      set({
        parameters: JSON.parse(JSON.stringify(scenario.parameters)),
        activeScenarioId: scenario.id,
      });
      get().addLog(`[Preset] Loaded scenario profile '${scenario.name}'.`);
    }
  },

  setSimulationResults: (results, summaryStats, sensitivityRanks, compoundSummaries) => {
    set({
      results,
      summaryStats,
      sensitivityRanks,
      compoundSummaries: compoundSummaries || null,
      isSimulating: false,
    });
    get().addLog(
      `[Simulation] Completed ${results.length.toLocaleString()} iterations. Mean Serum Css: ${summaryStats.mean.toFixed(4)} µg/L. Risk Exceedance (HQ > 1.0): ${summaryStats.riskExceedancePercent.toFixed(1)}%.`,
    );
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
      parameters: cloneDefaultParameters(),
      activeScenarioId: defaultScenario.id,
      samplingConfig: { ...DEFAULT_SAMPLING_CONFIG },
      results: null,
      summaryStats: null,
      sensitivityRanks: [],
      compoundSummaries: null,
      comparison: null,
    });
    get().addLog(`[System] Reset parameters to default baseline.`);
  },
}));
