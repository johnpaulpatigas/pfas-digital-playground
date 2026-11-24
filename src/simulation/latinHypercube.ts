import type { DistributionParams, IterationResult, SimulationParameters } from '../types';
import { createPRNG, quantileDistribution } from './distributions';
import { PARAMETER_KEYS } from './parameters';
import { evaluateParameterSample, type ParameterSampleValues } from './sampling';

/**
 * Fisher-Yates Array Shuffle algorithm using PRNG
 */
function shuffle<T>(array: T[], prng: () => number): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate N stratified samples for a parameter distribution using LHS inverse CDF
 */
function generateLHSParameterSamples(
  dist: DistributionParams,
  N: number,
  prng: () => number,
): number[] {
  const samples = new Array<number>(N);
  for (let k = 0; k < N; k++) {
    // Stratum bounds: [(k)/N, (k+1)/N]
    const u = prng();
    const prob = (k + u) / N;
    samples[k] = quantileDistribution(dist, prob);
  }
  // Randomize stratum ordering across parameter dimensions
  return shuffle(samples, prng);
}

/**
 * Latin Hypercube Sampling (LHS) Engine
 * Ensures uniform stratification across all N intervals of the CDF.
 */
export function runLatinHypercubeSimulation(
  parameters: SimulationParameters,
  iterations: number = 5000,
  seed: number = 42,
  compoundId: string = 'pfoa',
): IterationResult[] {
  const prng = createPRNG(seed);

  // Stratify each parameter independently, then pair strata by iteration index.
  const sampleArrays = {} as Record<keyof SimulationParameters, number[]>;
  for (const key of PARAMETER_KEYS) {
    sampleArrays[key] = generateLHSParameterSamples(parameters[key].distribution, iterations, prng);
  }

  const results: IterationResult[] = new Array(iterations);

  for (let i = 0; i < iterations; i++) {
    const samples = {} as ParameterSampleValues;
    for (const key of PARAMETER_KEYS) {
      samples[key] = sampleArrays[key][i];
    }
    results[i] = evaluateParameterSample(samples, i + 1, compoundId);
  }

  return results;
}
