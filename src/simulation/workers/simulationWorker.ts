import type {
  CompoundSummary,
  IterationResult,
  SamplingConfig,
  SensitivityRank,
  SimulationParameters,
  SummaryStatistics,
} from '../../types';
import {
  type ComparisonRunResult,
  runComparisonPipeline,
  runSimulationPipeline,
} from '../simulationRunner';

export interface SimulationWorkerRequest {
  id: string;
  type: 'RUN_SIMULATION' | 'RUN_COMPARISON';
  parameters: SimulationParameters;
  samplingConfig?: SamplingConfig;
  iterations?: number;
}

export interface SimulationWorkerResponse {
  id: string;
  type: 'RUN_SIMULATION' | 'RUN_COMPARISON';
  error?: string;
  data?: {
    simResults?: IterationResult[];
    summaryStats?: SummaryStatistics;
    sensitivityRanks?: SensitivityRank[];
    compoundSummaries?: CompoundSummary[];
    comparisonData?: ComparisonRunResult;
  };
}

self.onmessage = (event: MessageEvent<SimulationWorkerRequest>) => {
  const { id, type, parameters, samplingConfig, iterations = 25000 } = event.data;

  try {
    if (type === 'RUN_SIMULATION' && samplingConfig) {
      const response: SimulationWorkerResponse = {
        id,
        type,
        data: runSimulationPipeline(parameters, samplingConfig),
      };
      self.postMessage(response);
    } else if (type === 'RUN_COMPARISON') {
      const response: SimulationWorkerResponse = {
        id,
        type,
        data: { comparisonData: runComparisonPipeline(parameters, iterations) },
      };
      self.postMessage(response);
    }
  } catch (err: unknown) {
    self.postMessage({
      id,
      type,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
