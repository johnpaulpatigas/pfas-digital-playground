import type { SimulationParameters, SamplingMethod, IterationResult } from '../../types';
import { runMonteCarloSimulation } from '../monteCarlo';
import { runLatinHypercubeSimulation } from '../latinHypercube';
import { runMonteCarloLhsSimulation } from '../monteCarloLhs';
import { calculateSummaryStatistics, calculateSensitivityRanks } from '../statistics';

export interface SimulationWorkerRequest {
  id: string;
  type: 'RUN_SIMULATION' | 'RUN_COMPARISON';
  parameters: SimulationParameters;
  samplingConfig?: {
    method: SamplingMethod;
    iterations: number;
    seed?: number;
    compoundId?: string;
  };
  iterations?: number;
}

export interface SimulationWorkerResponse {
  id: string;
  type: 'RUN_SIMULATION' | 'RUN_COMPARISON';
  error?: string;
  data?: {
    simResults?: IterationResult[];
    summaryStats?: ReturnType<typeof calculateSummaryStatistics>;
    sensitivityRanks?: ReturnType<typeof calculateSensitivityRanks>;
    comparisonData?: {
      mcResults: IterationResult[];
      lhsResults: IterationResult[];
      mcLhsResults: IterationResult[];
      mcRuntimeMs: number;
      lhsRuntimeMs: number;
      mcLhsRuntimeMs: number;
    };
  };
}

self.onmessage = (event: MessageEvent<SimulationWorkerRequest>) => {
  const { id, type, parameters, samplingConfig, iterations = 5000 } = event.data;

  try {
    if (type === 'RUN_SIMULATION' && samplingConfig) {
      let simResults: IterationResult[];
      if (samplingConfig.method === 'monte-carlo') {
        simResults = runMonteCarloSimulation(parameters, samplingConfig.iterations, samplingConfig.seed);
      } else if (samplingConfig.method === 'latin-hypercube') {
        simResults = runLatinHypercubeSimulation(parameters, samplingConfig.iterations, samplingConfig.seed);
      } else {
        simResults = runMonteCarloLhsSimulation(parameters, samplingConfig.iterations, samplingConfig.seed);
      }

      const summaryStats = calculateSummaryStatistics(simResults, 'steadyStateConcentration');
      const sensitivityRanks = calculateSensitivityRanks(simResults, parameters, 'steadyStateConcentration');

      const response: SimulationWorkerResponse = {
        id,
        type,
        data: {
          simResults,
          summaryStats,
          sensitivityRanks,
        },
      };
      self.postMessage(response);
    } else if (type === 'RUN_COMPARISON') {
      const t0_mc = performance.now();
      const mcResults = runMonteCarloSimulation(parameters, iterations, 42);
      const t1_mc = performance.now();

      const t0_lhs = performance.now();
      const lhsResults = runLatinHypercubeSimulation(parameters, iterations, 42);
      const t1_lhs = performance.now();

      const t0_mcLhs = performance.now();
      const mcLhsResults = runMonteCarloLhsSimulation(parameters, iterations, 42);
      const t1_mcLhs = performance.now();

      const response: SimulationWorkerResponse = {
        id,
        type,
        data: {
          comparisonData: {
            mcResults,
            lhsResults,
            mcLhsResults,
            mcRuntimeMs: parseFloat((t1_mc - t0_mc).toFixed(2)),
            lhsRuntimeMs: parseFloat((t1_lhs - t0_lhs).toFixed(2)),
            mcLhsRuntimeMs: parseFloat((t1_mcLhs - t0_mcLhs).toFixed(2)),
          },
        },
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
