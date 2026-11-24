import type { IterationResult, SimulationParameters } from '../types';
import { createPRNG, sampleDistribution } from './distributions';
import { evaluateParameterSample, sampleParameterSet } from './sampling';

/**
 * Monte Carlo Sampling Simulation Engine
 * Performs N random draws across all parameter distributions and evaluates toxicokinetic outputs.
 */
export function runMonteCarloSimulation(
  parameters: SimulationParameters,
  iterations: number = 5000,
  seed: number = 42,
  compoundId: string = 'pfoa',
): IterationResult[] {
  const prng = createPRNG(seed);
  const results: IterationResult[] = new Array(iterations);

  for (let i = 0; i < iterations; i++) {
    const samples = sampleParameterSet(parameters, (dist) => sampleDistribution(dist, prng));
    results[i] = evaluateParameterSample(samples, i + 1, compoundId);
  }

  return results;
}
