import type { SamplingConfig, SimulationParameters } from '../types';
import {
  type ComparisonRunResult,
  runComparisonPipeline,
  runSimulationPipeline,
  type SimulationRunResult,
} from './simulationRunner';
import type { SimulationWorkerResponse } from './workers/simulationWorker';

export type SimulationAsyncResult = SimulationRunResult;
export type ComparisonAsyncResult = ComparisonRunResult;

/**
 * Execute simulation in a Web Worker (or main thread fallback if Web Worker is unavailable)
 */
export function executeSimulationAsync(
  parameters: SimulationParameters,
  samplingConfig: SamplingConfig,
): Promise<SimulationAsyncResult> {
  return new Promise((resolve, reject) => {
    if (typeof Worker !== 'undefined') {
      try {
        const worker = new Worker(new URL('./workers/simulationWorker.ts', import.meta.url), {
          type: 'module',
        });

        const reqId = `sim_${Date.now()}_${Math.random()}`;

        worker.onmessage = (event: MessageEvent<SimulationWorkerResponse>) => {
          if (event.data.id !== reqId) return;
          worker.terminate();

          if (event.data.error) {
            reject(new Error(event.data.error));
            return;
          }

          const data = event.data.data;
          if (
            data?.simResults &&
            data.summaryStats &&
            data.sensitivityRanks &&
            data.compoundSummaries
          ) {
            resolve({
              simResults: data.simResults,
              summaryStats: data.summaryStats,
              sensitivityRanks: data.sensitivityRanks,
              compoundSummaries: data.compoundSummaries,
            });
          } else {
            reject(new Error('Invalid worker response payload'));
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

    try {
      resolve(runSimulationPipeline(parameters, samplingConfig));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Execute comparison benchmark simulation in a Web Worker (or main thread fallback)
 */
export function executeComparisonAsync(
  parameters: SimulationParameters,
  iterations: number,
): Promise<ComparisonAsyncResult> {
  return new Promise((resolve, reject) => {
    if (typeof Worker !== 'undefined') {
      try {
        const worker = new Worker(new URL('./workers/simulationWorker.ts', import.meta.url), {
          type: 'module',
        });

        const reqId = `comp_${Date.now()}_${Math.random()}`;

        worker.onmessage = (event: MessageEvent<SimulationWorkerResponse>) => {
          if (event.data.id !== reqId) return;
          worker.terminate();

          if (event.data.error) {
            reject(new Error(event.data.error));
          } else if (event.data.data?.comparisonData) {
            resolve(event.data.data.comparisonData);
          } else {
            reject(new Error('Invalid worker comparison payload'));
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

    try {
      resolve(runComparisonPipeline(parameters, iterations));
    } catch (err) {
      reject(err);
    }
  });
}
