import type {
  CompoundSummary,
  IterationResult,
  SamplingConfig,
  SensitivityRank,
  SimulationParameters,
  SummaryStatistics,
} from '../types';
import { runLatinHypercubeSimulation } from './latinHypercube';
import { runMonteCarloSimulation } from './monteCarlo';
import { runMonteCarloLhsSimulation } from './monteCarloLhs';
import { calculateSensitivityRanks, calculateSummaryStatistics } from './statistics';
import { calculateCompoundSummaries } from './toxicokinetics';

export interface SimulationRunResult {
  simResults: IterationResult[];
  summaryStats: SummaryStatistics;
  sensitivityRanks: SensitivityRank[];
  compoundSummaries: CompoundSummary[];
}

export interface ComparisonRunResult {
  mcResults: IterationResult[];
  lhsResults: IterationResult[];
  mcLhsResults: IterationResult[];
  mcRuntimeMs: number;
  lhsRuntimeMs: number;
  mcLhsRuntimeMs: number;
}

/**
 * Dispatch a sampling configuration to the matching simulation engine.
 */
export function runSampling(
  parameters: SimulationParameters,
  samplingConfig: SamplingConfig,
): IterationResult[] {
  const activeCompoundId = samplingConfig.compoundId || 'pfoa';

  switch (samplingConfig.method) {
    case 'monte-carlo':
      return runMonteCarloSimulation(
        parameters,
        samplingConfig.iterations,
        samplingConfig.seed,
        activeCompoundId,
      );
    case 'latin-hypercube':
      return runLatinHypercubeSimulation(
        parameters,
        samplingConfig.iterations,
        samplingConfig.seed,
        activeCompoundId,
      );
    case 'monte-carlo-lhs':
      return runMonteCarloLhsSimulation(
        parameters,
        samplingConfig.iterations,
        samplingConfig.seed,
        activeCompoundId,
      );
  }
}

/**
 * Run a sampling simulation and derive every statistic the playground displays.
 */
export function runSimulationPipeline(
  parameters: SimulationParameters,
  samplingConfig: SamplingConfig,
): SimulationRunResult {
  const simResults = runSampling(parameters, samplingConfig);

  return {
    simResults,
    summaryStats: calculateSummaryStatistics(simResults, 'steadyStateConcentration'),
    sensitivityRanks: calculateSensitivityRanks(simResults, parameters, 'steadyStateConcentration'),
    compoundSummaries: calculateCompoundSummaries(simResults, parameters),
  };
}

/**
 * Run the three sampling engines back-to-back and time each one.
 */
export function runComparisonPipeline(
  parameters: SimulationParameters,
  iterations: number,
): ComparisonRunResult {
  const t0_mc = performance.now();
  const mcResults = runMonteCarloSimulation(parameters, iterations, 42);
  const t1_mc = performance.now();

  const t0_lhs = performance.now();
  const lhsResults = runLatinHypercubeSimulation(parameters, iterations, 42);
  const t1_lhs = performance.now();

  const t0_mcLhs = performance.now();
  const mcLhsResults = runMonteCarloLhsSimulation(parameters, iterations, 42);
  const t1_mcLhs = performance.now();

  return {
    mcResults,
    lhsResults,
    mcLhsResults,
    mcRuntimeMs: parseFloat((t1_mc - t0_mc).toFixed(2)),
    lhsRuntimeMs: parseFloat((t1_lhs - t0_lhs).toFixed(2)),
    mcLhsRuntimeMs: parseFloat((t1_mcLhs - t0_mcLhs).toFixed(2)),
  };
}
