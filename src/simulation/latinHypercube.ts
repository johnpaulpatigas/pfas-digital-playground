import type { SimulationParameters, IterationResult, DistributionParams } from '../types';
import { createPRNG, quantileDistribution } from './distributions';
import { calculateToxicokinetics } from './toxicokinetics';

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
  prng: () => number
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
  seed: number = 42
): IterationResult[] {
  const prng = createPRNG(seed);

  const dailyIntakeSamples = generateLHSParameterSamples(parameters.dailyIntake.distribution, iterations, prng);
  const bodyWeightSamples = generateLHSParameterSamples(parameters.bodyWeight.distribution, iterations, prng);
  const ageSamples = generateLHSParameterSamples(parameters.age.distribution, iterations, prng);
  const waterConsumptionSamples = generateLHSParameterSamples(parameters.waterConsumption.distribution, iterations, prng);
  const bioavailabilitySamples = generateLHSParameterSamples(parameters.bioavailability.distribution, iterations, prng);
  const eliminationHalfLifeSamples = generateLHSParameterSamples(parameters.eliminationHalfLife.distribution, iterations, prng);
  const exposureDurationSamples = generateLHSParameterSamples(parameters.exposureDuration.distribution, iterations, prng);

  const results: IterationResult[] = new Array(iterations);

  for (let i = 0; i < iterations; i++) {
    results[i] = calculateToxicokinetics(
      {
        dailyIntake: Math.max(0.0001, dailyIntakeSamples[i]),
        bodyWeight: Math.max(20, bodyWeightSamples[i]),
        age: Math.max(1, ageSamples[i]),
        waterConsumption: Math.max(0.1, waterConsumptionSamples[i]),
        bioavailability: Math.max(0.01, Math.min(1.0, bioavailabilitySamples[i])),
        eliminationHalfLife: Math.max(0.1, eliminationHalfLifeSamples[i]),
        exposureDuration: Math.max(0.1, exposureDurationSamples[i]),
      },
      i + 1
    );
  }

  return results;
}
