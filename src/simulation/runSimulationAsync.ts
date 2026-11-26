import type { SamplingConfig, SimulationParameters } from '../types';
import {
  type ComparisonRunResult,
  runComparisonPipeline,
  runSimulationPipeline,
  type SimulationRunResult,
} from './simulationRunner';
import type { SimulationWorkerRequest, SimulationWorkerResponse } from './workers/simulationWorker';

export type SimulationAsyncResult = SimulationRunResult;
export type ComparisonAsyncResult = ComparisonRunResult;

type WorkerData = SimulationWorkerResponse['data'];

interface PendingRequest {
  resolve: (data: WorkerData | undefined) => void;
  reject: (error: Error) => void;
}

let worker: Worker | null = null;
let requestCounter = 0;
const pendingRequests = new Map<string, PendingRequest>();

/**
 * Keep a single worker alive so repeated simulations don't pay startup cost.
 * Requests are routed by id, so concurrent runs can share the same worker.
 */
function getOrCreateWorker(): Worker | null {
  if (worker) return worker;
  if (typeof Worker === 'undefined') return null;

  try {
    const instance = new Worker(new URL('./workers/simulationWorker.ts', import.meta.url), {
      type: 'module',
    });

    instance.onmessage = (event: MessageEvent<SimulationWorkerResponse>) => {
      const { id, data, error } = event.data;
      const pending = pendingRequests.get(id);
      if (!pending) return;

      pendingRequests.delete(id);
      if (error) pending.reject(new Error(error));
      else pending.resolve(data);
    };

    instance.onerror = (event) => {
      const error = new Error(event.message || 'Simulation worker error');
      for (const pending of pendingRequests.values()) pending.reject(error);
      pendingRequests.clear();
      instance.terminate();
      if (worker === instance) worker = null;
    };

    worker = instance;
    return instance;
  } catch {
    return null;
  }
}

function postWorkerRequest(
  request: Omit<SimulationWorkerRequest, 'id'>,
): Promise<WorkerData | undefined> | null {
  const instance = getOrCreateWorker();
  if (!instance) return null;

  const id = `req_${++requestCounter}`;
  return new Promise<WorkerData | undefined>((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    try {
      instance.postMessage({ ...request, id });
    } catch (err) {
      pendingRequests.delete(id);
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

/**
 * Start the shared worker ahead of the first run so its startup cost is not
 * part of the first Playground simulation. Safe to call repeatedly.
 */
export function prewarmSimulationWorker(): void {
  getOrCreateWorker();
}

/**
 * Execute simulation in a Web Worker (or main thread fallback if Web Worker is unavailable)
 */
export function executeSimulationAsync(
  parameters: SimulationParameters,
  samplingConfig: SamplingConfig,
): Promise<SimulationAsyncResult> {
  const workerData = postWorkerRequest({ type: 'RUN_SIMULATION', parameters, samplingConfig });
  if (workerData) {
    return workerData.then((data) => {
      if (
        data?.simResults &&
        data.summaryStats &&
        data.sensitivityRanks &&
        data.compoundSummaries
      ) {
        return {
          simResults: data.simResults,
          summaryStats: data.summaryStats,
          sensitivityRanks: data.sensitivityRanks,
          compoundSummaries: data.compoundSummaries,
        };
      }
      throw new Error('Invalid worker response payload');
    });
  }

  return Promise.resolve().then(() => runSimulationPipeline(parameters, samplingConfig));
}

/**
 * Execute comparison benchmark simulation in a Web Worker (or main thread fallback)
 */
export function executeComparisonAsync(
  parameters: SimulationParameters,
  iterations: number,
): Promise<ComparisonAsyncResult> {
  const workerData = postWorkerRequest({ type: 'RUN_COMPARISON', parameters, iterations });
  if (workerData) {
    return workerData.then((data) => {
      if (data?.comparisonData) return data.comparisonData;
      throw new Error('Invalid worker comparison payload');
    });
  }

  return Promise.resolve().then(() => runComparisonPipeline(parameters, iterations));
}
