import type { SimulationParameters, SamplingConfig, IterationResult, SummaryStatistics, SensitivityRank, CompoundSummary } from '../types';
import type { SimulationWorkerResponse } from './workers/simulationWorker';
import { runMonteCarloSimulation } from './monteCarlo';
import { runLatinHypercubeSimulation } from './latinHypercube';
import { runMonteCarloLhsSimulation } from './monteCarloLhs';
import { calculateSummaryStatistics, calculateSensitivityRanks } from './statistics';
import { calculateCompoundSummaries } from './toxicokinetics';

export interface SimulationAsyncResult {
  simResults: IterationResult[];
  summaryStats: SummaryStatistics;
  sensitivityRanks: SensitivityRank[];
  compoundSummaries?: CompoundSummary[];
}

export interface ComparisonAsyncResult {
  mcResults: IterationResult[];
  lhsResults: IterationResult[];
  mcLhsResults: IterationResult[];
  mcRuntimeMs: number;
  lhsRuntimeMs: number;
  mcLhsRuntimeMs: number;
}

/**
 * Execute simulation in a Web Worker (or main thread fallback if Web Worker is unavailable)
 */
export function executeSimulationAsync(
  parameters: SimulationParameters,
  samplingConfig: SamplingConfig
): Promise<SimulationAsyncResult> {
  return new Promise((resolve, reject) => {
    if (typeof Worker !== 'undefined') {
      try {
        const worker = new Worker(new URL('./workers/simulationWorker.ts', import.meta.url), {
          type: 'module',
        });

        const reqId = `sim_${Date.now()}_${Math.random()}`;

        worker.onmessage = (event: MessageEvent<SimulationWorkerResponse>) => {
          if (event.data.id === reqId) {
            worker.terminate();
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else if (event.data.data?.simResults && event.data.data.summaryStats && event.data.data.sensitivityRanks) {
              resolve({
                simResults: event.data.data.simResults,
                summaryStats: event.data.data.summaryStats,
                sensitivityRanks: event.data.data.sensitivityRanks,
                compoundSummaries: event.data.data.compoundSummaries || calculateCompoundSummaries(event.data.data.simResults, parameters),
              });
            } else {
              reject(new Error('Invalid worker response payload'));
            }
          }
        };

        worker.onerror = (err) => {
          worker.terminate();
          reject(err);
        };

        worker.postMessage({
          id: reqId,
          type: 'RUN_SIMULATION',
          parameters,
          samplingConfig,
        });
        return;
      } catch {
        // Fallback to main thread execution if Worker instantiation fails
      }
    }

    // Main thread fallback
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
    const compoundSummaries = calculateCompoundSummaries(simResults, parameters);

    resolve({ simResults, summaryStats, sensitivityRanks, compoundSummaries });
  });
}

/**
 * Execute comparison benchmark simulation in a Web Worker (or main thread fallback)
 */
export function executeComparisonAsync(
  parameters: SimulationParameters,
  iterations: number
): Promise<ComparisonAsyncResult> {
  return new Promise((resolve, reject) => {
    if (typeof Worker !== 'undefined') {
      try {
        const worker = new Worker(new URL('./workers/simulationWorker.ts', import.meta.url), {
          type: 'module',
        });

        const reqId = `comp_${Date.now()}_${Math.random()}`;

        worker.onmessage = (event: MessageEvent<SimulationWorkerResponse>) => {
          if (event.data.id === reqId) {
            worker.terminate();
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else if (event.data.data?.comparisonData) {
              resolve(event.data.data.comparisonData);
            } else {
              reject(new Error('Invalid worker comparison payload'));
            }
          }
        };

        worker.onerror = (err) => {
          worker.terminate();
          reject(err);
        };

        worker.postMessage({
          id: reqId,
          type: 'RUN_COMPARISON',
          parameters,
          iterations,
        });
        return;
      } catch {
        // Fallback to main thread execution
      }
    }

    // Main thread fallback
    const t0_mc = performance.now();
    const mcResults = runMonteCarloSimulation(parameters, iterations, 42);
    const t1_mc = performance.now();

    const t0_lhs = performance.now();
    const lhsResults = runLatinHypercubeSimulation(parameters, iterations, 42);
    const t1_lhs = performance.now();

    const t0_mcLhs = performance.now();
    const mcLhsResults = runMonteCarloLhsSimulation(parameters, iterations, 42);
    const t1_mcLhs = performance.now();

    resolve({
      mcResults,
      lhsResults,
      mcLhsResults,
      mcRuntimeMs: parseFloat((t1_mc - t0_mc).toFixed(2)),
      lhsRuntimeMs: parseFloat((t1_lhs - t0_lhs).toFixed(2)),
      mcLhsRuntimeMs: parseFloat((t1_mcLhs - t0_mcLhs).toFixed(2)),
    });
  });
}
