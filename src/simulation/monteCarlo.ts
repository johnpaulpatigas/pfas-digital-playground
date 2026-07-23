import type { SimulationParameters, IterationResult } from '../types';
import { createPRNG, sampleDistribution } from './distributions';
import { calculateToxicokinetics } from './toxicokinetics';

/**
 * Monte Carlo Sampling Simulation Engine
 * Performs N random draws across all parameter distributions and evaluates toxicokinetic outputs.
 */
export function runMonteCarloSimulation(
  parameters: SimulationParameters,
  iterations: number = 5000,
  seed: number = 42
): IterationResult[] {
  const prng = createPRNG(seed);
  const results: IterationResult[] = new Array(iterations);

  for (let i = 0; i < iterations; i++) {
    const dailyIntake = sampleDistribution(parameters.dailyIntake.distribution, prng);
    const bodyWeight = sampleDistribution(parameters.bodyWeight.distribution, prng);
    const age = sampleDistribution(parameters.age.distribution, prng);
    const waterConsumption = sampleDistribution(parameters.waterConsumption.distribution, prng);
    const bioavailability = sampleDistribution(parameters.bioavailability.distribution, prng);
    const eliminationHalfLife = sampleDistribution(parameters.eliminationHalfLife.distribution, prng);
    const exposureDuration = sampleDistribution(parameters.exposureDuration.distribution, prng);

    results[i] = calculateToxicokinetics(
      {
        dailyIntake: Math.max(0.0001, dailyIntake),
        bodyWeight: Math.max(20, bodyWeight),
        age: Math.max(1, age),
        waterConsumption: Math.max(0.1, waterConsumption),
        bioavailability: Math.max(0.01, Math.min(1.0, bioavailability)),
        eliminationHalfLife: Math.max(0.1, eliminationHalfLife),
        exposureDuration: Math.max(0.1, exposureDuration),
      },
      i + 1
    );
  }

  return results;
}
