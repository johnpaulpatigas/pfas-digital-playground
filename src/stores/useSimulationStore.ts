import { create } from 'zustand';
import type {
  SimulationParameters,
  SamplingConfig,
  IterationResult,
  SummaryStatistics,
  SensitivityRank,
  ComparisonResult,
  DistributionParams,
  PlaygroundMode,
  CompoundSummary,
  SimpleProfile,
} from '../types';
import { DEMOGRAPHIC_PRESETS } from '../features/scenarios/presets';
import { PFAS_COMPOUNDS } from '../simulation/pfasCompounds';
import { deriveAutomatedParameters } from '../simulation/toxicokinetics';


interface SimulationState {
  // Config state
  mode: PlaygroundMode;
  simpleProfile: SimpleProfile;
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
  setPlaygroundMode: (mode: PlaygroundMode) => void;
  updateSimpleProfile: (profile: Partial<SimpleProfile>) => void;
  setParameterDistribution: (paramId: keyof SimulationParameters, distribution: DistributionParams) => void;
  updateParameterValue: (paramId: keyof SimulationParameters, key: string, value: number) => void;
  setSamplingConfig: (config: Partial<SamplingConfig>) => void;
  setCompoundId: (compoundId: string) => void;
  loadScenario: (scenarioId: string) => void;
  setSimulationResults: (
    results: IterationResult[],
    summaryStats: SummaryStatistics,
    sensitivityRanks: SensitivityRank[],
    compoundSummaries?: CompoundSummary[]
  ) => void;
  setComparisonResults: (comparison: ComparisonResult) => void;
  setIsSimulating: (isSimulating: boolean) => void;
  addLog: (message: string) => void;
  clearLogs: () => void;
  resetToDefault: () => void;
}

const defaultScenario = DEMOGRAPHIC_PRESETS[0];
const initialSimpleProfile: SimpleProfile = {
  bodyWeight: 55.4,
  age: 30,
  waterConsumption: 2.0,
  waterConcentrationNgL: 20,
};

const initialDerived = deriveAutomatedParameters(initialSimpleProfile);

export const useSimulationStore = create<SimulationState>((set, get) => ({
  mode: 'simple',
  simpleProfile: initialSimpleProfile,
  parameters: initialDerived.parameters,
  samplingConfig: {
    method: 'monte-carlo-lhs',
    iterations: 25000,
    seed: 42,
    compoundId: 'pfoa',
  },
  activeScenarioId: defaultScenario.id,

  isSimulating: false,
  results: null,
  summaryStats: null,
  sensitivityRanks: [],
  compoundSummaries: null,
  comparison: null,

  logs: [`[System] Initialized PFAS Toxicokinetic Playground in Simple Mode with automated exposure parameters.`],

  setPlaygroundMode: (mode) => {
    set((state) => {
      const activeScenario = DEMOGRAPHIC_PRESETS.find((s) => s.id === state.activeScenarioId);
      let newParams = state.parameters;
      if (mode === 'simple') {
        if (activeScenario && state.activeScenarioId !== 'custom') {
          newParams = JSON.parse(JSON.stringify(activeScenario.parameters));
        } else {
          newParams = deriveAutomatedParameters(state.simpleProfile).parameters;
        }
      }
      return {
        mode,
        parameters: newParams,
        samplingConfig:
          mode === 'simple'
            ? { ...state.samplingConfig, method: 'monte-carlo-lhs', iterations: 25000 }
            : state.samplingConfig,
      };
    });
    get().addLog(`[Mode] Switched to ${mode === 'simple' ? 'Simple Mode (3-Input Auto-Parameters & MC+LHS)' : 'Advanced Mode (Granular Parameters)'}.`);
  },

  updateSimpleProfile: (profileUpdate) => {
    set((state) => {
      const newProfile = { ...state.simpleProfile, ...profileUpdate };
      const derived = deriveAutomatedParameters(newProfile);
      const activeScenario = DEMOGRAPHIC_PRESETS.find((s) => s.id === state.activeScenarioId);
      const isStillPreset = activeScenario?.simpleProfile
        ? Math.abs(newProfile.bodyWeight - activeScenario.simpleProfile.bodyWeight) < 0.01 &&
          newProfile.age === activeScenario.simpleProfile.age &&
          Math.abs(newProfile.waterConsumption - activeScenario.simpleProfile.waterConsumption) < 0.01
        : false;

      return {
        simpleProfile: newProfile,
        parameters: derived.parameters,
        activeScenarioId: isStillPreset ? state.activeScenarioId : 'custom',
      };
    });
    const current = get().simpleProfile;
    get().addLog(`[Simple Profile] Updated: BW=${current.bodyWeight}kg, Age=${current.age}y, Water=${current.waterConsumption}L/d -> Auto-calculated Daily Intake.`);
  },

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
      const updatedProfile: SimpleProfile = scenario.simpleProfile
        ? { ...scenario.simpleProfile }
        : {
            bodyWeight:
              scenario.parameters.bodyWeight.distribution.type === 'normal'
                ? scenario.parameters.bodyWeight.distribution.mean
                : 55.4,
            age: 30,
            waterConsumption: 2.0,
            waterConcentrationNgL: 20,
          };

      set({
        parameters: JSON.parse(JSON.stringify(scenario.parameters)),
        activeScenarioId: scenario.id,
        simpleProfile: updatedProfile,
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
    get().addLog(`[Simulation] Completed ${results.length.toLocaleString()} iterations. Mean Serum Css: ${summaryStats.mean.toFixed(4)} µg/L. Risk Exceedance (HQ > 1.0): ${summaryStats.riskExceedancePercent.toFixed(1)}%.`);
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
    set((state) => {
      const defaultProfile = defaultScenario.simpleProfile
        ? { ...defaultScenario.simpleProfile }
        : { ...initialSimpleProfile };
      return {
        simpleProfile: defaultProfile,
        parameters: JSON.parse(JSON.stringify(defaultScenario.parameters)),
        activeScenarioId: defaultScenario.id,
        samplingConfig: {
          method: state.mode === 'simple' ? 'monte-carlo-lhs' : 'monte-carlo',
          iterations: state.mode === 'simple' ? 25000 : 5000,
          seed: 42,
          compoundId: 'pfoa',
        },
        results: null,
        summaryStats: null,
        sensitivityRanks: [],
        compoundSummaries: null,
        comparison: null,
      };
    });
    get().addLog(`[System] Reset parameters to default baseline.`);
  },
}));
